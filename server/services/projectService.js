import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { db } from '../database/db.js';
import { addProjectManually, getProjects as discoverProjects } from '../projects.js';

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
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
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

export async function scanProjectSessions(projectId, directoryPath) {
  const projectRow = getProjectRowById(projectId);
  if (!projectRow) {
    throw new Error(`Project ${projectId} not found`);
  }

  const resolvedPath = path.resolve(directoryPath || projectRow.directory_path);

  try {
    await addProjectManually(resolvedPath, projectRow.display_name || projectRow.name);
  } catch (error) {
    if (!String(error.message).includes('Project already configured')) {
      throw error;
    }
  }

  const discoveredProjects = await discoverProjects();
  const discoveredProject = discoveredProjects.find((project) => {
    const candidatePath = project.fullPath || project.path;
    return candidatePath && path.resolve(candidatePath) === resolvedPath;
  });

  if (!discoveredProject) {
    return { inserted: 0, scanned: 0 };
  }

  const defaultWorkspace = getDefaultWorkspace(projectId);
  if (!defaultWorkspace) {
    throw new Error(`Project ${projectId} does not have a default workspace`);
  }

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
  let inserted = 0;
  const existingCount = db.prepare('SELECT COUNT(*) AS count FROM session_state').get().count;

  for (const { provider, session } of flattenProjectSessions(discoveredProject)) {
    scanned += 1;
    const title = session.title || session.name || session.summary || null;
    const summary = session.summary || session.name || null;
    const lastActivity =
      session.lastActivity || session.updated_at || session.createdAt || session.created_at || new Date().toISOString();

    upsertSession.run(
      session.id,
      defaultWorkspace.id,
      provider,
      'active',
      title,
      summary,
      lastActivity,
    );
  }

  const updatedCount = db.prepare('SELECT COUNT(*) AS count FROM session_state').get().count;
  inserted = updatedCount - existingCount;

  db.prepare('UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(projectId);

  return { inserted, scanned };
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
    console.warn(`[projectService] Failed to scan sessions for project ${projectId}:`, error.message);
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

  return rows.map(mapProjectRow);
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