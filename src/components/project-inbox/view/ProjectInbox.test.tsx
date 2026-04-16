// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProjectInbox from './ProjectInbox';

const { refreshMock, archiveWorkspaceMock, deleteWorkspaceMock } = vi.hoisted(() => ({
  refreshMock: vi.fn(),
  archiveWorkspaceMock: vi.fn(),
  deleteWorkspaceMock: vi.fn(),
}));
const useProjectInboxMock = vi.hoisted(() =>
  vi.fn(() => ({
    project: { id: 4, name: 'chorus', displayName: 'Chorus Repo', directoryPath: 'F:/repo' },
    workspaces: [
      {
        id: 14,
        name: 'phase-02',
        isDefault: false,
        worktreeBranch: 'feat/phase-02',
        worktreePath: 'F:/repo/.worktrees/phase-02',
        isStale: true,
      },
    ],
    selectedWorkspace: {
      id: 14,
      name: 'phase-02',
      isDefault: false,
      worktreeBranch: 'feat/phase-02',
      worktreePath: 'F:/repo/.worktrees/phase-02',
      isStale: true,
    },
    sessions: [],
    rawSessions: [],
    isLoading: false,
    error: null,
    refresh: refreshMock,
    searchQuery: '',
    setSearchQuery: vi.fn(),
    statusFilter: 'all',
    setStatusFilter: vi.fn(),
    sortOrder: 'recent',
    setSortOrder: vi.fn(),
    selectedWorkspaceId: 14,
    setSelectedWorkspaceId: vi.fn(),
  }))
);

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback || _key }),
}));

const navigateMock = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('../hooks/useProjectInbox', () => ({
  useProjectInbox: useProjectInboxMock,
}));

vi.mock('@/utils/api', () => ({
  api: {
    archiveWorkspace: archiveWorkspaceMock,
    deleteWorkspace: deleteWorkspaceMock,
  },
}));

vi.mock('./ProjectInboxHeader', () => ({
  default: () => <div data-testid="project-inbox-header" />,
}));

vi.mock('./SearchBar', () => ({
  default: () => <div data-testid="project-inbox-search" />,
}));

describe('ProjectInbox stale workspace resolution', () => {
  beforeEach(() => {
    refreshMock.mockReset();
    archiveWorkspaceMock.mockReset();
    deleteWorkspaceMock.mockReset();
    useProjectInboxMock.mockReset();
    useProjectInboxMock.mockReturnValue({
      project: { id: 4, name: 'chorus', displayName: 'Chorus Repo', directoryPath: 'F:/repo' },
      workspaces: [
        {
          id: 14,
          name: 'phase-02',
          isDefault: false,
          worktreeBranch: 'feat/phase-02',
          worktreePath: 'F:/repo/.worktrees/phase-02',
          isStale: true,
        },
      ],
      selectedWorkspace: {
        id: 14,
        name: 'phase-02',
        isDefault: false,
        worktreeBranch: 'feat/phase-02',
        worktreePath: 'F:/repo/.worktrees/phase-02',
        isStale: true,
      },
      sessions: [],
      rawSessions: [],
      isLoading: false,
      error: null,
      refresh: refreshMock,
      searchQuery: '',
      setSearchQuery: vi.fn(),
      statusFilter: 'all',
      setStatusFilter: vi.fn(),
      sortOrder: 'recent',
      setSortOrder: vi.fn(),
      selectedWorkspaceId: 14,
      setSelectedWorkspaceId: vi.fn(),
    });
    navigateMock.mockReset();
    archiveWorkspaceMock.mockResolvedValue({ ok: true, json: async () => ({}) });
    window.refreshProjects = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    delete window.refreshProjects;
  });

  it('shows a resolution panel and archives stale streams', async () => {
    render(
      <ProjectInbox
        projectId={4}
        projectName="chorus"
        projectDisplayName="Chorus Repo"
        initialWorkspaceId={14}
        onOpenSession={vi.fn()}
        onCreateSession={vi.fn()}
      />
    );

    expect(screen.getByText('Worktree removed')).toBeTruthy();
    expect(screen.queryByTestId('project-inbox-search')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));

    await waitFor(() => {
      expect(archiveWorkspaceMock).toHaveBeenCalledWith(4, 14);
    });
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(window.refreshProjects).toHaveBeenCalledTimes(1);
  });

  it('shows empty state after deleting a stale stream', async () => {
    deleteWorkspaceMock.mockResolvedValue({ ok: true, json: async () => ({}) });

    render(
      <ProjectInbox
        projectId={4}
        projectName="chorus"
        projectDisplayName="Chorus Repo"
        initialWorkspaceId={14}
        onOpenSession={vi.fn()}
        onCreateSession={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(deleteWorkspaceMock).toHaveBeenCalledWith(4, 14);
    });

    expect(refreshMock).not.toHaveBeenCalled();
    expect(window.refreshProjects).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith('/');
  });

  it('falls back to initial stale workspace metadata when selectedWorkspace is unavailable', async () => {
    useProjectInboxMock.mockReturnValueOnce({
      project: { id: 4, name: 'chorus', displayName: 'Chorus Repo', directoryPath: 'F:/repo' },
      workspaces: [],
      selectedWorkspace: null as any,
      sessions: [],
      rawSessions: [],
      isLoading: false,
      error: null,
      refresh: refreshMock,
      searchQuery: '',
      setSearchQuery: vi.fn(),
      statusFilter: 'all',
      setStatusFilter: vi.fn(),
      sortOrder: 'recent',
      setSortOrder: vi.fn(),
      selectedWorkspaceId: null as any,
      setSelectedWorkspaceId: vi.fn(),
    });

    render(
      <ProjectInbox
        projectId={4}
        projectName="chorus"
        projectDisplayName="Chorus Repo"
        initialWorkspaceId={15}
        initialWorkspaceIsStale
        initialWorkspaceLabel="phase-02"
        onOpenSession={vi.fn()}
        onCreateSession={vi.fn()}
      />
    );

    expect(screen.getByText('Worktree removed')).toBeTruthy();
    expect(screen.getByText('phase-02')).toBeTruthy();
    expect(screen.queryByTestId('project-inbox-search')).toBeNull();
  });
});
