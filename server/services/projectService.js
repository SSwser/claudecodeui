import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { db } from '../database/db.js';
import {
  addProjectManually,
  getGitCommonDir,
  getGitBranch,
  getProjectSessionSnapshot,
} from '../projects.js';

const PROJECT_SORTS = {
  name: 'LOWER(COALESCE(p.display_name, p.name)) ASC',
  recent: 'p.updated_at DESC',
  created: 'p.created_at DESC',
};

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      ...options,
      shell: false,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      const error = new Error(stderr.trim() || stdout.trim() || `Command failed: ${command}`);
      error.code = code;
      reject(error);
    });
  });
}

function broadcastMessage(wss, payload) {
  if (!wss?.clients) {
    return;
  }

  const message = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(message);
    }
  }
}

function mapProjectRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    directoryPath: row.directory_path,
    multiWorkspaceEnabled: Boolean(row.multi_workspace_enabled),
    isDeleted: Boolean(row.is_deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    workspaceCount: Number(row.workspace_count || 0),
    activeSessionCount: Number(row.active_session_count || 0),
  };
}

function mapWorkspaceRow(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    worktreePath: row.worktree_path,
    worktreeBranch: row.worktree_branch,
    status: row.status || 'active',
    isStale: Boolean(row.is_stale),
    staleDetectedAt: row.stale_detected_at || null,
    archivedAt: row.archived_at || null,
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
  };
}

function getRepoRootFromGitCommonDir(gitCommonDir) {
  if (!gitCommonDir) {
    return null;
  }

  const resolvedGitCommonDir = path.resolve(gitCommonDir);
  if (path.basename(resolvedGitCommonDir).toLowerCase() !== '.git') {
    return null;
  }

  return path.dirname(resolvedGitCommonDir);
}

function getCanonicalProjectDisplayName(project) {
  const repoRoot = getRepoRootFromGitCommonDir(project.gitCommonDir);
  if (!repoRoot) {
    return project.displayName || project.name;
  }

  const resolvedProjectPath = project.directoryPath ? path.resolve(project.directoryPath) : null;
  if (resolvedProjectPath === repoRoot && project.displayName) {
    return project.displayName;
  }

  return path.basename(repoRoot) || project.displayName || project.name;
}

function getWorkspacePathName(worktreePath) {
  if (!worktreePath) {
    return null;
  }

  const resolvedPath = path.resolve(worktreePath);
  return path.basename(resolvedPath) || null;
}

function getWorkspaceDisplayName({ name, worktreePath, worktreeBranch }) {
  const pathName = getWorkspacePathName(worktreePath);

  if (name && name !== worktreeBranch && name !== pathName) {
    return name;
  }

  return pathName || worktreeBranch || name || 'workspace';
}

function shouldSyncWorkspaceName(currentName, worktreePath, worktreeBranch) {
  const pathName = getWorkspacePathName(worktreePath);
  if (!pathName) {
    return false;
  }

  return !currentName || currentName === worktreeBranch || currentName === pathName;
}

function getProjectPathPriority(project) {
  let priority = 0;

  if (project._isWorkspaceExpansion) {
    priority += 4;
  }

  if (project.multiWorkspaceEnabled) {
    priority += 2;
  }

  if (project.gitCommonDir) {
    priority += 1;
  }

  return priority;
}

function hasLiveWorktreePath(liveWorktreePaths, candidatePath) {
  if (!liveWorktreePaths || liveWorktreePaths.size === 0 || !candidatePath) {
    return true;
  }

  return liveWorktreePaths.has(path.resolve(candidatePath));
}

function getStaleWorkspaceRows(workspaces, liveWorktreePaths) {
  return workspaces.filter(
    (workspace) =>
      Boolean(workspace.worktreePath) &&
      workspace.status === 'active' &&
      !workspace.isDefault &&
      !hasLiveWorktreePath(liveWorktreePaths, workspace.worktreePath)
  );
}

function formatWorkspaceLogLabel(workspace) {
  const workspacePath = workspace.worktreePath ? path.resolve(workspace.worktreePath) : 'unknown';
  return `${workspace.id}:${workspace.name} -> ${workspacePath}`;
}

