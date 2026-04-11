// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ProjectCreationWizard from './ProjectCreationWizard';
import {
  browseFilesystemFolders,
  cloneWorkspaceWithProgress,
  createWorkspaceRequest,
} from './data/workspaceApi';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('./hooks/useGithubTokens', () => ({
  useGithubTokens: () => ({
    tokens: [],
    loading: false,
    loadError: null,
    selectedTokenName: null,
  }),
}));

vi.mock('./data/workspaceApi', () => ({
  browseFilesystemFolders: vi.fn().mockResolvedValue({ path: '/', suggestions: [] }),
  createFolderInFilesystem: vi.fn(),
  createWorkspaceRequest: vi.fn().mockResolvedValue({ id: 'project-1' }),
  cloneWorkspaceWithProgress: vi.fn().mockResolvedValue({ id: 'project-2' }),
  fetchGithubTokenCredentials: vi.fn().mockResolvedValue([]),
}));

const mockedBrowseFilesystemFolders = vi.mocked(browseFilesystemFolders);
const mockedCreateWorkspaceRequest = vi.mocked(createWorkspaceRequest);
const mockedCloneWorkspaceWithProgress = vi.mocked(cloneWorkspaceWithProgress);

const onClose = vi.fn();
const onProjectCreated = vi.fn();

const renderWizard = () =>
  render(<ProjectCreationWizard onClose={onClose} onProjectCreated={onProjectCreated} />);

describe('ProjectCreationWizard', () => {
  beforeEach(() => {
    mockedBrowseFilesystemFolders.mockResolvedValue({ path: '/', suggestions: [] });
    mockedCreateWorkspaceRequest.mockResolvedValue({ id: 'project-1' });
    mockedCloneWorkspaceWithProgress.mockResolvedValue({ id: 'project-2' });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows logical-only fields by default and hides worktree-only fields', async () => {
    renderWizard();

    fireEvent.click(screen.getByText('projectWizard.buttons.next'));

    expect(screen.getByPlaceholderText('/path/to/workspace')).toBeTruthy();
    expect(screen.getByText('projectWizard.step2.githubUrl')).toBeTruthy();
    expect(screen.queryByText('projectWizard.step2.sourcePath')).toBeNull();
    expect(screen.queryByText('projectWizard.step2.branchName')).toBeNull();
  });

  it('requires the full worktree contract before advancing to review', async () => {
    renderWizard();

    fireEvent.click(screen.getByText('projectWizard.step1.new.title'));
    fireEvent.click(screen.getByText('projectWizard.buttons.next'));

    fireEvent.click(screen.getByText('projectWizard.buttons.next'));
    expect(screen.getByText('projectWizard.errors.provideWorktreePath')).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText('/path/to/new/worktree'), {
      target: { value: '/workspace/feature-shell' },
    });
    fireEvent.click(screen.getByText('projectWizard.buttons.next'));
    expect(screen.getByText('projectWizard.errors.provideSourcePathAction')).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText('projectWizard.step2.sourcePathPlaceholder'), {
      target: { value: '/repos/source-root' },
    });
    fireEvent.click(screen.getByText('projectWizard.buttons.next'));
    expect(screen.getByText('projectWizard.errors.provideBranchNameAction')).toBeTruthy();
  });

  it('renders the worktree review from the literal submission payload', async () => {
    renderWizard();

    fireEvent.click(screen.getByText('projectWizard.step1.new.title'));
    fireEvent.click(screen.getByText('projectWizard.buttons.next'));

    fireEvent.change(screen.getByPlaceholderText('/path/to/new/worktree'), {
      target: { value: '/workspace/feature-shell' },
    });
    fireEvent.change(screen.getByPlaceholderText('projectWizard.step2.sourcePathPlaceholder'), {
      target: { value: '/repos/source-root' },
    });
    fireEvent.change(screen.getByPlaceholderText('projectWizard.step2.branchNamePlaceholder'), {
      target: { value: 'feature/landing-shell' },
    });

    fireEvent.click(screen.getByText('projectWizard.buttons.next'));

    expect(screen.getByText('/workspace/feature-shell')).toBeTruthy();
    expect(screen.getByText('/repos/source-root')).toBeTruthy();
    expect(screen.getByText('feature/landing-shell')).toBeTruthy();
    expect(screen.getByText('main')).toBeTruthy();

    fireEvent.click(screen.getByText('projectWizard.buttons.createProject'));

    await waitFor(() => {
      expect(mockedCreateWorkspaceRequest).toHaveBeenCalledWith({
        workspaceType: 'worktree',
        path: '/workspace/feature-shell',
        sourcePath: '/repos/source-root',
        branchName: 'feature/landing-shell',
        baseBranch: 'main',
      });
    });
  });

  it('keeps logical clone review aligned with the outgoing clone request', async () => {
    renderWizard();

    fireEvent.click(screen.getByText('projectWizard.buttons.next'));

    fireEvent.change(screen.getByPlaceholderText('/path/to/workspace'), {
      target: { value: '/workspace/logical-home' },
    });
    fireEvent.change(screen.getByPlaceholderText('https://github.com/username/repository'), {
      target: { value: 'https://github.com/acme/demo-repo' },
    });

    fireEvent.click(screen.getByText('projectWizard.buttons.next'));

    expect(screen.getByText('https://github.com/acme/demo-repo')).toBeTruthy();
    expect(screen.getByText('projectWizard.step3.noAuthentication')).toBeTruthy();

    fireEvent.click(screen.getByText('projectWizard.buttons.createProject'));

    await waitFor(() => {
      expect(mockedCloneWorkspaceWithProgress).toHaveBeenCalledWith(
        {
          workspacePath: '/workspace/logical-home',
          githubUrl: 'https://github.com/acme/demo-repo',
          tokenMode: 'stored',
          selectedGithubToken: '',
          newGithubToken: '',
        },
        { onProgress: expect.any(Function) }
      );
    });

    expect(mockedCreateWorkspaceRequest).not.toHaveBeenCalled();
  });
});
