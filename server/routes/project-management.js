import express from 'express';
import os from 'os';
import path from 'path';
import {
  createProject,
  detectWorktrees,
  getProjectById,
  getProjects,
  listProjectSessions,
  softDeleteProject,
} from '../services/projectService.js';
import {
  createWorkspace,
  deleteWorkspace,
  getWorkspaces,
  promoteWorktreeToWorkspace,
  renameWorkspace,
} from '../services/workspaceService.js';

const router = express.Router();

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

  const resolvedPath = path.resolve(trimmedPath);
  const homeDir = path.resolve(os.homedir());
  const isInsideHome = resolvedPath === homeDir || resolvedPath.startsWith(`${homeDir}${path.sep}`);
  if (!isInsideHome) {
    throw new Error('directoryPath must be inside the current user home directory');
  }

  return resolvedPath;
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
      { wss: req.app.locals.wss },
    );

    res.status(201).json(project);
  } catch (error) {
    handleRouteError(res, error);
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
    const project = await getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
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
    const workspaceId = req.query.workspaceId ? parseNumericId(req.query.workspaceId, 'workspaceId') : null;
    const sessions = await listProjectSessions(projectId, {
      status: typeof req.query.status === 'string' ? req.query.status : null,
      q: typeof req.query.q === 'string' ? req.query.q.trim() : '',
      workspaceId,
    });

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
      typeof req.body?.worktreeBranch === 'string' ? req.body.worktreeBranch.trim() : undefined,
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