function logStaleWorkspaceEvent(
  action,
  { projectId, directoryPath },
  staleWorkspaces,
  liveWorktreePaths,
  logger = console
) {
  if (!staleWorkspaces.length) {
    return;
  }

  const livePaths =
    Array.from(liveWorktreePaths || [])
      .sort()
      .join(', ') || 'unavailable';
  const stalePaths = staleWorkspaces.map(formatWorkspaceLogLabel).join('; ');
  const message = `[projectService] ${action} ${staleWorkspaces.length} stale worktree workspace(s) for project ${projectId} (${path.resolve(directoryPath)}). Live worktrees: ${livePaths}. Stale rows: ${stalePaths}`;

  if (action.startsWith('Cleared') || action.startsWith('Archived')) {
    (logger.info || logger.log).call(logger, message);
    return;
  }

  (logger.warn || logger.log).call(logger, message);
}

function buildLiveWorktreeState(directoryPath, worktrees = []) {
  const resolvedDirectoryPath = path.resolve(directoryPath);
  const liveWorktrees = worktrees
    .filter((worktree) => !worktree.isBare)
    .map((worktree) => ({
      ...worktree,
      path: path.resolve(worktree.path),
    }));

  return {
    directoryPath: resolvedDirectoryPath,
    liveWorktrees,
    liveWorktreePaths: new Set(liveWorktrees.map((worktree) => worktree.path)),
  };
}

function mapSessionRow(row) {
  return {
    id: row.id,
    sessionId: row.session_id,
    workspaceId: row.workspace_id,
    workspaceName: row.workspace_name,
    provider: row.provider,
    status: row.status,
    title: row.title,
    summary: row.summary,
    lastActivity: row.last_activity,
    frozenAt: row.frozen_at,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
  };
}

function flattenProjectSessions(project) {
  return [
    ...(project.sessions || []).map((session) => ({ provider: 'claude', session })),
    ...(project.cursorSessions || []).map((session) => ({ provider: 'cursor', session })),
    ...(project.codexSessions || []).map((session) => ({ provider: 'codex', session })),
    ...(project.geminiSessions || []).map((session) => ({ provider: 'gemini', session })),
  ];
}

function normalizeSessionText(value) {
  if (value == null) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function normalizeSessionTimestamp(session) {
  const value =
    session.lastActivity ||
    session.updated_at ||
    session.createdAt ||
    session.created_at ||
    new Date().toISOString();

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }

  if (typeof value === 'string') {
    return value;
  }

  return new Date().toISOString();
}

function upsertDiscoveredSessions(workspaceId, discoveredProject) {
  const upsertSession = db.prepare(
    `INSERT INTO session_state (
       session_id,
       workspace_id,
       provider,
       status,
       title,
       summary,
       last_activity
     ) VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(session_id, provider) DO UPDATE SET
       workspace_id = excluded.workspace_id,
       title = excluded.title,
       summary = excluded.summary,
       last_activity = excluded.last_activity`
  );

  let scanned = 0;
  const existingCount = db.prepare('SELECT COUNT(*) AS count FROM session_state').get().count;

  for (const { provider, session } of flattenProjectSessions(discoveredProject)) {
    scanned += 1;
    const title = normalizeSessionText(session.title || session.name || session.summary || null);
    const summary = normalizeSessionText(session.summary || session.name || null);
    const lastActivity = normalizeSessionTimestamp(session);

    upsertSession.run(
      normalizeSessionText(session.id),
      workspaceId,
      provider,
      'active',
      title,
      summary,
      lastActivity
    );
  }

  const updatedCount = db.prepare('SELECT COUNT(*) AS count FROM session_state').get().count;
  return { inserted: updatedCount - existingCount, scanned };
}

async function ensureProjectRegistered(projectPath, displayName) {
  try {
    await addProjectManually(projectPath, displayName);
  } catch (error) {
    if (!String(error.message).includes('Project already configured')) {
      throw error;
    }
  }
}

function getSortClause(sort) {
  if (sort === 'favorites') {
    // Favorites are stored in client-side home preferences today, so the backend accepts the
    // sort mode but falls back to recent activity ordering until a shared favorite model exists.
    return PROJECT_SORTS.recent;
  }

  return PROJECT_SORTS[sort] || PROJECT_SORTS.recent;
}

