// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SidebarProjectListSection from './SidebarProjectListSection';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('./ProjectContextMenu', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

const mainProject = {
  id: 1,
  name: 'chorus',
  displayName: 'Chorus Repo',
  fullPath: 'F:/workspace/dev/claudecodeui',
  path: 'F:/workspace/dev/claudecodeui',
  directoryPath: 'F:/workspace/dev/claudecodeui',
};

const childProject = {
  id: 2,
  name: 'chorus__ws__2',
  displayName: 'Phase 01 Workspace',
  fullPath: 'F:/workspace/dev/claudecodeui-phase-01',
  path: 'F:/workspace/dev/claudecodeui-phase-01',
  directoryPath: 'F:/workspace/dev/claudecodeui-phase-01',
};

const mainItem = {
  project: mainProject,
  displayName: 'Chorus Repo',
  workspaceName: 'claudecodeui',
  branch: 'dev',
  hasActiveSessions: false,
  hasWaitingSessions: false,
};

const childItem = {
  project: childProject,
  displayName: 'Phase 01 Workspace',
  workspaceName: 'claudecodeui-phase-01',
  branch: 'feat/phase-01',
  isStale: false,
  hasActiveSessions: false,
  hasWaitingSessions: false,
};

afterEach(() => {
  cleanup();
});

describe('SidebarProjectListSection', () => {
  it('keeps the main project title when a child stream is selected in collapsed mode', () => {
    render(
      <SidebarProjectListSection
        projects={[mainItem, childItem]}
        groupedProjects={[{ main: mainItem, children: [childItem] }]}
        selectedProject={childProject}
        isLoading={false}
        loadingProgress={null}
        searchFilter=""
        editingProject={null}
        editingName=""
        deletingProjects={new Set()}
        onEditingNameChange={vi.fn()}
        onProjectSelect={vi.fn()}
        onStartEditingProject={vi.fn()}
        onCancelEditingProject={vi.fn()}
        onSaveProjectName={vi.fn()}
        onDeleteProject={vi.fn()}
        onRefreshProject={vi.fn()}
        onNewSession={vi.fn()}
      />
    );

    expect(screen.getByText('Chorus Repo')).toBeTruthy();
    expect(screen.getByText('feat/phase-01')).toBeTruthy();
    expect(screen.queryByText('Phase 01 Workspace')).toBeNull();
  });

  it('expands the group when clicking +N from a collapsed child stream row', () => {
    render(
      <SidebarProjectListSection
        projects={[mainItem, childItem]}
        groupedProjects={[{ main: mainItem, children: [childItem] }]}
        selectedProject={childProject}
        isLoading={false}
        loadingProgress={null}
        searchFilter=""
        editingProject={null}
        editingName=""
        deletingProjects={new Set()}
        onEditingNameChange={vi.fn()}
        onProjectSelect={vi.fn()}
        onStartEditingProject={vi.fn()}
        onCancelEditingProject={vi.fn()}
        onSaveProjectName={vi.fn()}
        onDeleteProject={vi.fn()}
        onRefreshProject={vi.fn()}
        onNewSession={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('+1'));

    expect(screen.getByText('Phase 01 Workspace')).toBeTruthy();
  });

  it('renders stale stream rows with an unavailable chip', () => {
    render(
      <SidebarProjectListSection
        projects={[{ ...childItem, isStale: true }]}
        groupedProjects={[{ main: { ...childItem, isStale: true }, children: [] }]}
        selectedProject={null}
        isLoading={false}
        loadingProgress={null}
        searchFilter=""
        editingProject={null}
        editingName=""
        deletingProjects={new Set()}
        onEditingNameChange={vi.fn()}
        onProjectSelect={vi.fn()}
        onStartEditingProject={vi.fn()}
        onCancelEditingProject={vi.fn()}
        onSaveProjectName={vi.fn()}
        onDeleteProject={vi.fn()}
        onRefreshProject={vi.fn()}
        onNewSession={vi.fn()}
      />
    );

    expect(screen.getByText('Unavailable')).toBeTruthy();
  });
});
