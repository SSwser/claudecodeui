import path from 'path';
import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import { db } from '../database/db.js';

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

function slugifyForPath(value) {
  return (
    String(value || 'workspace')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'workspace'
  );
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

function getProjectRecord(projectId) {
  return db
    .prepare(
      `SELECT id, directory_path, multi_workspace_enabled
       FROM projects
       WHERE id = ? AND is_deleted = 0`
    )
    .get(projectId);
}

async function ensureGitRepository(projectPath) {
  await runCommand('git', ['rev-parse', '--is-inside-work-tree'], { cwd: projectPath });
}

async function createGitWorktree(projectPath, workspaceName, worktreeBranch) {
  const slug = slugifyForPath(workspaceName || worktreeBranch);
  const worktreeRoot = path.join(projectPath, '.worktrees');
  const worktreePath = path.join(worktreeRoot, slug);

  await ensureGitRepository(projectPath);
  await fs.mkdir(worktreeRoot, { recursive: true });
  await runCommand('git', ['worktree', 'add', '-b', worktreeBranch, worktreePath], {
    cwd: projectPath,
  });

  return worktreePath;
}

export async function createWorkspace(projectId, { name, worktreeBranch } = {}) {
  const project = getProjectRecord(projectId);
  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  if (!project.multi_workspace_enabled) {
    throw new Error('Workspace operations require multi-workspace mode');
  }

  const trimmedName = String(name || '').trim();
  if (!trimmedName) {
    throw new Error('Workspace name is required');
  }

  let worktreePath = null;
  let resolvedBranch = null;
  if (worktreeBranch) {
    resolvedBranch = String(worktreeBranch).trim();
    worktreePath = await createGitWorktree(project.directory_path, trimmedName, resolvedBranch);
  }

  const result = db
    .prepare(
      `INSERT INTO workspaces (project_id, name, worktree_path, worktree_branch, is_default)
       VALUES (?, ?, ?, ?, 0)`
    )
    .run(projectId, trimmedName, worktreePath, resolvedBranch);

  const workspace = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(result.lastInsertRowid);
  return mapWorkspaceRow(workspace);
}

export async function getWorkspaces(projectId) {
  return db
    .prepare(
      `SELECT *
       FROM workspaces
       WHERE project_id = ?
         AND status = 'active'
       ORDER BY is_default DESC, created_at ASC, id ASC`
    )
    .all(projectId)
    .map(mapWorkspaceRow);
}

export async function renameWorkspace(workspaceId, newName) {
  const trimmedName = String(newName || '').trim();
  if (!trimmedName) {
    throw new Error('Workspace name is required');
  }

  db.prepare('UPDATE workspaces SET name = ? WHERE id = ?').run(trimmedName, workspaceId);
  const workspace = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(workspaceId);
  if (!workspace) {
    throw new Error(`Workspace ${workspaceId} not found`);
  }

  return mapWorkspaceRow(workspace);
}

export async function deleteWorkspace(workspaceId, deleteWorktree = false) {
  const workspace = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(workspaceId);
  if (!workspace) {
    throw new Error(`Workspace ${workspaceId} not found`);
  }

  if (workspace.is_default) {
    throw new Error('Default workspace cannot be deleted');
  }

  const project = getProjectRecord(workspace.project_id);
  if (!project) {
    throw new Error(`Project ${workspace.project_id} not found`);
  }

  if (deleteWorktree && workspace.worktree_path) {
    await ensureGitRepository(project.directory_path);
    await runCommand('git', ['worktree', 'remove', workspace.worktree_path], {
      cwd: project.directory_path,
    });
  }

  db.prepare('DELETE FROM workspaces WHERE id = ?').run(workspaceId);
  return { success: true };
}

export async function archiveWorkspace(workspaceId) {
  const workspace = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(workspaceId);
  if (!workspace) {
    throw new Error(`Workspace ${workspaceId} not found`);
  }

  if (workspace.is_default) {
    throw new Error('Default workspace cannot be archived');
  }

  if (!workspace.worktree_path) {
    throw new Error('Only worktree-backed workspaces can be archived');
  }

  if (workspace.status === 'archived') {
    return { success: true };
  }

  const archiveTx = db.transaction(() => {
    db.prepare(
      `UPDATE workspaces
       SET status = 'archived',
           is_stale = 0,
           stale_detected_at = NULL,
           archived_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(workspaceId);

    // Stream archival hides the stale row from the active sidebar while preserving
    // session history for a future restore/history surface.
    db.prepare(
      `UPDATE session_state
       SET status = CASE WHEN status = 'deleted' THEN status ELSE 'archived' END,
           archived_at = CASE WHEN status = 'deleted' THEN archived_at ELSE CURRENT_TIMESTAMP END
       WHERE workspace_id = ?`
    ).run(workspaceId);
  });

  archiveTx();

  const archivedWorkspace = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(workspaceId);
  return mapWorkspaceRow(archivedWorkspace);
}

export async function promoteWorktreeToWorkspace(projectId, worktreePath, worktreeBranch) {
  const project = getProjectRecord(projectId);
  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  if (!project.multi_workspace_enabled) {
    throw new Error('Workspace operations require multi-workspace mode');
  }

  const resolvedPath = path.resolve(worktreePath);
  const existingWorkspace = db
    .prepare(
      `SELECT *
       FROM workspaces
       WHERE project_id = ? AND worktree_path = ?`
    )
    .get(projectId, resolvedPath);

  if (existingWorkspace) {
    return mapWorkspaceRow(existingWorkspace);
  }

  const workspaceName = path.basename(resolvedPath);
  const result = db
    .prepare(
      `INSERT INTO workspaces (project_id, name, worktree_path, worktree_branch, is_default)
       VALUES (?, ?, ?, ?, 0)`
    )
    .run(projectId, workspaceName, resolvedPath, worktreeBranch || null);

  const workspace = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(result.lastInsertRowid);
  return mapWorkspaceRow(workspace);
}
