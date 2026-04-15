// @vitest-environment jsdom

import { cleanup, renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSidebarController } from './useSidebarController';

const homePreferencesMock = vi.hoisted(() => ({
  preferences: { favorites: [] },
  markFavoriteAccessed: vi.fn(),
}));

vi.mock('@/hooks/useHomePreferences', () => ({
  useHomePreferences: () => homePreferencesMock,
}));

vi.mock('@/utils/api', () => ({
  api: {
    renameProject: vi.fn(),
    deleteProject: vi.fn(),
    searchConversationsUrl: vi.fn(),
  },
}));

const project = {
  name: 'alpha',
  displayName: 'Alpha',
  fullPath: 'C:/workspace/alpha',
  path: 'C:/workspace/alpha',
  multiWorkspaceEnabled: true,
  sessions: [
    {
      id: 'session-1',
      summary: 'Session One',
      updated_at: '2026-04-15T12:00:00.000Z',
      __provider: 'claude' as const,
      __projectName: 'alpha',
    },
  ],
  cursorSessions: [],
  codexSessions: [],
  geminiSessions: [],
};

describe('useSidebarController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-15T12:05:00.000Z'));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('cancels any pending project navigation before opening a recent session', () => {
    const onProjectSelect = vi.fn();
    const onOpenSession = vi.fn();
    const setCurrentProject = vi.fn();

    const { result } = renderHook(() =>
      useSidebarController({
        projects: [project],
        selectedProject: project,
        isLoading: false,
        isMobile: false,
        t: ((key: string) => key) as never,
        onRefresh: vi.fn(),
        onProjectSelect,
        onOpenSession,
        onProjectDelete: vi.fn(),
        setCurrentProject,
        setSidebarVisible: vi.fn(),
        sidebarVisible: true,
      })
    );

    act(() => {
      result.current.handleProjectSelect(project);
    });

    act(() => {
      result.current.openSessionFromSidebar(project.sessions[0], project);
      vi.advanceTimersByTime(200);
    });

    expect(onProjectSelect).not.toHaveBeenCalled();
    expect(onOpenSession).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'session-1', __projectName: 'alpha' })
    );
    expect(setCurrentProject).toHaveBeenCalledWith(project);
  });
});
