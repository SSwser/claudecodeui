import { EventEmitter } from 'events';
import path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => ({
  prepare: vi.fn(),
}));

const projectSourceMocks = vi.hoisted(() => ({
  addProjectManually: vi.fn(),
  getGitCommonDir: vi.fn(),
  getGitBranch: vi.fn(),
  getProjectSessionSnapshot: vi.fn(),
}));

const childProcessMocks = vi.hoisted(() => ({
  spawn: vi.fn(),
}));

vi.mock('../database/db.js', () => ({
  db: {
    prepare: dbMocks.prepare,
  },
}));

vi.mock('../projects.js', () => projectSourceMocks);
vi.mock('child_process', () => childProcessMocks);

import { getProjects, scanProjectSessions, syncWorkspaceStaleState } from './projectService.js';

function createSuccessfulSpawn(stdoutText) {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();

  queueMicrotask(() => {
    if (stdoutText) {
      child.stdout.emit('data', stdoutText);
    }
    child.emit('close', 0);
  });

  return child;
}

describe('projectService.getProjects', () => {
  beforeEach(() => {
    dbMocks.prepare.mockReset();
    projectSourceMocks.addProjectManually.mockReset();
    projectSourceMocks.getGitCommonDir.mockReset();
    projectSourceMocks.getGitBranch.mockReset();
    projectSourceMocks.getProjectSessionSnapshot.mockReset();
    childProcessMocks.spawn.mockReset();
  });

  it('keeps stale worktree-backed workspace rows visible and marks them stale', async () => {
    const rootPath = 'F:/workspace/dev/claudecodeui';
    const phase01Path = 'F:/workspace/dev/claudecodeui-phase-01';
    const stalePhase02Path = 'F:/workspace/dev/claudecodeui/.claude/worktrees/phase-02';
    const k5sPath = 'F:/workspace/dev/claudecodeui/.worktrees/260412-k5s';
    const livePhase02Path = 'F:/workspace/dev/claudecodeui/.worktrees/phase-02';
    const gitCommonDir = 'F:/workspace/dev/claudecodeui/.git';
    const markStaleRun = vi.fn();
    const clearStaleRun = vi.fn();

    const workspaceRows = [
      {
        id: 12,
        project_id: 4,
        name: 'dev',
        worktree_path: rootPath,
        worktree_branch: 'dev',
        status: 'active',
        is_stale: 0,
        stale_detected_at: null,
        archived_at: null,
        is_default: 1,
        created_at: '2026-04-14 14:53:34',
      },
      {
        id: 13,
        project_id: 4,
        name: 'feat/phase-01',
        worktree_path: phase01Path,
        worktree_branch: 'feat/phase-01',
        status: 'active',
        is_stale: 0,
        stale_detected_at: null,
        archived_at: null,
        is_default: 0,
        created_at: '2026-04-14 14:54:34',
      },
      {
        id: 14,
        project_id: 4,
        name: 'worktree-phase-02',
        worktree_path: stalePhase02Path,
        worktree_branch: 'worktree-phase-02',
        status: 'active',
        is_stale: 0,
        stale_detected_at: null,
        archived_at: null,
        is_default: 0,
        created_at: '2026-04-14 14:55:34',
      },
      {
        id: 15,
        project_id: 4,
        name: '260412-k5s',
        worktree_path: k5sPath,
        worktree_branch: '260412-k5s',
        status: 'active',
        is_stale: 0,
        stale_detected_at: null,
        archived_at: null,
        is_default: 0,
        created_at: '2026-04-14 14:56:34',
      },
      {
        id: 16,
        project_id: 4,
        name: 'feat/phase-02',
        worktree_path: livePhase02Path,
        worktree_branch: 'pr/phase-02',
        status: 'active',
        is_stale: 0,
        stale_detected_at: null,
        archived_at: null,
        is_default: 0,
        created_at: '2026-04-14 14:57:34',
      },
    ];

    dbMocks.prepare.mockImplementation((sql) => {
      if (sql.includes('FROM projects p')) {
        return {
          all: () => [
            {
              id: 4,
              name: 'phase-02',
              display_name: 'claudecodeui',
              directory_path: rootPath,
              multi_workspace_enabled: 1,
              is_deleted: 0,
              created_at: '2026-04-14 14:53:34',
              updated_at: '2026-04-16 00:27:38',
              workspace_count: 5,
              active_session_count: 1,
            },
          ],
        };
      }

      if (sql.includes('WHERE project_id = ?') && sql.includes('worktree_path IS NOT NULL')) {
        return {
          all: () => workspaceRows,
        };
      }

      if (sql.includes('SELECT * FROM workspaces WHERE project_id = ? ORDER BY is_default DESC')) {
        return {
          all: () => [
            ...workspaceRows.slice(0, 2),
            { ...workspaceRows[2], is_stale: 1, stale_detected_at: '2026-04-16 09:30:00' },
            ...workspaceRows.slice(3),
          ],
        };
      }

      if (sql.includes('SET is_stale = 1')) {
        return {
          run: markStaleRun,
        };
      }

      if (sql.includes('SET is_stale = 0')) {
        return {
          run: clearStaleRun,
        };
      }

      throw new Error(`Unexpected SQL in test: ${sql}`);
    });

    projectSourceMocks.getGitCommonDir.mockResolvedValue(gitCommonDir);
    projectSourceMocks.getGitBranch.mockResolvedValue('dev');
    childProcessMocks.spawn.mockImplementation(() =>
      createSuccessfulSpawn(
        `worktree ${rootPath}\nHEAD 123\nbranch refs/heads/dev\n\nworktree ${phase01Path}\nHEAD 456\nbranch refs/heads/feat/phase-01\n\nworktree ${k5sPath}\nHEAD 789\nbranch refs/heads/260412-k5s\n\nworktree ${livePhase02Path}\nHEAD abc\nbranch refs/heads/pr/phase-02\n\n`
      )
    );

    const projects = await getProjects();

    expect(projects).toHaveLength(5);
    expect(projects.map((project) => project.directoryPath)).toEqual([
      rootPath,
      phase01Path,
      stalePhase02Path,
      k5sPath,
      livePhase02Path,
    ]);
    expect(projects.find((project) => project.directoryPath === stalePhase02Path)?.isStale).toBe(
      true
    );
    expect(markStaleRun).toHaveBeenCalledWith(14);
    expect(clearStaleRun).not.toHaveBeenCalled();
  });

  it('marks stale worktree workspace rows and emits explicit logs', async () => {
    const rootPath = 'F:/workspace/dev/claudecodeui';
    const stalePhase02Path = 'F:/workspace/dev/claudecodeui/.claude/worktrees/phase-02';
    const livePhase02Path = 'F:/workspace/dev/claudecodeui/.worktrees/phase-02';
    const markStaleRun = vi.fn();
    const clearStaleRun = vi.fn();
    const logger = {
      warn: vi.fn(),
      info: vi.fn(),
      log: vi.fn(),
    };

    dbMocks.prepare.mockImplementation((sql) => {
      if (sql.includes('WHERE project_id = ?') && sql.includes('worktree_path IS NOT NULL')) {
        return {
          all: () => [
            {
              id: 12,
              project_id: 4,
              name: 'dev',
              worktree_path: rootPath,
              worktree_branch: 'dev',
              status: 'active',
              is_stale: 0,
              stale_detected_at: null,
              archived_at: null,
              is_default: 1,
              created_at: '2026-04-14 14:53:34',
            },
            {
              id: 14,
              project_id: 4,
              name: 'worktree-phase-02',
              worktree_path: stalePhase02Path,
              worktree_branch: 'worktree-phase-02',
              status: 'active',
              is_stale: 0,
              stale_detected_at: null,
              archived_at: null,
              is_default: 0,
              created_at: '2026-04-14 14:55:34',
            },
            {
              id: 16,
              project_id: 4,
              name: 'feat/phase-02',
              worktree_path: livePhase02Path,
              worktree_branch: 'pr/phase-02',
              status: 'active',
              is_stale: 0,
              stale_detected_at: null,
              archived_at: null,
              is_default: 0,
              created_at: '2026-04-14 14:57:34',
            },
          ],
        };
      }

      if (sql.includes('SET is_stale = 1')) {
        return {
          run: markStaleRun,
        };
      }

      if (sql.includes('SET is_stale = 0')) {
        return {
          run: clearStaleRun,
        };
      }

      throw new Error(`Unexpected SQL in test: ${sql}`);
    });

    childProcessMocks.spawn.mockImplementation(() =>
      createSuccessfulSpawn(
        `worktree ${rootPath}\nHEAD 123\nbranch refs/heads/dev\n\nworktree ${livePhase02Path}\nHEAD abc\nbranch refs/heads/pr/phase-02\n\n`
      )
    );

    const result = await syncWorkspaceStaleState(4, rootPath, { logger });

    expect(result.markedCount).toBe(1);
    expect(result.clearedCount).toBe(0);
    expect(result.staleWorkspaces).toHaveLength(1);
    expect(markStaleRun).toHaveBeenCalledWith(14);
    expect(clearStaleRun).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn.mock.calls[0][0]).toContain('Marked 1 stale worktree workspace');
    expect(logger.warn.mock.calls[0][0].replace(/\\/g, '/')).toContain(stalePhase02Path);
  });

  it('scans the default workspace path instead of the original imported worktree path', async () => {
    const importedWorktreePath = 'F:/workspace/dev/claudecodeui/.worktrees/phase-02';
    const mainRepoPath = 'F:/workspace/dev/claudecodeui';
    const updateProjectRun = vi.fn();

    dbMocks.prepare.mockImplementation((sql) => {
      if (sql.includes('FROM projects p') && sql.includes('WHERE p.id = ?')) {
        return {
          get: () => ({
            id: 4,
            name: 'phase-02',
            display_name: 'phase-02',
            directory_path: importedWorktreePath,
            multi_workspace_enabled: 1,
            is_deleted: 0,
            created_at: '2026-04-14 14:53:34',
            updated_at: '2026-04-16 00:27:38',
            workspace_count: 2,
            active_session_count: 0,
          }),
        };
      }

      if (sql.includes('FROM workspaces') && sql.includes('ORDER BY is_default DESC')) {
        return {
          get: () => ({
            id: 12,
            project_id: 4,
            name: 'claudecodeui',
            worktree_path: mainRepoPath,
            worktree_branch: 'dev',
            status: 'active',
            is_default: 1,
          }),
        };
      }

      if (sql.includes('SELECT COUNT(*) AS count FROM session_state')) {
        let count = 0;
        return {
          get: () => ({ count: count++ }),
        };
      }

      if (sql.includes('INSERT INTO session_state')) {
        return {
          run: vi.fn(),
        };
      }

      if (sql.includes('UPDATE projects SET updated_at = CURRENT_TIMESTAMP')) {
        return {
          run: updateProjectRun,
        };
      }

      throw new Error(`Unexpected SQL in test: ${sql}`);
    });

    projectSourceMocks.addProjectManually.mockResolvedValue(undefined);
    projectSourceMocks.getProjectSessionSnapshot.mockResolvedValue({
      sessions: [
        {
          id: 'session-1',
          title: 'Loaded from root stream',
          summary: 'summary',
          createdAt: '2026-04-16T10:00:00Z',
          lastActivity: '2026-04-16T10:00:00Z',
        },
      ],
      cursorSessions: [],
      codexSessions: [],
      geminiSessions: [],
    });

    await scanProjectSessions(4, importedWorktreePath);

    expect(projectSourceMocks.addProjectManually).toHaveBeenCalledWith(
      path.resolve(mainRepoPath),
      'phase-02'
    );
    expect(projectSourceMocks.getProjectSessionSnapshot).toHaveBeenCalledWith(
      path.resolve(mainRepoPath)
    );
    expect(updateProjectRun).toHaveBeenCalledWith(4);
  });
});
