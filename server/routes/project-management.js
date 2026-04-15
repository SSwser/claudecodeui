import express from 'express';
import path from 'path';
import fs from 'fs';
import {
  createProject,
  detectWorktrees,
  getProjectById,
  getProjects,
  listProjectSessions,
  scanProjectSessions,
  scanWorkspaceSessions,
  softDeleteProject,
  syncWorktreesAsWorkspaces,
} from '../services/projectService.js';
import {
  createWorkspace,
  deleteWorkspace,
  getWorkspaces,
  promoteWorktreeToWorkspace,
  renameWorkspace,
} from '../services/workspaceService.js';

const router = express.Router();

// Track projects scanned in this server session to avoid redundant filesystem scans.
// On first GET of a project's sessions, we trigger scanProjectSessions() to seed
// session_state from the filesystem. This ensures the inbox shows existing sessions
// even if the fire-and-forget scan in createProject() failed or ran before sessions existed.
const scannedProjects = new Set();

// Track projects whose git worktrees have been synced to DB workspaces in this
// server session. Syncing is idempotent but involves a git subprocess, so we only
// run it once per project per server process.
const syncedWorktreeProjects = new Set();

function parseBoolean(value, defaultValue = false) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }

  return defaultValue;
}

function parseNumericId(value, fieldName) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a positive integer`);
  }

  return parsed;
}

function validateName(name, fieldName) {
  const trimmedName = String(name || '').trim();
  if (!trimmedName) {
    throw new Error(`${fieldName} is required`);
  }

  if (trimmedName.length > 120) {
    throw new Error(`${fieldName} must be 120 characters or fewer`);
  }

  return trimmedName;
}

function validateDirectoryPath(directoryPath) {
  const trimmedPath = String(directoryPath || '').trim();
  if (!trimmedPath) {
    throw new Error('directoryPath is required');
  }

  if (trimmedPath.includes('..')) {
    throw new Error('directoryPath cannot contain path traversal segments');
  }

  return path.resolve(trimmedPath);
}

function handleRouteError(res, error) {
  const message = error?.message || 'Unexpected error';
  if (
    message.includes('required') ||
    message.includes('must be') ||
    message.includes('path traversal') ||
    message.includes('inside the current user home directory') ||
    message.includes('already exists') ||
    message.includes('not found') ||
    message.includes('multi-workspace')
  ) {
    return res.status(400).json({ error: message });
  }

  console.error('[project-management] Route error:', error);
  return res.status(500).json({ error: message });
}

router.post('/', async (req, res) => {
  try {
    const name = validateName(req.body?.name, 'name');
    const directoryPath = validateDirectoryPath(req.body?.directoryPath);
    const multiWorkspaceEnabled = parseBoolean(req.body?.multiWorkspaceEnabled, false);

    const project = await createProject(
      { name, directoryPath, multiWorkspaceEnabled },
      { wss: req.app.locals.wss }
    );

    res.status(201).json(project);
  } catch (error) {
    handleRouteError(res, error);
  }
});

router.get('/validate-directory', async (req, res) => {
  try {
    const directoryPath = validateDirectoryPath(req.query?.path);

    await fs.promises.access(directoryPath, fs.constants.R_OK);
    const stats = await fs.promises.stat(directoryPath);

    if (!stats.isDirectory()) {
      return res.status(400).json({ error: 'Path is not a directory' });
    }

    return res.status(200).json({ valid: true, path: directoryPath });
  } catch (error) {
    return handleRouteError(res, error);
  }
});

router.get('/', async (req, res) => {
  try {
    const sort = typeof req.query.sort === 'string' ? req.query.sort : 'recent';
    const includeDeleted = parseBoolean(req.query.includeDeleted, false);
    const projects = await getProjects({ sort, includeDeleted });
    res.status(200).json(projects);
  } catch (error) {
    handleRouteError(res, error);
  }
});

router.get('/:id(\\d+)', async (req, res) => {
  try {
    const projectId = parseNumericId(req.params.id, 'Project id');
    let project = await getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // On first access, sync git worktrees as workspace rows so that all branches
    // appear as separate streams in the Project Inbox without manual setup.
    if (!syncedWorktreeProjects.has(projectId) && project.directoryPath) {
      syncedWorktreeProjects.add(projectId);
      await syncWorktreesAsWorkspaces(projectId, project.directoryPath).catch((err) => {
        console.warn(
          `[project-management] Worktree sync failed for project ${projectId}: ${err.message}`
        );
      });
      // Re-fetch so the response includes any newly created workspace rows.
      project = (await getProjectById(projectId)) ?? project;
    }

    res.status(200).json(project);
  } catch (error) {
    handleRouteError(res, error);
  }
});

router.delete('/:id(\\d+)', async (req, res) => {
  try {
    const projectId = parseNumericId(req.params.id, 'Project id');
    await softDeleteProject(projectId, { wss: req.app.locals.wss });
    res.status(200).json({ success: true });
  } catch (error) {
    handleRouteError(res, error);
  }
});

router.get('/:id(\\d+)/sessions', async (req, res) => {
  try {
    const projectId = parseNumericId(req.params.id, 'Project id');
    const workspaceId = req.query.workspaceId
      ? parseNumericId(req.query.workspaceId, 'workspaceId')
      : null;
    const status = typeof req.query.status === 'string' ? req.query.status : null;
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    // Lazy scan: on first access this server session, seed session_state from the
    // filesystem. This recovers from the fire-and-forget scan in createProject()
    // failing silently, or sessions being added after project creation.
    if (!scannedProjects.has(projectId)) {
      scannedProjects.add(projectId);
      const project = await getProjectById(projectId);
      if (project?.directoryPath) {
        // Await the main project scan so the response includes default-workspace sessions.
        await scanProjectSessions(projectId, project.directoryPath).catch((err) => {
          console.warn(
            `[project-management] Session scan failed for project ${projectId}: ${err.message}`
          );
        });
        // Scan non-default workspace paths in the background — these can be slow
        // (each calls discoverProjects internally) so we don't block the response.
        // Sessions from other worktrees will appear in the inbox once the background
        // scan completes, triggered by a manual refresh or the next WebSocket update.
        for (const ws of project.workspaces ?? []) {
          if (!ws.isDefault && ws.worktreePath && ws.worktreePath !== project.directoryPath) {
            scanWorkspaceSessions(ws.id, ws.worktreePath).catch((err) => {
              console.warn(
                `[project-management] Workspace session scan failed for ws ${ws.id}: ${err.message}`
              );
            });
          }
        }
      }
    }

    const sessions = await listProjectSessions(projectId, { status, q, workspaceId });
    res.status(200).json(sessions);
  } catch (error) {
    handleRouteError(res, error);
  }
});

router.post('/:id(\\d+)/workspaces', async (req, res) => {
  try {
    const projectId = parseNumericId(req.params.id, 'Project id');
    const name = validateName(req.body?.name, 'Workspace name');
    const workspace = await createWorkspace(projectId, {
      name,
      worktreeBranch:
        typeof req.body?.worktreeBranch === 'string' ? req.body.worktreeBranch.trim() : undefined,
    });

    res.status(201).json(workspace);
  } catch (error) {
    handleRouteError(res, error);
  }
});

router.get('/:id(\\d+)/workspaces', async (req, res) => {
  try {
    const projectId = parseNumericId(req.params.id, 'Project id');
    const workspaces = await getWorkspaces(projectId);
    res.status(200).json(workspaces);
  } catch (error) {
    handleRouteError(res, error);
  }
});

router.patch('/:id(\\d+)/workspaces/:wsId(\\d+)', async (req, res) => {
  try {
    parseNumericId(req.params.id, 'Project id');
    const workspaceId = parseNumericId(req.params.wsId, 'Workspace id');
    const name = validateName(req.body?.name, 'Workspace name');
    const workspace = await renameWorkspace(workspaceId, name);
    res.status(200).json(workspace);
  } catch (error) {
    handleRouteError(res, error);
  }
});

router.delete('/:id(\\d+)/workspaces/:wsId(\\d+)', async (req, res) => {
  try {
    parseNumericId(req.params.id, 'Project id');
    const workspaceId = parseNumericId(req.params.wsId, 'Workspace id');
    const deleteWorktree = parseBoolean(req.query.deleteWorktree, false);
    await deleteWorkspace(workspaceId, deleteWorktree);
    res.status(200).json({ success: true });
  } catch (error) {
    handleRouteError(res, error);
  }
});

router.post('/:id(\\d+)/workspaces/promote', async (req, res) => {
  try {
    const projectId = parseNumericId(req.params.id, 'Project id');
    const worktreePath = validateDirectoryPath(req.body?.worktreePath);
    const workspace = await promoteWorktreeToWorkspace(
      projectId,
      worktreePath,
      typeof req.body?.worktreeBranch === 'string' ? req.body.worktreeBranch.trim() : undefined
    );

    res.status(201).json(workspace);
  } catch (error) {
    handleRouteError(res, error);
  }
});

router.get('/:id(\\d+)/worktrees', async (req, res) => {
  try {
    const projectId = parseNumericId(req.params.id, 'Project id');
    const project = await getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const worktrees = await detectWorktrees(project.directoryPath);
    res.status(200).json(worktrees);
  } catch (error) {
    handleRouteError(res, error);
  }
});

export default router;