function getProjectRowById(projectId) {
  return db
    .prepare(
      `SELECT
         p.*,
         COUNT(DISTINCT w.id) AS workspace_count,
         COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) AS active_session_count
       FROM projects p
       LEFT JOIN workspaces w ON w.project_id = p.id
       LEFT JOIN session_state s ON s.workspace_id = w.id
       WHERE p.id = ?
       GROUP BY p.id`
    )
    .get(projectId);
}

function getDefaultWorkspace(projectId) {
  return db
    .prepare(
      `SELECT *
       FROM workspaces
       WHERE project_id = ?
       ORDER BY is_default DESC, id ASC
       LIMIT 1`
    )
    .get(projectId);
}

export async function detectWorktrees(directoryPath) {
  try {
    const { stdout } = await runCommand('git', ['worktree', 'list', '--porcelain'], {
      cwd: directoryPath,
    });

    const lines = stdout.split(/\r?\n/);
    const worktrees = [];
    let current = null;

    for (const line of lines) {
      if (!line.trim()) {
        if (current?.path) {
          worktrees.push(current);
        }
        current = null;
        continue;
      }

      const [key, ...rest] = line.split(' ');
      const value = rest.join(' ').trim();

      if (key === 'worktree') {
        if (current?.path) {
          worktrees.push(current);
        }
        current = { path: value };
        continue;
      }

      if (!current) {
        continue;
      }

      if (key === 'branch') {
        current.branch = value.replace('refs/heads/', '');
      } else if (key === 'HEAD') {
        current.head = value;
      } else if (key === 'bare') {
        current.isBare = true;
      }
    }

    if (current?.path) {
      worktrees.push(current);
    }

    return worktrees;
  } catch {
    return [];
  }
}

export async function inspectStaleWorkspaceRows(projectId, directoryPath, { worktrees } = {}) {
  const liveWorktreeState = buildLiveWorktreeState(
    directoryPath,
    worktrees ?? (await detectWorktrees(directoryPath))
  );
  const workspaces = db
    .prepare(
      `SELECT *
       FROM workspaces
       WHERE project_id = ?
         AND worktree_path IS NOT NULL
         AND status = 'active'
       ORDER BY is_default DESC, id ASC`
    )
    .all(projectId)
    .map(mapWorkspaceRow);
  const staleWorkspaces = getStaleWorkspaceRows(workspaces, liveWorktreeState.liveWorktreePaths);
  const staleWorkspaceIds = new Set(staleWorkspaces.map((workspace) => workspace.id));
  const liveWorkspaces = workspaces.filter((workspace) => !staleWorkspaceIds.has(workspace.id));

  return {
    projectId,
    directoryPath: liveWorktreeState.directoryPath,
    liveWorktrees: liveWorktreeState.liveWorktrees,
    liveWorktreePaths: liveWorktreeState.liveWorktreePaths,
    liveWorkspaces,
    staleWorkspaces,
  };
}

export async function syncWorkspaceStaleState(
  projectId,
  directoryPath,
  { dryRun = false, logger = console, worktrees } = {}
) {
  const result = await inspectStaleWorkspaceRows(projectId, directoryPath, { worktrees });
  const staleWorkspaceIds = new Set(result.staleWorkspaces.map((workspace) => workspace.id));
  const newlyStaleWorkspaces = result.staleWorkspaces.filter((workspace) => !workspace.isStale);
  const clearedWorkspaces = result.liveWorkspaces.filter(
    (workspace) => workspace.isStale && !staleWorkspaceIds.has(workspace.id)
  );

  if (!result.staleWorkspaces.length && !clearedWorkspaces.length) {
    return {
      ...result,
      dryRun,
      markedCount: 0,
      clearedCount: 0,
    };
  }

  if (newlyStaleWorkspaces.length > 0) {
    logStaleWorkspaceEvent(
      dryRun ? 'Detected' : 'Marked',
      result,
      newlyStaleWorkspaces,
      result.liveWorktreePaths,
      logger
    );
  }

  if (clearedWorkspaces.length > 0) {
    logStaleWorkspaceEvent(
      dryRun ? 'Would clear' : 'Cleared',
      result,
      clearedWorkspaces,
      result.liveWorktreePaths,
      logger
    );
  }

  if (!dryRun) {
    const markStaleStatement = db.prepare(
      `UPDATE workspaces
       SET is_stale = 1,
           stale_detected_at = COALESCE(stale_detected_at, CURRENT_TIMESTAMP)
       WHERE id = ?`
    );
    const clearStaleStatement = db.prepare(
      `UPDATE workspaces
       SET is_stale = 0,
           stale_detected_at = NULL
       WHERE id = ?`
    );

    for (const workspace of result.staleWorkspaces) {
      markStaleStatement.run(workspace.id);
    }

    for (const workspace of clearedWorkspaces) {
      clearStaleStatement.run(workspace.id);
    }
  }

  return {
    ...result,
    dryRun,
    markedCount: dryRun ? 0 : newlyStaleWorkspaces.length,
    clearedCount: dryRun ? 0 : clearedWorkspaces.length,
  };
}

