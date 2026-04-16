import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => ({
  prepare: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('../database/db.js', () => ({
  db: {
    prepare: dbMocks.prepare,
    transaction: dbMocks.transaction,
  },
}));

import { archiveWorkspace } from './workspaceService.js';

describe('workspaceService.archiveWorkspace', () => {
  beforeEach(() => {
    dbMocks.prepare.mockReset();
    dbMocks.transaction.mockReset();
    dbMocks.transaction.mockImplementation((callback) => callback);
  });

  it('archives a worktree-backed workspace and preserves its session history', async () => {
    const activeWorkspace = {
      id: 14,
      project_id: 4,
      name: 'phase-02',
      worktree_path: 'F:/repo/.worktrees/phase-02',
      worktree_branch: 'feat/phase-02',
      status: 'active',
      is_stale: 1,
      stale_detected_at: '2026-04-16 09:00:00',
      archived_at: null,
      is_default: 0,
      created_at: '2026-04-16 08:30:00',
    };
    const archivedWorkspace = {
      ...activeWorkspace,
      status: 'archived',
      is_stale: 0,
      stale_detected_at: null,
      archived_at: '2026-04-16 09:05:00',
    };
    const getWorkspace = vi
      .fn()
      .mockReturnValueOnce(activeWorkspace)
      .mockReturnValueOnce(archivedWorkspace);
    const updateWorkspaceRun = vi.fn();
    const updateSessionsRun = vi.fn();

    dbMocks.prepare.mockImplementation((sql) => {
      if (sql === 'SELECT * FROM workspaces WHERE id = ?') {
        return { get: getWorkspace };
      }

      if (sql.includes("SET status = 'archived'")) {
        return { run: updateWorkspaceRun };
      }

      if (sql.includes('UPDATE session_state')) {
        return { run: updateSessionsRun };
      }

      throw new Error(`Unexpected SQL in test: ${sql}`);
    });

    const result = await archiveWorkspace(14);

    expect(updateWorkspaceRun).toHaveBeenCalledWith(14);
    expect(updateSessionsRun).toHaveBeenCalledWith(14);
    expect(result).toMatchObject({
      id: 14,
      status: 'archived',
      isStale: false,
      archivedAt: '2026-04-16 09:05:00',
    });
  });

  it('rejects archive for the default workspace', async () => {
    dbMocks.prepare.mockImplementation((sql) => {
      if (sql === 'SELECT * FROM workspaces WHERE id = ?') {
        return {
          get: () => ({
            id: 12,
            project_id: 4,
            worktree_path: 'F:/repo',
            is_default: 1,
            status: 'active',
          }),
        };
      }

      throw new Error(`Unexpected SQL in test: ${sql}`);
    });

    await expect(archiveWorkspace(12)).rejects.toThrow('Default workspace cannot be archived');
  });
});
