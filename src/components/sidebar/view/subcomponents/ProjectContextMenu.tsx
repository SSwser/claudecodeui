import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  Copy,
  FolderOpen,
  MessageSquarePlus,
  Pencil,
  RefreshCw,
  SquareTerminal,
  StopCircle,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Project } from '@/types/app';

type ContextMenuAction = {
  key: string;
  label: string;
  icon?: LucideIcon;
  onSelect?: () => void;
  isDanger?: boolean;
  isDisabled?: boolean;
  showDividerBefore?: boolean;
};

const CONTEXT_MENU_WIDTH = 220;
const CONTEXT_MENU_HEIGHT = 340;
const VIEWPORT_PADDING = 10;

function calculateViewportSafePosition(clientX: number, clientY: number) {
  const safeX =
    clientX + CONTEXT_MENU_WIDTH > window.innerWidth
      ? window.innerWidth - CONTEXT_MENU_WIDTH - VIEWPORT_PADDING
      : clientX;
  const safeY =
    clientY + CONTEXT_MENU_HEIGHT > window.innerHeight
      ? window.innerHeight - CONTEXT_MENU_HEIGHT - VIEWPORT_PADDING
      : clientY;

  return { x: Math.max(VIEWPORT_PADDING, safeX), y: Math.max(VIEWPORT_PADDING, safeY) };
}

