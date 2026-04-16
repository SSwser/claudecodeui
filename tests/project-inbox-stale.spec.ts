import { expect, test } from '@playwright/test';

const staleProjectPayload = {
  id: 4,
  name: 'chorus',
  displayName: 'Chorus Repo',
  directoryPath: 'F:/repo',
  fullPath: 'F:/repo/claudecodeui',
  path: 'F:/repo/claudecodeui',
  multiWorkspaceEnabled: true,
  workspaces: [
    {
      id: 15,
      name: 'claudecodeui-phase-02',
      isDefault: false,
      worktreeBranch: 'feat/phase-02',
      worktreePath: 'F:/repo/.worktrees/phase-02',
      isStale: true,
      status: 'active',
      createdAt: '2026-04-13T10:15:00.000Z',
      updatedAt: '2026-04-16T09:05:00.000Z',
    },
    {
      id: 16,
      name: 'claudecodeui-phase-01',
      isDefault: true,
      worktreeBranch: 'main',
      worktreePath: 'F:/repo',
      isStale: false,
      status: 'active',
      createdAt: '2026-04-10T08:22:00.000Z',
      updatedAt: '2026-04-16T09:20:00.000Z',
    },
  ],
};

test('stale row first open shows stale resolution panel before project inbox finishes loading', async ({
  page,
}) => {
  let projectRequestCount = 0;
  let sessionsRequestCount = 0;
  let resolveProjectResponse: () => void;

  const projectResponseReady = new Promise<void>((resolve) => {
    resolveProjectResponse = resolve;
  });

  await page.route('**/api/projects/4', async (route) => {
    projectRequestCount += 1;
    await projectResponseReady;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(staleProjectPayload),
    });
  });

  await page.route('**/api/projects/4/sessions**', async (route) => {
    sessionsRequestCount += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.goto('/__visual/design-md?scene=project-inbox-stale');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('[data-visual-ready="true"]');

  await expect(page.getByText('Worktree removed')).toBeVisible();
  await expect(page.getByText('claudecodeui-phase-02')).toBeVisible();
  expect(projectRequestCount).toBeGreaterThanOrEqual(1);
  expect(sessionsRequestCount).toBe(0);

  resolveProjectResponse!();
  await page.waitForResponse(
    (response) => response.url().endsWith('/api/projects/4') && response.status() === 200
  );

  await expect(page.getByText('Worktree removed')).toBeVisible();
  expect(projectRequestCount).toBeGreaterThanOrEqual(1);
  expect(sessionsRequestCount).toBe(0);
});

test('stream loads sessions for a non-stale workspace', async ({ page }) => {
  await page.route('**/api/projects/4', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 4,
        name: 'chorus',
        displayName: 'Chorus Repo',
        directoryPath: 'F:/repo',
        fullPath: 'F:/repo/claudecodeui',
        path: 'F:/repo/claudecodeui',
        multiWorkspaceEnabled: true,
        workspaces: [
          {
            id: 12,
            name: 'dev',
            isDefault: true,
            worktreeBranch: 'dev',
            worktreePath: 'F:/repo',
            isStale: false,
            status: 'active',
            createdAt: '2026-04-10T08:22:00.000Z',
            updatedAt: '2026-04-16T09:20:00.000Z',
          },
        ],
      }),
    });
  });

  await page.route('**/api/projects/4/sessions**', async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('workspaceId') === '12') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            sessionId: 's1',
            provider: 'claude',
            status: 'active',
            title: 'Hello world',
            summary: 'Test session',
            lastActivity: '2026-04-16T10:00:00Z',
            createdAt: '2026-04-16T10:00:00Z',
          },
        ]),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.goto('/__visual/design-md?scene=project-inbox-session');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('[data-visual-ready="true"]');

  await expect(page.getByText('Hello world')).toBeVisible();
  await expect(page.getByText('Test session')).toBeVisible();
});

