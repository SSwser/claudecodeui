import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, Command, MoonStar, Settings2, Sparkles, Wand2 } from 'lucide-react';
import LandingPage, { type LandingPageViewModel } from '@/components/home/view/LandingPage';
import AppTabStrip from '@/components/app/view/AppTabStrip';
import AuthScreenLayout from '@/components/auth/view/AuthScreenLayout';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VersionUpgradeModal } from '@/components/version-upgrade/view/VersionUpgradeModal';
import ProjectInbox from '@/components/project-inbox/view/ProjectInbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/shared/view/ui/Badge';
import type { AppShellTab } from '@/types/app';
import type { ReleaseInfo } from '@/types/sharedTypes';

const landingViewModel: LandingPageViewModel = {
  filters: {
    search: 'Raycast styling rollout',
    project: 'chorus',
    workspace: 'design-system',
    sessionType: 'all',
  },
  favoriteWorkspaces: [
    {
      id: 'workspace-1',
      projectName: 'chorus',
      displayName: 'Desktop UX Worktree',
      path: 'F:/workspace/dev/claudecodeui',
      sessionCount: 12,
    },
    {
      id: 'workspace-2',
      projectName: 'plugins',
      displayName: 'Plugin Sandbox',
      path: 'F:/workspace/dev/claudecodeui/plugins/starter',
      sessionCount: 4,
    },
  ],
  favoriteSessions: [
    {
      id: 'session-card-1',
      sessionId: 'session-123',
      projectName: 'chorus',
      title: 'Visual system migration',
      provider: 'Claude Code',
      status: 'active',
      summary: 'Token remap, fixture route, and baseline matrix rollout.',
    },
    {
      id: 'session-card-2',
      sessionId: 'session-456',
      projectName: 'chorus',
      title: 'Settings shell cleanup',
      provider: 'Codex',
      status: 'idle',
      summary: 'Bring notifications, tasks, and upgrade flow into the same shell language.',
    },
  ],
  recentSessions: [
    {
      id: 'recent-1',
      sessionId: 'recent-session-1',
      title: 'Chat composer sweep',
      projectName: 'chorus',
      displayProjectName: 'Chorus',
      provider: 'Claude Code',
      status: 'active',
      lastActivityLabel: '2 minutes ago',
      summary: 'Composer, mode selector, command menu and status strip aligned to DESIGN.md.',
      isFavorite: true,
    },
    {
      id: 'recent-2',
      sessionId: 'recent-session-2',
      title: 'Version upgrade panel',
      projectName: 'chorus',
      displayProjectName: 'Chorus',
      provider: 'Gemini',
      status: 'paused',
      lastActivityLabel: '15 minutes ago',
      summary: 'Rework modal shell, semantic alerts, and command copy affordances.',
      isFavorite: false,
    },
  ],
  projectOptions: [
    { value: 'all', label: 'All projects' },
    { value: 'chorus', label: 'Chorus' },
    { value: 'plugins', label: 'Plugin Sandbox' },
  ],
  workspaceOptions: [
    { value: 'all', label: 'All workspaces' },
    { value: 'design-system', label: 'Design system' },
    { value: 'agent-shell', label: 'Agent shell' },
  ],
};

const appTabs: AppShellTab[] = [
  {
    id: 'session-design',
    kind: 'session',
    label: 'Design rollout',
    sessionId: 'session-design',
    projectName: 'Chorus',
  },
  {
    id: 'session-settings',
    kind: 'session',
    label: 'Settings shell',
    sessionId: 'session-settings',
    projectName: 'Chorus',
  },
];

const releaseInfo: ReleaseInfo = {
  title: 'Chorus 1.29.0',
  body: '- Added a stable visual regression fixture route\n- Unified tokens, typography, and component shells around DESIGN.md\n- Tightened screenshot naming and update workflow',
  htmlUrl: 'https://github.com/siteboon/claudecodeui/releases/tag/v1.29.0',
  publishedAt: '2026-04-11T10:30:00.000Z',
};

const noop = () => {};

function SceneShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background px-6 py-10 text-foreground sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="rounded-large border border-border/70 bg-card px-6 py-5 shadow-ring">
          <p className="text-xs font-semibold uppercase tracking-ui text-brand">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-display text-foreground">{title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 tracking-body text-muted-foreground">
            {description}
          </p>
        </header>
        <div>{children}</div>
      </div>
    </div>
  );
}

