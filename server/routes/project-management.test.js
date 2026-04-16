import express from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const projectServiceMocks = vi.hoisted(() => ({
  createProject: vi.fn(),
  detectWorktrees: vi.fn(),
  getProjectById: vi.fn(),
  getProjects: vi.fn(),
  listProjectSessions: vi.fn(),
  scanProjectSessions: vi.fn(),
  scanWorkspaceSessions: vi.fn(),
  softDeleteProject: vi.fn(),
  syncWorkspaceStaleState: vi.fn(),
  syncWorktreesAsWorkspaces: vi.fn(),
}));

const workspaceServiceMocks = vi.hoisted(() => ({
  archiveWorkspace: vi.fn(),
  createWorkspace: vi.fn(),
  deleteWorkspace: vi.fn(),
  getWorkspaces: vi.fn(),
  promoteWorktreeToWorkspace: vi.fn(),
  renameWorkspace: vi.fn(),
}));

vi.mock('../services/projectService.js', () => projectServiceMocks);
vi.mock('../services/workspaceService.js', () => workspaceServiceMocks);

import router from './project-management.js';

async function createTestServer() {
  const app = express();
  app.use(express.json());
  app.locals.wss = null;
  app.use('/api/projects', router);

  const server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });

  const address = server.address();
  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}/api/projects`,
  };
}

describe('project-management routes', () => {
  let server;
  let baseUrl;

  beforeEach(async () => {
    vi.clearAllMocks();
    const started = await createTestServer();
    server = started.server;
    baseUrl = started.baseUrl;
  });

  afterEach(async () => {
    if (!server) {
      return;
    }

    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  });

  it('archives a workspace through the API', async () => {
    workspaceServiceMocks.archiveWorkspace.mockResolvedValue({
      id: 14,
      projectId: 4,
      name: 'phase-02',
      status: 'archived',
      isStale: false,
    });

    const response = await fetch(`${baseUrl}/4/workspaces/14/archive`, {
      method: 'POST',
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      id: 14,
      status: 'archived',
      isStale: false,
    });
    expect(workspaceServiceMocks.archiveWorkspace).toHaveBeenCalledWith(14);
  });

  it('rescans stale stream state through the API', async () => {
    projectServiceMocks.getProjectById
      .mockResolvedValueOnce({ id: 4, directoryPath: 'F:/repo' })
      .mockResolvedValueOnce({
        id: 4,
        directoryPath: 'F:/repo',
        workspaces: [{ id: 14, isStale: true }],
      });
    projectServiceMocks.syncWorkspaceStaleState.mockResolvedValue({
      staleWorkspaces: [{ id: 14, name: 'phase-02' }],
      markedCount: 1,
      clearedCount: 0,
    });

    const response = await fetch(`${baseUrl}/4/check-stream-status`, {
      method: 'POST',
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      markedCount: 1,
      clearedCount: 0,
      staleWorkspaces: [{ id: 14, name: 'phase-02' }],
      project: { id: 4 },
    });
    expect(projectServiceMocks.syncWorkspaceStaleState).toHaveBeenCalledWith(4, 'F:/repo', {
      logger: console,
    });
  });

  it('returns 404 when rescanning a missing project', async () => {
    projectServiceMocks.getProjectById.mockResolvedValue(null);

    const response = await fetch(`${baseUrl}/4/check-stream-status`, {
      method: 'POST',
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ error: 'Project not found' });
    expect(projectServiceMocks.syncWorkspaceStaleState).not.toHaveBeenCalled();
  });
});