export default function ProjectContextMenu({
  children,
  project,
  onRename,
  onDelete,
  onRefresh,
  onNewSession,
  className = '',
}: {
  children: ReactNode;
  project: Project;
  onRename: () => void;
  onDelete: () => void;
  onRefresh: () => void;
  onNewSession: () => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const closeContextMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const openContextMenuAtCursor = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuPosition(calculateViewportSafePosition(event.clientX, event.clientY));
    setIsMenuOpen(true);
  }, []);

  const runMenuActionAndClose = useCallback(
    (action?: () => void) => {
      closeContextMenu();
      action?.();
    },
    [closeContextMenu]
  );

  const handleCopyPath = useCallback(() => {
    if (project.fullPath) {
      void navigator.clipboard.writeText(project.fullPath);
    }
  }, [project.fullPath]);

  const handleRevealInExplorer = useCallback(() => {
    if (!project.fullPath) return;
    // Use the server's shell-open endpoint to reveal the folder in OS file explorer
    void fetch('/api/shell/open-folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: project.fullPath }),
    });
  }, [project.fullPath]);

  const handleOpenInTerminal = useCallback(() => {
    if (!project.fullPath) return;
    void fetch('/api/shell/open-terminal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: project.fullPath }),
    });
  }, [project.fullPath]);

  const menuActions = useMemo<ContextMenuAction[]>(
    () => [
      {
        key: 'rename',
        icon: Pencil,
        label: t('projectContext.rename', 'Rename'),
        onSelect: onRename,
      },
      {
        key: 'refresh',
        icon: RefreshCw,
        label: t('projectContext.refresh', 'Refresh'),
        onSelect: onRefresh,
        showDividerBefore: true,
      },
      {
        key: 'newSession',
        icon: MessageSquarePlus,
        label: t('projectContext.newSession', 'New Session'),
        onSelect: onNewSession,
      },
      {
        key: 'revealInExplorer',
        icon: FolderOpen,
        label: t('projectContext.revealInExplorer', 'Reveal in Explorer'),
        onSelect: handleRevealInExplorer,
        showDividerBefore: true,
      },
      {
        key: 'openInTerminal',
        icon: SquareTerminal,
        label: t('projectContext.openInTerminal', 'Open in Terminal'),
        onSelect: handleOpenInTerminal,
      },
      {
        key: 'copyPath',
        icon: Copy,
        label: t('projectContext.copyPath', 'Copy Path'),
        onSelect: handleCopyPath,
      },
      {
        key: 'killAllSessions',
        icon: StopCircle,
        label: t('projectContext.killAllSessions', 'Kill All Sessions'),
        isDisabled: true,
        showDividerBefore: true,
      },
      {
        key: 'delete',
        icon: Trash2,
        label: t('projectContext.delete', 'Delete…'),
        onSelect: onDelete,
        isDanger: true,
      },
    ],
    [
      t,
      onRename,
      onRefresh,
      onNewSession,
      onDelete,
      handleRevealInExplorer,
      handleOpenInTerminal,
      handleCopyPath,
    ]
  );

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleOutsideMouseDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeContextMenu();
      }
    };

    const handleEscapeKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeContextMenu();
    };

    document.addEventListener('mousedown', handleOutsideMouseDown);
    document.addEventListener('keydown', handleEscapeKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideMouseDown);
      document.removeEventListener('keydown', handleEscapeKeyDown);
    };
  }, [closeContextMenu, isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyboardNav = (event: KeyboardEvent) => {
      const menuItems = menuRef.current?.querySelectorAll<HTMLElement>(
        '[role="menuitem"]:not([disabled])'
      );
      if (!menuItems || menuItems.length === 0) return;

      const activeElement = document.activeElement as HTMLElement | null;
      const currentIndex = Array.from(menuItems).findIndex((item) => item === activeElement);

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        const nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
        menuItems[nextIndex]?.focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
        menuItems[prevIndex]?.focus();
      } else if (event.key === 'Enter' || event.key === ' ') {
        if (activeElement?.hasAttribute('role')) {
          event.preventDefault();
          activeElement.click();
        }
      }
    };

    document.addEventListener('keydown', handleKeyboardNav);
    return () => document.removeEventListener('keydown', handleKeyboardNav);
  }, [isMenuOpen]);

  return (
    <>
      <div onContextMenu={openContextMenuAtCursor} className={cn('contents', className)}>
        {children}
      </div>

      {isMenuOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={t('projectContext.menuLabel', 'Project context menu')}
          style={{
            position: 'fixed',
            left: menuPosition.x,
            top: menuPosition.y,
            zIndex: 9999,
            // Level 2 ring + deeper floating drop shadow — Raycast macOS-native depth system
            boxShadow:
              'var(--shadow-ring), 0 12px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
          }}
          className={cn(
            // Surface: card surface (#101111 in dark) + barely-visible white border (§4 Cards)
            'min-w-[220px] rounded-[12px] border border-white/[0.06] bg-popover p-1.5',
            // Entry animation — quick and precise
            'animate-in fade-in-0 zoom-in-95 duration-100'
          )}
        >
          {menuActions.map((action) => (
            <Fragment key={action.key}>
              {action.showDividerBefore && (
                // Divider: same barely-visible white alpha used for all card borders in dark
                <div className="mx-1.5 my-1 h-px bg-white/[0.06]" />
              )}
              <button
                role="menuitem"
                tabIndex={action.isDisabled ? -1 : 0}
                disabled={action.isDisabled}
                onClick={() => runMenuActionAndClose(action.onSelect)}
                className={cn(
                  // Base layout — Caption typography (14px/500/+0.2px) per DESIGN.md §3
                  'flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5',
                  'text-left text-sm font-medium tracking-[0.2px]',
                  // Interaction — transition-all for opacity + background; 150ms feels native
                  'transition-all duration-150',
                  'focus:outline-none',
                  action.isDisabled
                    ? 'cursor-not-allowed text-muted-foreground opacity-40'
                    : action.isDanger
                      ? // Danger: Raycast Red (#FF6363 = --destructive) + transparent red glow on hover
                        'text-destructive focus:bg-destructive/10 hover:bg-destructive/10'
                      : // Normal: near-white text + muted surface highlight on hover
                        'text-popover-foreground focus:bg-accent hover:bg-accent'
                )}
              >
                {action.icon && (
                  <action.icon
                    className={cn(
                      'h-3.5 w-3.5 flex-shrink-0',
                      action.isDisabled
                        ? 'text-muted-foreground'
                        : action.isDanger
                          ? 'text-destructive'
                          : 'text-muted-foreground'
                    )}
                  />
                )}
                <span className="flex-1">{action.label}</span>
              </button>
            </Fragment>
          ))}
        </div>
      )}
    </>
  );
}