function AuthScene() {
  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <AuthScreenLayout
        title="Sign in to Chorus"
        description="Stable fixture state for visual baselines. No network round-trips, no auth dependency."
        footerText="Design fixture route · auth shell"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium tracking-body text-muted-foreground">
              Workspace email
            </label>
            <Input value="designer@chorus.dev" readOnly />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium tracking-body text-muted-foreground">
              Access key
            </label>
            <Input type="password" value="fixture-secret" readOnly />
          </div>
          <div className="rounded-medium border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Invalid credentials are rendered with the destructive semantic contract, not a
            standalone blue panel.
          </div>
          <div className="flex gap-3">
            <Button className="flex-1">Continue</Button>
            <Button variant="outline" className="flex-1">
              Need setup
            </Button>
          </div>
        </div>
      </AuthScreenLayout>
    </div>
  );
}

function TabsScene() {
  return (
    <SceneShell
      eyebrow="Fixture · Tabs"
      title="Application shell and tab chrome"
      description="The tab strip is rendered with stable stub tabs so screenshots are not coupled to live sessions or auth state."
    >
      <div className="overflow-hidden rounded-large border border-border/70 bg-card shadow-ring">
        <AppTabStrip
          tabs={appTabs}
          activeTabId="session-design"
          onSelectTab={noop}
          onCloseTab={noop}
          onActivateHome={noop}
          onAddTab={noop}
        />
        <div className="grid gap-6 p-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-large border border-border/60 bg-surface-2 p-6 shadow-subtle">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-ui text-brand">
                  Pinned workspace
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-display">
                  Design system execution
                </h2>
              </div>
              <Badge variant="secondary">Wave 3 ready</Badge>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-7 tracking-body text-muted-foreground">
              Shared primitives land first, then shell surfaces, then long-tail cleanup with a
              focused audit gate.
            </p>
          </section>
          <section className="rounded-large border border-border/60 bg-background p-6 shadow-subtle">
            <p className="text-xs font-semibold uppercase tracking-ui text-muted-foreground">
              Next up
            </p>
            <ul className="mt-4 space-y-3 text-sm tracking-body text-foreground">
              <li className="rounded-medium border border-border/60 px-4 py-3">
                Chat messages shell
              </li>
              <li className="rounded-medium border border-border/60 px-4 py-3">
                Settings semantic panels
              </li>
              <li className="rounded-medium border border-border/60 px-4 py-3">
                Final snapshot refresh
              </li>
            </ul>
          </section>
        </div>
      </div>
    </SceneShell>
  );
}

function DialogScene() {
  return (
    <SceneShell
      eyebrow="Fixture · Dialog"
      title="Elevated panel contract"
      description="The dialog scene stays permanently open so the screenshot gate captures overlay, panel shell, actions, and semantic emphasis in one deterministic state."
    >
      <div className="rounded-large border border-border/70 bg-card px-6 py-20 shadow-ring">
        <p className="mx-auto max-w-2xl text-center text-sm leading-7 tracking-body text-muted-foreground">
          Background content remains static while the dialog tests its overlay, focus chrome, and
          CTA hierarchy.
        </p>
      </div>
      <Dialog open onOpenChange={noop}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refresh visual baselines?</DialogTitle>
            <DialogDescription>
              Snapshots are about to be regenerated from the fixture route. This screen verifies the
              elevated shell before that broad refresh happens.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-medium border border-border/60 bg-surface-2 px-4 py-3 text-sm leading-7 tracking-body text-muted-foreground">
            This scene avoids auth and live data entirely so Playwright only measures the design
            system, not app state.
          </div>
          <DialogFooter>
            <Button variant="outline">Review matrix</Button>
            <Button>Refresh screenshots</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SceneShell>
  );
}

