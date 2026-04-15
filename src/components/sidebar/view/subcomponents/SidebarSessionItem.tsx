import { Archive, Check, Clock, Edit2, Pause, Play, Snowflake, Trash2, X } from 'lucide-react';
import type { TFunction } from 'i18next';
import { useState } from 'react';
import { Badge, Button, Input } from '../../../../shared/view/ui';
import { cn } from '../../../../lib/utils';
import { formatTimeAgo } from '../../../../utils/dateUtils';
import type { Project, ProjectSession, SessionProvider } from '../../../../types/app';
import type { SessionStatus } from '../../../../types/session';
import type { SessionWithProvider } from '../../types/types';
import { createSessionViewModel } from '../../utils/utils';
import SessionProviderLogo from '../../../llm-logo-provider/SessionProviderLogo';
import { useSessionLifecycle } from '../../../../hooks/useSessionLifecycle';

type SidebarSessionItemProps = {
  project: Project;
  session: SessionWithProvider;
  selectedSession: ProjectSession | null;
  currentTime: Date;
  editingSession: string | null;
  editingSessionName: string;
  onEditingSessionNameChange: (value: string) => void;
  onStartEditingSession: (sessionId: string, initialName: string) => void;
  onCancelEditingSession: () => void;
  onSaveEditingSession: (
    projectName: string,
    sessionId: string,
    summary: string,
    provider: SessionProvider
  ) => void;
  onProjectSelect: (project: Project) => void;
  onSessionSelect: (session: SessionWithProvider, projectName: string) => void;
  onDeleteSession: (
    projectName: string,
    sessionId: string,
    sessionTitle: string,
    provider: SessionProvider
  ) => void;
  t: TFunction;
};

