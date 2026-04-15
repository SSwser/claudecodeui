// @vitest-environment jsdom

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppTabs } from './useAppTabs';
import {
  DEFAULT_HOME_PREFERENCES,
  HOME_PREFERENCES_STORAGE_KEY,
  readHomePreferencesSnapshot,
} from './useHomePreferences';

const project = {
  name: 'alpha',
  displayName: 'Alpha',
  fullPath: '/workspace/alpha',
  sessions: [{ id: 'session-1', summary: 'Session One', __projectName: 'alpha' }],
  cursorSessions: [],
  codexSessions: [],
  geminiSessions: [],
};

const selectedSession = project.sessions[0];

const makeStoredTab = (id: string, sessionId: string) => ({
  id,
  kind: 'session' as const,
  label: id,
  projectName: 'alpha',
  sessionId,
  paneId: null,
  activeContentTab: 'chat' as const,
  createdAt: '2026-04-11T00:00:00.000Z',
  updatedAt: '2026-04-11T00:00:00.000Z',
});

describe('useAppTabs', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('normalizes invalid persisted shell tabs during hydration', async () => {
    localStorage.setItem(
      HOME_PREFERENCES_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_HOME_PREFERENCES,
        shellTabs: [
          makeStoredTab('session:session-1', 'session-1'),
          makeStoredTab('session:missing', 'missing-session'),
          makeStoredTab('session:duplicate', 'session-1'),
        ],
        activeShellTabId: 'session:missing',
      })
    );

    const { result } = renderHook(() =>
      useAppTabs({
        projects: [project],
        selectedProject: null,
        selectedSession: null,
        sessionId: undefined,
        startupBehavior: 'restore-all',
        lastOpenedSessionId: null,
        navigate: vi.fn(),
        onRequestClearSession: vi.fn(),
      })
    );

    await waitFor(() => {
      expect(result.current.shellTabs).toHaveLength(1);
    });

    expect(result.current.shellTabs[0]).toMatchObject({
      id: 'session:session-1',
      sessionId: 'session-1',
      label: 'Session One',
      projectName: 'alpha',
    });

    const snapshot = readHomePreferencesSnapshot();
    expect(snapshot.shellTabs).toHaveLength(1);
    expect(snapshot.activeShellTabId).toBe('');
  });

  it('returns to the home root shell and clears shell state when the last tab closes', async () => {
    const navigate = vi.fn();
    const onRequestClearSession = vi.fn();

    const { result } = renderHook(() =>
      useAppTabs({
        projects: [project],
        selectedProject: project,
        selectedSession,
        sessionId: 'session-1',
        startupBehavior: 'landing',
        lastOpenedSessionId: null,
        navigate,
        onRequestClearSession,
      })
    );

    await waitFor(() => {
      expect(result.current.shellTabs).toHaveLength(1);
    });

    act(() => {
      result.current.closeShellTab('session:session-1');
    });

    await waitFor(() => {
      expect(result.current.shellTabs).toHaveLength(0);
    });

    expect(result.current.rootViewMode).toBe('home');
    expect(onRequestClearSession).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/');
  });
});