// Syncs all git worktrees for a project to the workspaces table.
// Called lazily on first GET /api/projects/:id so that projects created before
// multi-workspace support was introduced (or imported without worktree data) still
// populate their workspaces correctly the first time the inbox is opened.
export async function syncWorktreesAsWorkspaces(projectId, directoryPath) {
  const resolvedDirectoryPath = path.resolve(directoryPath);
  const worktrees = await detectWorktrees(resolvedDirectoryPath);
  const nonBareWorktrees = worktrees.filter((wt) => !wt.isBare);

  // Nothing to do when there is only one worktree (the project root itself).
  if (nonBareWorktrees.length <= 1) return;

  // Multiple worktrees detected — enable multi-workspace mode for this project.
  db.prepare('UPDATE projects SET multi_workspace_enabled = 1 WHERE id = ?').run(projectId);

  // Point the default workspace at the main worktree (first entry from git worktree list).
  const mainWorktree = nonBareWorktrees[0];
  const defaultWs = db
    .prepare(
      'SELECT id, name, worktree_path, worktree_branch FROM workspaces WHERE project_id = ? AND is_default = 1'
    )
    .get(projectId);
  if (defaultWs && !defaultWs.worktree_path) {
    const defaultName = getWorkspaceDisplayName({
      name: defaultWs.name,
      worktreePath: mainWorktree.path,
      worktreeBranch: mainWorktree.branch || null,
    });

    db.prepare(
      'UPDATE workspaces SET worktree_path = ?, worktree_branch = ?, name = ? WHERE id = ?'
    ).run(path.resolve(mainWorktree.path), mainWorktree.branch || null, defaultName, defaultWs.id);
  } else if (
    defaultWs &&
    shouldSyncWorkspaceName(
      defaultWs.name,
      mainWorktree.path,
      defaultWs.worktree_branch || mainWorktree.branch
    )
  ) {
    const defaultName = getWorkspaceDisplayName({
      name: defaultWs.name,
      worktreePath: mainWorktree.path,
      worktreeBranch: mainWorktree.branch || null,
    });

    db.prepare('UPDATE workspaces SET name = ?, worktree_branch = ? WHERE id = ?').run(
      defaultName,
      mainWorktree.branch || null,
      defaultWs.id
    );
  }

  // Upsert a workspace row for each additional (non-main) worktree.
  for (const wt of nonBareWorktrees.slice(1)) {
    const resolvedPath = path.resolve(wt.path);
    const desiredName = getWorkspaceDisplayName({
      name: null,
      worktreePath: resolvedPath,
      worktreeBranch: wt.branch || null,
    });
    const existing = db
      .prepare(
        'SELECT id, name, worktree_branch FROM workspaces WHERE project_id = ? AND worktree_path = ?'
      )
      .get(projectId, resolvedPath);
    if (!existing) {
      db.prepare(
        'INSERT INTO workspaces (project_id, name, worktree_path, worktree_branch, is_default) VALUES (?, ?, ?, ?, 0)'
      ).run(projectId, desiredName, resolvedPath, wt.branch || null);
      continue;
    }

    if (
      shouldSyncWorkspaceName(existing.name, resolvedPath, existing.worktree_branch || wt.branch)
    ) {
      db.prepare('UPDATE workspaces SET name = ?, worktree_branch = ? WHERE id = ?').run(
        desiredName,
        wt.branch || null,
        existing.id
      );
    }
  }
}