function ChatScene() {
  return (
    <SceneShell
      eyebrow="Fixture · Chat"
      title="Composer, controls, and state badges"
      description="The real chat composer is too stateful for a stable fixture, so this scene models the visual shell with deterministic markup and shared primitives."
    >
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-large border border-border/70 bg-card p-6 shadow-ring">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Badge variant="secondary">Claude Sonnet</Badge>
              <Badge variant="success">Context synced</Badge>
            </div>
            <Button variant="ghost" size="sm">
              / Commands
            </Button>
          </div>
          <div className="mt-4 rounded-large border border-border/60 bg-surface-2 p-4 shadow-subtle">
            <textarea
              readOnly
              value="Bring the chat shell into the Raycast-inspired visual language without reintroducing blue hardcodes."
              className="min-h-40 w-full resize-none border-0 bg-transparent font-sans text-base tracking-body text-foreground outline-none placeholder:text-muted-foreground"
            />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Attach files
                </Button>
                <Button variant="ghost" size="sm">
                  Thinking mode
                </Button>
              </div>
              <Button>Send prompt</Button>
            </div>
          </div>
        </section>
        <section className="rounded-large border border-border/70 bg-card p-6 shadow-ring">
          <p className="text-xs font-semibold uppercase tracking-ui text-muted-foreground">
            Command menu
          </p>
          <div className="mt-4 space-y-3">
            {['/plan-phase', '/execute-phase', '/verify-work'].map((command) => (
              <div
                key={command}
                className="rounded-medium border border-border/60 bg-surface-2 px-4 py-3 shadow-subtle"
              >
                <p className="font-medium tracking-ui text-foreground">{command}</p>
                <p className="mt-1 text-sm tracking-body text-muted-foreground">
                  Deterministic fixture row for menu typography and hover shell baselines.
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </SceneShell>
  );
}

function SettingsScene() {
  return (
    <SceneShell
      eyebrow="Fixture · Settings"
      title="Settings shell and semantic cards"
      description="Instead of mounting the full controller-heavy settings surface, the fixture isolates the shell, tabs, and explanatory cards that need deterministic baselines."
    >
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-large border border-border/70 bg-card p-4 shadow-ring">
          {['Agents', 'Appearance', 'Notifications', 'Tasks'].map((item) => (
            <button
              key={item}
              type="button"
              className={`flex w-full items-center justify-between rounded-medium px-4 py-3 text-left text-sm font-medium tracking-ui transition-opacity ${item === 'Notifications' ? 'bg-surface-2 text-foreground shadow-subtle' : 'text-muted-foreground hover:text-foreground hover:opacity-60'}`}
            >
              <span>{item}</span>
              {item === 'Notifications' ? <MoonStar className="h-4 w-4 text-brand" /> : null}
            </button>
          ))}
        </aside>
        <div className="space-y-6">
          <section className="rounded-large border border-border/70 bg-card p-6 shadow-ring">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-ui text-brand">
                  Notifications
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-display">
                  Desktop and push delivery
                </h2>
              </div>
              <Badge variant="secondary">Enabled</Badge>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-medium border border-border/60 bg-surface-2 p-4 shadow-subtle">
                <p className="text-sm font-medium tracking-ui text-foreground">Permission status</p>
                <p className="mt-2 text-sm tracking-body text-muted-foreground">
                  Push permissions stay semantic, but the shell is neutral and reusable across tabs.
                </p>
              </div>
              <div className="rounded-medium border border-warning/30 bg-warning/10 p-4 shadow-subtle">
                <p className="text-sm font-medium tracking-ui text-foreground">Audit note</p>
                <p className="mt-2 text-sm tracking-body text-muted-foreground">
                  Visual hardcode lint must allow legitimate warning states while blocking old
                  blue/gray shells.
                </p>
              </div>
            </div>
          </section>
          <section className="rounded-large border border-border/70 bg-card p-6 shadow-ring">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                  Tasks
                </p>
                <h3 className="mt-2 text-lg font-semibold tracking-display">
                  Plan execution defaults
                </h3>
              </div>
              <Button variant="outline" size="sm">
                Save changes
              </Button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Input value="balanced" readOnly />
              <Input value="visual-fixture-route" readOnly />
            </div>
          </section>
        </div>
      </div>
    </SceneShell>
  );
}

function ProjectInboxStaleScene() {
  return (
    <SceneShell
      eyebrow="Fixture · Project Inbox"
      title="Stale stream resolution overlay"
      description="This scene mounts the real ProjectInbox with a stale initial workspace so browser tests can verify the panel appears before project data finishes loading."
    >
      <div className="overflow-hidden rounded-large border border-border/70 bg-card shadow-ring">
        <ProjectInbox
          projectId={4}
          projectName="chorus"
          projectDisplayName="Chorus Repo"
          initialWorkspaceId={15}
          initialWorkspaceIsStale
          initialWorkspaceLabel="claudecodeui-phase-02"
          onOpenSession={noop}
          onCreateSession={noop}
        />
      </div>
    </SceneShell>
  );
}

function ProjectInboxSessionScene() {
  return (
    <SceneShell
      eyebrow="Fixture · Project Inbox"
      title="Stream session loading"
      description="This scene mounts the real ProjectInbox with a live workspace so browser tests can verify sessions load correctly for the selected stream."
    >
      <div className="overflow-hidden rounded-large border border-border/70 bg-card shadow-ring">
        <ProjectInbox
          projectId={4}
          projectName="chorus"
          projectDisplayName="Chorus Repo"
          initialWorkspaceId={12}
          onOpenSession={noop}
          onCreateSession={noop}
        />
      </div>
    </SceneShell>
  );
}

type SceneName =
  | 'overview'
  | 'landing'
  | 'auth'
  | 'tabs'
  | 'dialog'
  | 'chat'
  | 'settings'
  | 'project-inbox-stale'
  | 'project-inbox-session'
  | 'upgrade';

const scenes: Array<{ id: Exclude<SceneName, 'overview'>; label: string; icon: React.ReactNode }> =
  [
    { id: 'landing', label: 'Landing shell', icon: <Sparkles className="h-4 w-4" /> },
    { id: 'auth', label: 'Auth form', icon: <AlertTriangle className="h-4 w-4" /> },
    { id: 'tabs', label: 'Tab chrome', icon: <Command className="h-4 w-4" /> },
    { id: 'dialog', label: 'Dialog panel', icon: <Wand2 className="h-4 w-4" /> },
    { id: 'chat', label: 'Chat controls', icon: <Sparkles className="h-4 w-4" /> },
    { id: 'settings', label: 'Settings shell', icon: <Settings2 className="h-4 w-4" /> },
    {
      id: 'project-inbox-stale',
      label: 'Project inbox stale overlay',
      icon: <AlertTriangle className="h-4 w-4" />,
    },
    {
      id: 'project-inbox-session',
      label: 'Project inbox session load',
      icon: <Sparkles className="h-4 w-4" />,
    },
    { id: 'upgrade', label: 'Upgrade modal', icon: <MoonStar className="h-4 w-4" /> },
  ];

export default function VisualRegressionFixtures() {
  const [searchParams] = useSearchParams();
  const scene = (searchParams.get('scene') as SceneName | null) ?? 'overview';

  const landing = useMemo(
    () => (
      <LandingPage
        viewModel={landingViewModel}
        onSearchChange={noop}
        onProjectChange={noop}
        onWorkspaceChange={noop}
        onSessionTypeChange={noop}
        onOpenWorkspace={noop}
        onOpenSession={noop}
        onToggleWorkspaceFavorite={noop}
        onToggleSessionFavorite={noop}
        onCreateSession={noop}
        onCreateWorkspace={noop}
      />
    ),
    []
  );

  const content = (() => {
    switch (scene) {
      case 'landing':
        return landing;
      case 'auth':
        return <AuthScene />;
      case 'tabs':
        return <TabsScene />;
      case 'dialog':
        return <DialogScene />;
      case 'chat':
        return <ChatScene />;
      case 'settings':
        return <SettingsScene />;
      case 'project-inbox-stale':
        return <ProjectInboxStaleScene />;
      case 'project-inbox-session':
        return <ProjectInboxSessionScene />;
      case 'upgrade':
        return (
          <div className="min-h-screen bg-background">
            <VersionUpgradeModal
              isOpen
              onClose={noop}
              releaseInfo={releaseInfo}
              currentVersion="1.28.0"
              latestVersion="1.29.0"
              installMode="npm"
            />
          </div>
        );
      case 'overview':
      default:
        return (
          <SceneShell
            eyebrow="Fixture · Overview"
            title="Visual regression scene matrix"
            description="Each scene is addressable by query parameter so Playwright can capture a deterministic state instead of whatever the app happens to render."
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {scenes.map((sceneLink) => (
                <a
                  key={sceneLink.id}
                  href={`/__visual/design-md?scene=${sceneLink.id}`}
                  className="rounded-large border border-border/70 bg-card px-5 py-4 text-foreground shadow-ring transition-opacity hover:opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-medium border border-border/60 bg-surface-2">
                      {sceneLink.icon}
                    </span>
                    <div>
                      <p className="font-medium tracking-ui">{sceneLink.label}</p>
                      <p className="mt-1 text-sm tracking-body text-muted-foreground">
                        `?scene={sceneLink.id}`
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </SceneShell>
        );
    }
  })();

  return (
    <div data-visual-ready="true" data-visual-scene={scene}>
      {content}
    </div>
  );
}