test('real project route loads sessions for the selected stream workspace', async ({ page }) => {
  let scopedSessionRequestCount = 0;

  await page.addInitScript(() => {
    localStorage.setItem('auth-token', 'playwright-token');
    localStorage.setItem(
      'chorus:home-preferences',
      JSON.stringify({
        version: 2,
        startupBehavior: 'restore-all',
      })
    );
  });

  await page.route('**/api/auth/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ needsSetup: false }),
    });
  });

  await page.route('**/api/auth/user', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: { username: 'playwright' } }),
    });
  });

  await page.route('**/api/user/onboarding-status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ hasCompletedOnboarding: true }),
    });
  });

  await page.route('**/api/plugins', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ plugins: [] }),
    });
  });

  await page.route('**/api/projects', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 4,
          name: 'phase-02',
          displayName: 'claudecodeui',
          fullPath: 'F:/workspace/dev/claudecodeui',
          path: 'F:/workspace/dev/claudecodeui',
          directoryPath: 'F:/workspace/dev/claudecodeui',
          multiWorkspaceEnabled: true,
          gitBranch: 'dev',
          gitCommonDir: 'F:/workspace/dev/claudecodeui/.git',
          workspaces: [],
          sessions: [],
          cursorSessions: [],
          codexSessions: [],
          geminiSessions: [],
          _workspaceId: 12,
          _parentProjectId: 4,
          _isWorkspaceExpansion: true,
          isStale: false,
        },
      ]),
    });
  });

  await page.route('**/api/projects/4', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 4,
        name: 'phase-02',
        displayName: 'claudecodeui',
        directoryPath: 'F:/workspace/dev/claudecodeui/.worktrees/phase-02',
        fullPath: 'F:/workspace/dev/claudecodeui/.worktrees/phase-02',
        path: 'F:/workspace/dev/claudecodeui/.worktrees/phase-02',
        multiWorkspaceEnabled: true,
        workspaces: [
          {
            id: 12,
            name: 'claudecodeui',
            isDefault: true,
            worktreeBranch: 'dev',
            worktreePath: 'F:/workspace/dev/claudecodeui',
            isStale: false,
            status: 'active',
            createdAt: '2026-04-10T08:22:00.000Z',
            updatedAt: '2026-04-16T09:20:00.000Z',
          },
          {
            id: 16,
            name: 'phase-02',
            isDefault: false,
            worktreeBranch: 'pr/phase-02',
            worktreePath: 'F:/workspace/dev/claudecodeui/.worktrees/phase-02',
            isStale: false,
            status: 'active',
            createdAt: '2026-04-13T10:15:00.000Z',
            updatedAt: '2026-04-16T09:05:00.000Z',
          },
        ],
      }),
    });
  });

  await page.route('**/api/projects/4/sessions**', async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('workspaceId') === '12') {
      scopedSessionRequestCount += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            sessionId: 'root-session-1',
            provider: 'claude',
            status: 'active',
            title: 'Loaded from root stream',
            summary: 'Scanned from the default workspace path',
            lastActivity: '2026-04-16T10:00:00Z',
            createdAt: '2026-04-16T10:00:00Z',
          },
        ]),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.goto('/project/4/phase-02');
  await page.waitForLoadState('domcontentloaded');

  await expect(page.getByText('Loaded from root stream')).toBeVisible();
  await expect(page.getByText('Scanned from the default workspace path')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'claudecodeui' })).toBeVisible();
  expect(scopedSessionRequestCount).toBeGreaterThan(0);
});

test('deleting a stale workspace returns to the app home surface', async ({ page }) => {
  await page.route('**/api/projects/4', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(staleProjectPayload),
    });
  });

  await page.route('**/api/projects/4/sessions**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.route('**/api/projects/4/workspaces/15*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.goto('/__visual/design-md?scene=project-inbox-stale');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('[data-visual-ready="true"]');

  await expect(page.getByText('Worktree removed')).toBeVisible();

  await page.click('button:has-text("Delete")');
  await page.waitForURL('**/');

  await expect(page.locator('input[placeholder="Search projects..."]')).toBeVisible();
});