export async function scanProjectSessions(projectId, directoryPath) {
  const projectRow = getProjectRowById(projectId);
  if (!projectRow) {
    throw new Error(`Project ${projectId} not found`);
  }

  const defaultWorkspace = getDefaultWorkspace(projectId);
  const scanSourcePath =
    defaultWorkspace?.worktree_path || directoryPath || projectRow.directory_path;

  // Multi-workspace projects can be created from a non-main worktree. Once we
  // promote the root repo to the default workspace, inbox session discovery must
  // follow that workspace path instead of the original project row path.
  // Otherwise the default stream is scanned against the wrong worktree and shows
  // an empty inbox even though the root Claude storage contains sessions.
  const resolvedPath = path.resolve(scanSourcePath);

  await ensureProjectRegistered(resolvedPath, projectRow.display_name || projectRow.name);

  const discoveredProject = await getProjectSessionSnapshot(resolvedPath);

  if (!discoveredProject) {
    return { inserted: 0, scanned: 0 };
  }

  if (!defaultWorkspace) {
    throw new Error(`Project ${projectId} does not have a default workspace`);
  }

  const result = upsertDiscoveredSessions(defaultWorkspace.id, discoveredProject);

  db.prepare('UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(projectId);

  return result;
}

/**
 * Scan a specific workspace directory for sessions and associate them with
 * the given workspace ID.  Used after syncWorktreesAsWorkspaces creates new
 * workspace rows so that sessions from non-default worktrees appear in the
 * Project Inbox under their own stream.
 */
export async function scanWorkspaceSessions(workspaceId, worktreePath) {
  const resolvedPath = path.resolve(worktreePath);

  if (!fs.existsSync(resolvedPath)) {
    return { inserted: 0, scanned: 0 };
  }

  // Identify the project that owns this workspace (needed for addProjectManually).
  const wsRow = db.prepare('SELECT project_id FROM workspaces WHERE id = ?').get(workspaceId);
  if (!wsRow) {
    return { inserted: 0, scanned: 0 };
  }

  const projectRow = getProjectRowById(wsRow.project_id);
  const projectLabel = projectRow?.display_name || projectRow?.name || path.basename(resolvedPath);

  await ensureProjectRegistered(resolvedPath, projectLabel);

  const discoveredProject = await getProjectSessionSnapshot(resolvedPath);

  if (!discoveredProject) {
    return { inserted: 0, scanned: 0 };
  }

  return upsertDiscoveredSessions(workspaceId, discoveredProject);
}

export async function createProject(
  { name, directoryPath, multiWorkspaceEnabled = false },
  { wss } = {}
) {
  const resolvedPath = path.resolve(directoryPath);

  if (!name || !name.trim()) {
    throw new Error('Project name is required');
  }

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Project directory does not exist: ${resolvedPath}`);
  }

  if (!fs.statSync(resolvedPath).isDirectory()) {
    throw new Error('Project path must point to a directory');
  }

  const existingProject = db
    .prepare('SELECT id FROM projects WHERE directory_path = ? AND is_deleted = 0')
    .get(resolvedPath);

  if (existingProject) {
    throw new Error('Project already exists for that directory');
  }

  const createProjectTx = db.transaction(() => {
    const projectResult = db
      .prepare(
        `INSERT INTO projects (name, display_name, directory_path, multi_workspace_enabled)
         VALUES (?, ?, ?, ?)`
      )
      .run(name.trim(), name.trim(), resolvedPath, multiWorkspaceEnabled ? 1 : 0);

    db.prepare(
      `INSERT INTO workspaces (project_id, name, is_default)
       VALUES (?, ?, 1)`
    ).run(projectResult.lastInsertRowid, 'default');

    return Number(projectResult.lastInsertRowid);
  });

  const projectId = createProjectTx();
  const worktrees = await detectWorktrees(resolvedPath);
  const project = await getProjectById(projectId);

  broadcastMessage(wss, {
    type: 'project_created',
    project: {
      id: project.id,
      name: project.name,
      directoryPath: project.directoryPath,
    },
  });

  void scanProjectSessions(projectId, resolvedPath).catch((error) => {
    console.warn(
      `[projectService] Failed to scan sessions for project ${projectId}:`,
      error.message
    );
  });

  return {
    ...project,
    detectedWorktrees: worktrees,
  };
}

export async function getProjects({ sort = 'recent', includeDeleted = false } = {}) {
  const whereClause = includeDeleted ? '' : 'WHERE p.is_deleted = 0';
  const orderClause = getSortClause(sort);
  const rows = db
    .prepare(
      `SELECT
         p.*,
         COUNT(DISTINCT w.id) AS workspace_count,
         COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) AS active_session_count
       FROM projects p
       LEFT JOIN workspaces w ON w.project_id = p.id
       LEFT JOIN session_state s ON s.workspace_id = w.id
       ${whereClause}
       GROUP BY p.id
       ORDER BY ${orderClause}`
    )
    .all();

  const projects = rows.map(mapProjectRow);

  // Add git metadata for multi-stream grouping and branch chip display.
  // The DB stores directory_path but not the git common dir or branch; compute them here.
  await Promise.all(
    projects.map(async (project) => {
      [project.gitCommonDir, project.gitBranch] = await Promise.all([
        getGitCommonDir(project.directoryPath),
        getGitBranch(project.directoryPath),
      ]);
    })
  );

  const repoSourcesByCommonDir = new Map();
  for (const project of projects) {
    if (!project.gitCommonDir || repoSourcesByCommonDir.has(project.gitCommonDir)) {
      continue;
    }

    repoSourcesByCommonDir.set(project.gitCommonDir, project.directoryPath);
  }

  const liveWorktreesByCommonDir = new Map(
    await Promise.all(
      [...repoSourcesByCommonDir.entries()].map(async ([gitCommonDir, directoryPath]) => {
        return [gitCommonDir, await detectWorktrees(directoryPath)];
      })
    )
  );

  const liveWorktreePathsByCommonDir = new Map(
    [...liveWorktreesByCommonDir.entries()].map(([gitCommonDir, worktrees]) => [
      gitCommonDir,
      buildLiveWorktreeState(repoSourcesByCommonDir.get(gitCommonDir), worktrees).liveWorktreePaths,
    ])
  );

  const multiWorkspaceCommonDirs = new Set(
    projects
      .filter((project) => project.multiWorkspaceEnabled && project.gitCommonDir)
      .map((project) => project.gitCommonDir)
  );

  // Expand multi-workspace projects into per-workspace virtual entries.
  // Each workspace gets its own entry in the list so the sidebar's
  // groupProjectsIntoStreams() can group them as separate stream rows (all sharing
  // the same gitCommonDir). The default workspace keeps the original internal
  // project name for routing, but its visible label is normalized from the main
  // repository root so projects created from a worktree don't inherit the wrong
  // branch/worktree name as the repo title.
  //
  // Legacy standalone worktree projects are suppressed once a multi-workspace
  // parent exists for the same repo. The expanded workspace entries become the
  // canonical sidebar source, which keeps the stream count aligned with live
  // `git worktree list` output instead of stale DB rows.

  const expanded = [];
  for (const project of projects) {
    const resolvedProjectPath = project.directoryPath ? path.resolve(project.directoryPath) : null;
    const liveWorktreePaths = project.gitCommonDir
      ? liveWorktreePathsByCommonDir.get(project.gitCommonDir)
      : null;
    const isLegacyStandaloneWorktree = Boolean(
      !project.multiWorkspaceEnabled &&
      project.gitCommonDir &&
      resolvedProjectPath &&
      multiWorkspaceCommonDirs.has(project.gitCommonDir) &&
      liveWorktreePaths?.has(resolvedProjectPath)
    );

    if (isLegacyStandaloneWorktree) {
      continue;
    }

    if (!project.multiWorkspaceEnabled) {
      expanded.push(project);
      continue;
    }

    await syncWorkspaceStaleState(project.id, project.directoryPath, {
      logger: console,
      worktrees: project.gitCommonDir
        ? liveWorktreesByCommonDir.get(project.gitCommonDir)
        : undefined,
    });

    const workspaces = db
      .prepare('SELECT * FROM workspaces WHERE project_id = ? ORDER BY is_default DESC, id ASC')
      .all(project.id)
      .map(mapWorkspaceRow);

    const activeWorkspaces = workspaces.filter((workspace) => workspace.status === 'active');

    if (activeWorkspaces.length <= 1) {
      // Single workspace — not truly multi-stream yet, emit as-is.
      expanded.push(project);
      continue;
    }

    for (const ws of activeWorkspaces) {
      const wsPath = ws.worktreePath || project.directoryPath;

      // Default workspace reuses the original project name so existing navigation
      // and session routes continue to work without changes.
      const virtualName = ws.isDefault ? project.name : `${project.name}__ws__${ws.id}`;
      const displayName = getWorkspaceDisplayName({
        name: ws.name,
        worktreePath: wsPath,
        worktreeBranch: ws.worktreeBranch,
      });
      const canonicalProjectDisplayName = getCanonicalProjectDisplayName(project);
      expanded.push({
        ...project,
        name: virtualName,
        displayName: ws.isDefault ? canonicalProjectDisplayName : displayName,
        directoryPath: wsPath,
        fullPath: wsPath,
        path: wsPath,
        gitBranch: ws.worktreeBranch || project.gitBranch,
        // gitCommonDir is the same for all worktrees of the same repo — keep parent value
        // so groupProjectsIntoStreams() groups them into one multi-stream row.
        _workspaceId: ws.id,
        _parentProjectId: project.id,
        _isWorkspaceExpansion: true,
        isStale: ws.isStale,
        _workspaceStatus: ws.status,
        _staleDetectedAt: ws.staleDetectedAt,
      });
    }
  }

  const dedupedByPath = new Map();
  const pathlessProjects = [];

  for (const project of expanded) {
    const resolvedPath = project.directoryPath ? path.resolve(project.directoryPath) : null;
    if (!resolvedPath) {
      pathlessProjects.push(project);
      continue;
    }

    const existing = dedupedByPath.get(resolvedPath);
    if (
      !existing ||
      getProjectPathPriority(project) > getProjectPathPriority(existing) ||
      (getProjectPathPriority(project) === getProjectPathPriority(existing) &&
        project.id > existing.id)
    ) {
      // Duplicate DB project rows can temporarily point at the same worktree path after
      // re-imports or failed migrations. Prefer canonical workspace expansions over
      // legacy standalone rows so the sidebar renders one stream row per live worktree.
      dedupedByPath.set(resolvedPath, project);
    }
  }

  return [...dedupedByPath.values(), ...pathlessProjects];
}

export async function getProjectById(projectId) {
  const projectRow = getProjectRowById(projectId);
  if (!projectRow) {
    return null;
  }

  const workspaces = db
    .prepare(
      `SELECT *
       FROM workspaces
       WHERE project_id = ?
         AND status = 'active'
       ORDER BY is_default DESC, created_at ASC, id ASC`
    )
    .all(projectId)
    .map(mapWorkspaceRow);

  return {
    ...mapProjectRow(projectRow),
    workspaces,
  };
}

export async function listProjectSessions(
  projectId,
  { status = null, q = '', workspaceId = null } = {}
) {
  const filters = ['w.project_id = ?'];
  const params = [projectId];

  if (status) {
    filters.push('s.status = ?');
    params.push(status);
  }

  if (workspaceId) {
    filters.push('s.workspace_id = ?');
    params.push(Number(workspaceId));
  }

  if (q) {
    filters.push(`(
      COALESCE(s.title, '') LIKE ? OR
      COALESCE(s.summary, '') LIKE ? OR
      s.session_id LIKE ?
    )`);
    const queryValue = `%${q}%`;
    params.push(queryValue, queryValue, queryValue);
  }

  const rows = db
    .prepare(
      `SELECT
         s.*,
         w.name AS workspace_name
       FROM session_state s
       INNER JOIN workspaces w ON w.id = s.workspace_id
       WHERE ${filters.join(' AND ')}
       ORDER BY s.last_activity DESC, s.created_at DESC`
    )
    .all(...params);

  return rows.map(mapSessionRow);
}

export async function softDeleteProject(projectId, { wss } = {}) {
  const project = getProjectRowById(projectId);
  if (!project || project.is_deleted) {
    throw new Error(`Project ${projectId} not found`);
  }

  db.prepare(
    `UPDATE projects
     SET is_deleted = 1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(projectId);

  broadcastMessage(wss, {
    type: 'project_deleted',
    projectId: Number(projectId),
  });

  return { success: true };
}
