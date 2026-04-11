// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import AppContent from './AppContent';
import { useProjectsState } from '../../hooks/useProjectsState';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../contexts/WebSocketContext', () => ({
  useWebSocket: () => ({
    ws: null,
    sendMessage: vi.fn(),
    latestMessage: null,
    isConnected: false,
  }),
}));

vi.mock('../../hooks/useDeviceSettings', () => ({
  useDeviceSettings: () => ({ isMobile: false }),
}));

vi.mock('../../hooks/useSessionProtection', () => ({
  useSessionProtection: () => ({
    activeSessions: new Set<string>(),
    processingSessions: new Set<string>(),
    markSessionAsActive: vi.fn(),
    markSessionAsInactive: vi.fn(),
    markSessionAsProcessing: vi.fn(),
    markSessionAsNotProcessing: vi.fn(),
    replaceTemporarySession: vi.fn(),
  }),
}));

vi.mock('../../hooks/useProjectsState', () => ({
  useProjectsState: vi.fn(),
}));

vi.mock('../sidebar/view/Sidebar', () => ({
  default: () => <div data-testid="sidebar" />,
}));

vi.mock('../main-content/view/MainContent', () => ({
  default: ({ showLandingPage, forceEmptyState }: { showLandingPage: boolean; forceEmptyState: boolean }) => (
    <div
      data-testid="main-content"
      data-show-landing={showLandingPage ? 'true' : 'false'}
      data-force-empty={forceEmptyState ? 'true' : 'false'}
    />
  ),
}));

vi.mock('./MobileNav', () => ({
  default: () => null,
}));

const mockedUseProjectsState = vi.mocked(useProjectsState);

const project = {
  name: 'alpha',
  displayName: 'Alpha',
  fullPath: '/workspace/alpha',
  sessions: [{ id: 'session-1', summary: 'Session One' }],
  cursorSessions: [],
  codexSessions: [],
  geminiSessions: [],
};

const createProjectsStateMock = (overrides: Record<string, unknown> = {}) => ({
  selectedProject: null,
  selectedSession: null,
  activeTab: 'chat',
  sidebarOpen: false,
  isLoadingProjects: false,
  isInputFocused: false,
  externalMessageUpdate: 0,
  setActiveTab: vi.fn(),
  setSidebarOpen: vi.fn(),
  setIsInputFocused: vi.fn(),
  setShowSettings: vi.fn(),
  openSettings: vi.fn(),
  refreshProjectsSilently: vi.fn(),
  startupBehavior: 'landing',
  lastOpenedSessionId: null,
  landingPageData: {
    filters: { search: '', project: null, workspace: null, sessionType: 'all' },
    favoriteWorkspaces: [],
    favoriteSessions: [],
    recentSessions: [],
    projectOptions: [],
    workspaceOptions: [],
  },
  setLandingSearch: vi.fn(),
  setLandingProjectFilter: vi.fn(),
  setLandingWorkspaceFilter: vi.fn(),
  setLandingSessionTypeFilter: vi.fn(),
  toggleWorkspaceFavoriteByProjectName: vi.fn(),
  toggleSessionFavoriteById: vi.fn(),
  clearSelectedSessionSelection: vi.fn(),
  sidebarSharedProps: {},
  handleProjectSelect: vi.fn(),
  handleSessionSelect: vi.fn(),
  handleNewSession: vi.fn(),
  projects: [project],
  ...overrides,
});

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderApp(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <LocationProbe />
              <AppContent />
            </>
          }
        />
        <Route
          path="/session/:sessionId"
          element={
            <>
              <LocationProbe />
              <AppContent />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('AppContent', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('falls back to a chrome-light landing view on root when restore intent is invalid', async () => {
    const clearSelectedSessionSelection = vi.fn();

    mockedUseProjectsState.mockReturnValue(
      createProjectsStateMock({
        selectedSession: { id: 'stale-session', summary: 'Stale Session', __projectName: 'alpha' },
        lastOpenedSessionId: 'missing-session',
        clearSelectedSessionSelection,
      }) as never
    );

    renderApp('/');

    await waitFor(() => {
      expect(screen.getByTestId('main-content').dataset.showLanding).toBe('true');
    });

    expect(screen.getByTestId('main-content').dataset.forceEmpty).toBe('false');
    expect(screen.queryByTestId('sidebar')).toBeNull();
    expect(clearSelectedSessionSelection).toHaveBeenCalled();
    expect(screen.getByTestId('location').textContent).toBe('/');
  });

  it('restores a valid last-opened session when startup behavior requests it', async () => {
    mockedUseProjectsState.mockReturnValue(
      createProjectsStateMock({
        startupBehavior: 'restore-last',
        lastOpenedSessionId: 'session-1',
      }) as never
    );

    renderApp('/');

    await waitFor(() => {
      expect(screen.getByTestId('location').textContent).toBe('/session/session-1');
    });
  });
});