export default function SidebarSessionItem({
  project,
  session,
  selectedSession,
  currentTime,
  editingSession,
  editingSessionName,
  onEditingSessionNameChange,
  onStartEditingSession,
  onCancelEditingSession,
  onSaveEditingSession,
  onProjectSelect,
  onSessionSelect,
  onDeleteSession,
  t,
}: SidebarSessionItemProps) {
  const sessionView = createSessionViewModel(session, currentTime, t);
  const isSelected = selectedSession?.id === session.id;
  const lifecycle = useSessionLifecycle();
  const [contextMenu, setContextMenu] = useState(false);

  // Derive session status: prefer WS-driven override, then session data field, then time-based heuristic
  const rawStatus =
    (session.status as SessionStatus | undefined) ?? (sessionView.isActive ? 'active' : undefined);
  const effectiveStatus = lifecycle.getStatus(session.id, rawStatus ?? 'active');
  const isSessionLoading = lifecycle.loadingIds.has(session.id);

  const selectMobileSession = () => {
    onProjectSelect(project);
    onSessionSelect(session, project.name);
  };

  const saveEditedSession = () => {
    onSaveEditingSession(project.name, session.id, editingSessionName, session.__provider);
  };

  const requestDeleteSession = () => {
    onDeleteSession(project.name, session.id, sessionView.sessionName, session.__provider);
  };

  return (
    <div
      className="group relative"
      onContextMenu={(e) => {
        e.preventDefault();
        setContextMenu(true);
      }}
    >
      {/* Active status dot */}
      {effectiveStatus === 'active' && sessionView.isActive && (
        <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 transform">
          <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
        </div>
      )}

      {/* Frozen status indicator */}
      {effectiveStatus === 'frozen' && (
        <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 transform">
          <Snowflake className="h-2.5 w-2.5 text-sky-500" />
        </div>
      )}

      <div className="md:hidden">
        <div
          className={cn(
            'p-2 mx-3 my-0.5 rounded-md bg-card border active:scale-[0.98] transition-all duration-150 relative',
            isSelected ? 'bg-primary/5 border-primary/20' : '',
            !isSelected && effectiveStatus === 'active' && sessionView.isActive
              ? 'border-green-500/30 bg-green-50/5 dark:bg-green-900/5'
              : 'border-border/30',
            effectiveStatus === 'archived' ? 'opacity-60' : ''
          )}
          onClick={selectMobileSession}
        >
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0',
                isSelected ? 'bg-primary/10' : 'bg-muted/50'
              )}
            >
              <SessionProviderLogo provider={session.__provider} className="h-3 w-3" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-foreground">
                {sessionView.sessionName}
              </div>
              <div className="mt-0.5 flex items-center gap-1">
                <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(sessionView.sessionTime, currentTime, t)}
                </span>
                {sessionView.messageCount > 0 && (
                  <Badge variant="secondary" className="ml-auto px-1 py-0 text-xs">
                    {sessionView.messageCount}
                  </Badge>
                )}
                <span className="ml-1 opacity-70">
                  <SessionProviderLogo provider={session.__provider} className="h-3 w-3" />
                </span>
              </div>
            </div>

            {!sessionView.isCursorSession && (
              <button
                className="ml-1 flex h-5 w-5 items-center justify-center rounded-md bg-red-50 opacity-70 transition-transform active:scale-95 dark:bg-red-900/20"
                onClick={(event) => {
                  event.stopPropagation();
                  requestDeleteSession();
                }}
              >
                <Trash2 className="h-2.5 w-2.5 text-red-600 dark:text-red-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="hidden md:block">
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start p-2 h-auto font-normal text-left hover:bg-accent/50 transition-colors duration-200',
            isSelected && 'bg-accent text-accent-foreground',
            effectiveStatus === 'archived' && 'opacity-60'
          )}
          onClick={() => onSessionSelect(session, project.name)}
        >
          <div className="flex w-full min-w-0 items-start gap-2">
            <SessionProviderLogo
              provider={session.__provider}
              className="mt-0.5 h-3 w-3 flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-foreground">
                {sessionView.sessionName}
              </div>
              <div className="mt-0.5 flex items-center gap-1">
                <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(sessionView.sessionTime, currentTime, t)}
                </span>
                {effectiveStatus === 'frozen' && (
                  <Snowflake className="ml-auto h-2.5 w-2.5 flex-shrink-0 text-sky-500 transition-opacity group-hover:opacity-0" />
                )}
                {sessionView.messageCount > 0 && effectiveStatus !== 'frozen' && (
                  <Badge
                    variant="secondary"
                    className="ml-auto px-1 py-0 text-xs transition-opacity group-hover:opacity-0"
                  >
                    {sessionView.messageCount}
                  </Badge>
                )}
                <span className="ml-1 opacity-70 transition-opacity group-hover:opacity-0">
                  <SessionProviderLogo provider={session.__provider} className="h-3 w-3" />
                </span>
              </div>
            </div>
          </div>
        </Button>

        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 transform items-center gap-1 opacity-0 transition-all duration-200 group-hover:opacity-100">
          {editingSession === session.id ? (
            <>
              <Input
                value={editingSessionName}
                onChange={(event) => onEditingSessionNameChange(event.target.value)}
                onKeyDown={(event) => {
                  event.stopPropagation();
                  if (event.key === 'Enter') {
                    saveEditedSession();
                  } else if (event.key === 'Escape') {
                    onCancelEditingSession();
                  }
                }}
                onClick={(event) => event.stopPropagation()}
                className="h-7 w-32 px-2 py-1 text-xs"
                autoFocus
              />
              <button
                className="flex h-6 w-6 items-center justify-center rounded bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40"
                onClick={(event) => {
                  event.stopPropagation();
                  saveEditedSession();
                }}
                title={t('tooltips.save')}
              >
                <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
              </button>
              <button
                className="flex h-6 w-6 items-center justify-center rounded bg-gray-50 hover:bg-gray-100 dark:bg-gray-900/20 dark:hover:bg-gray-900/40"
                onClick={(event) => {
                  event.stopPropagation();
                  onCancelEditingSession();
                }}
                title={t('tooltips.cancel')}
              >
                <X className="h-3 w-3 text-gray-600 dark:text-gray-400" />
              </button>
            </>
          ) : (
            <>
              <button
                className="flex h-6 w-6 items-center justify-center rounded bg-gray-50 hover:bg-gray-100 dark:bg-gray-900/20 dark:hover:bg-gray-900/40"
                onClick={(event) => {
                  event.stopPropagation();
                  onStartEditingSession(session.id, sessionView.sessionName);
                }}
                title={t('tooltips.editSessionName')}
              >
                <Edit2 className="h-3 w-3 text-gray-600 dark:text-gray-400" />
              </button>
              {!sessionView.isCursorSession && (
                <button
                  className="flex h-6 w-6 items-center justify-center rounded bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40"
                  onClick={(event) => {
                    event.stopPropagation();
                    requestDeleteSession();
                  }}
                  title={t('tooltips.deleteSession')}
                >
                  <Trash2 className="h-3 w-3 text-red-600 dark:text-red-400" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right-click context menu with lifecycle actions */}
      {contextMenu && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(false)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu(false);
            }}
          />
          <div className="absolute left-full top-0 z-50 ml-1 w-48 rounded-large border border-border/70 bg-card p-1.5 shadow-ring">
            {(effectiveStatus === 'frozen' || effectiveStatus === 'archived') && (
              <button
                type="button"
                disabled={isSessionLoading}
                onClick={async (e) => {
                  e.stopPropagation();
                  setContextMenu(false);
                  await lifecycle.resumeSession(session.id);
                }}
                className="flex w-full items-center gap-2 rounded-medium px-3 py-2 text-left text-sm text-foreground transition hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5" />
                Resume
              </button>
            )}
            {effectiveStatus === 'active' && (
              <button
                type="button"
                disabled={isSessionLoading}
                onClick={async (e) => {
                  e.stopPropagation();
                  setContextMenu(false);
                  await lifecycle.freezeSession(session.id);
                }}
                className="flex w-full items-center gap-2 rounded-medium px-3 py-2 text-left text-sm text-foreground transition hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Pause className="h-3.5 w-3.5" />
                Freeze
              </button>
            )}
            {effectiveStatus !== 'archived' && (
              <button
                type="button"
                disabled={isSessionLoading}
                onClick={async (e) => {
                  e.stopPropagation();
                  setContextMenu(false);
                  await lifecycle.archiveSession(session.id);
                }}
                className="flex w-full items-center gap-2 rounded-medium px-3 py-2 text-left text-sm text-foreground transition hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Archive className="h-3.5 w-3.5" />
                Archive
              </button>
            )}
            <button
              type="button"
              disabled={isSessionLoading}
              onClick={async (e) => {
                e.stopPropagation();
                setContextMenu(false);
                await lifecycle.deleteSession(session.id);
              }}
              className="flex w-full items-center gap-2 rounded-medium px-3 py-2 text-left text-sm text-destructive transition hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
