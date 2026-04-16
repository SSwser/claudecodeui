// @vitest-environment jsdom

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useProjectInbox } from './useProjectInbox';

const authenticatedFetchMock = vi.hoisted(() => vi.fn());

vi.mock('@/contexts/WebSocketContext', () => ({
  useWebSocket: () => ({ latestMessage: null }),
}));

vi.mock('@/utils/api', () => ({
  authenticatedFetch: authenticatedFetchMock,
}));

describe('useProjectInbox', () => {
  beforeEach(() => {
    authenticatedFetchMock.mockReset();
  });

  it('stops after the initial project fetch for stale workspaces and exposes the stale selection', async () => {
    authenticatedFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 4,
        name: 'chorus',
        displayName: 'Chorus Repo',
        workspaces: [
          {
            id: 12,
            name: 'dev',
            isDefault: true,
            worktreeBranch: 'dev',
            worktreePath: 'F:/repo',
            isStale: false,
          },
          {
            id: 15,
            name: 'worktree-phase-02',
            isDefault: false,
            worktreeBranch: 'feat/phase-02',
            worktreePath: 'F:/repo/.worktrees/phase-02',
            isStale: true,
          },
        ],
      }),
    });

    const { result } = renderHook(() => useProjectInbox({ projectId: 4, initialWorkspaceId: 15 }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(authenticatedFetchMock).toHaveBeenCalledTimes(1);
    expect(authenticatedFetchMock).toHaveBeenCalledWith('/api/projects/4');
    expect(result.current.selectedWorkspace).toMatchObject({
      id: 15,
      name: 'worktree-phase-02',
      isStale: true,
    });
    expect(result.current.rawSessions).toEqual([]);
  });

  it('loads sessions for a non-stale selected workspace', async () => {
    authenticatedFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 4,
        name: 'chorus',
        displayName: 'Chorus Repo',
        workspaces: [
          {
            id: 12,
            name: 'dev',
            isDefault: true,
            worktreeBranch: 'dev',
            worktreePath: 'F:/repo',
            isStale: false,
          },
        ],
      }),
    });

    authenticatedFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          sessionId: 's1',
          provider: 'claude',
          status: 'active',
          title: 'Hello world',
          summary: 'Test session',
          lastActivity: '2026-04-16T10:00:00Z',
          createdAt: '2026-04-16T10:00:00Z',
        },
      ],
    });

    const { result } = renderHook(() => useProjectInbox({ projectId: 4, initialWorkspaceId: 12 }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(authenticatedFetchMock).toHaveBeenCalledTimes(2);
    expect(authenticatedFetchMock).toHaveBeenNthCalledWith(1, '/api/projects/4');
    expect(authenticatedFetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/projects/4/sessions?workspaceId=12'
    );
    expect(result.current.rawSessions).toHaveLength(1);
    expect(result.current.rawSessions[0]).toMatchObject({
      sessionId: 's1',
      title: 'Hello world',
    });
  });

  it('lets the user switch away from the initial workspace without snapping back', async () => {
    authenticatedFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 4,
        name: 'chorus',
        displayName: 'Chorus Repo',
        workspaces: [
          {
            id: 12,
            name: 'dev',
            isDefault: true,
            worktreeBranch: 'dev',
            worktreePath: 'F:/repo',
            isStale: false,
          },
          {
            id: 13,
            name: 'phase-01',
            isDefault: false,
            worktreeBranch: 'feat/phase-01',
            worktreePath: 'F:/repo/.worktrees/phase-01',
            isStale: false,
          },
        ],
      }),
    });

    authenticatedFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    authenticatedFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const { result } = renderHook(() => useProjectInbox({ projectId: 4, initialWorkspaceId: 12 }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setSelectedWorkspaceId(13);
    });

    await waitFor(() => {
      expect(result.current.selectedWorkspaceId).toBe(13);
    });

    expect(authenticatedFetchMock).toHaveBeenNthCalledWith(
      3,
      '/api/projects/4/sessions?workspaceId=13'
    );
    expect(result.current.selectedWorkspace).toMatchObject({
      id: 13,
      name: 'phase-01',
    });
  });
});
