// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProjectWizard from './ProjectWizard';
import {
  browseFilesystemFolders,
  cloneWorkspaceWithProgress,
} from '../../project-creation-wizard/data/workspaceApi';
import { authenticatedFetch } from '../../../utils/api';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../../utils/api', () => ({
  authenticatedFetch: vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({}),
  }),
}));

vi.mock('../../project-creation-wizard/data/workspaceApi', () => ({
  browseFilesystemFolders: vi.fn().mockResolvedValue({
    path: 'C:/Users/admin/projects',
    suggestions: [
      {
        name: 'checkout',
        path: 'C:/Users/admin/projects/checkout',
        type: 'directory',
      },
    ],
  }),
  createFolderInFilesystem: vi.fn(),
  cloneWorkspaceWithProgress: vi.fn(),
}));

const mockedBrowseFilesystemFolders = vi.mocked(browseFilesystemFolders);
const mockedAuthenticatedFetch = vi.mocked(authenticatedFetch);
const mockedCloneWorkspaceWithProgress = vi.mocked(cloneWorkspaceWithProgress);

describe('ProjectWizard', () => {
  beforeEach(() => {
    mockedBrowseFilesystemFolders.mockResolvedValue({
      path: 'C:/Users/admin/projects',
      suggestions: [
        {
          name: 'checkout',
          path: 'C:/Users/admin/projects/checkout',
          type: 'directory',
        },
      ],
    });
    mockedAuthenticatedFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);
    mockedCloneWorkspaceWithProgress.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('opens the folder browser instead of falling back to window.prompt', async () => {
    const promptSpy = vi.spyOn(window, 'prompt').mockImplementation(() => 'ignored');

    render(<ProjectWizard open onOpenChange={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('wizard.basics.label'), {
      target: { value: 'Checkout refactor' },
    });
    fireEvent.click(screen.getByText('wizard.actions.next'));
    fireEvent.click(screen.getByText('wizard.directory.browse'));

    expect(promptSpy).not.toHaveBeenCalled();
    expect(await screen.findByText('Select Folder')).toBeTruthy();
    expect(mockedBrowseFilesystemFolders).toHaveBeenCalledWith('~');

    promptSpy.mockRestore();
  });

  it('lets a browsed local folder advance into the workspace step', async () => {
    render(<ProjectWizard open onOpenChange={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('wizard.basics.label'), {
      target: { value: 'Checkout refactor' },
    });
    fireEvent.click(screen.getByText('wizard.actions.next'));
    fireEvent.click(screen.getByText('wizard.directory.browse'));

    fireEvent.click(await screen.findByText('Select'));

    await waitFor(() => {
      expect(screen.getByDisplayValue('C:/Users/admin/projects/checkout')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('wizard.actions.next'));

    expect(await screen.findByText('wizard.workspace.title')).toBeTruthy();
    expect(screen.queryByDisplayValue('C:/Users/admin/projects/checkout')).toBeNull();
  });
});
