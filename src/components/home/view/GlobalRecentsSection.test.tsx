// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import GlobalRecentsSection from './GlobalRecentsSection';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const baseData = {
  projectCount: 0,
  filters: { search: '', project: null, workspace: null, sessionType: 'all' },
  favoriteWorkspaces: [],
  favoriteSessions: [],
  recentSessions: [],
  projectOptions: [],
  workspaceOptions: [],
};

afterEach(() => {
  cleanup();
});

describe('GlobalRecentsSection', () => {
  it('disables New Session when there are no projects', () => {
    render(
      <GlobalRecentsSection
        data={baseData}
        onOpenSession={vi.fn()}
        onToggleSessionFavorite={vi.fn()}
        onCreateProject={vi.fn()}
        onCreateSession={vi.fn()}
      />
    );

    const button = screen.getByRole('button', { name: 'landing.createSession' });
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('keeps New Session clickable once a project exists', () => {
    const onCreateSession = vi.fn();

    render(
      <GlobalRecentsSection
        data={{ ...baseData, projectCount: 1 }}
        onOpenSession={vi.fn()}
        onToggleSessionFavorite={vi.fn()}
        onCreateProject={vi.fn()}
        onCreateSession={onCreateSession}
      />
    );

    const button = screen.getByRole('button', { name: 'landing.createSession' });
    fireEvent.click(button);
    expect(onCreateSession).toHaveBeenCalledTimes(1);
  });
});
