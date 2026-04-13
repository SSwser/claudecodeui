import { useMemo, useState } from 'react';
import { FolderSearch, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { ScrollArea } from '../../../shared/view/ui';
import { api } from '../../../utils/api';
import type { ProjectSession } from '../../../types/app';
import type { SessionState } from '../../../types/session';
import { useProjectInbox } from '../hooks/useProjectInbox';
import type { ProjectInboxProps } from '../types/types';
import ProjectInboxHeader from './ProjectInboxHeader';
import SessionCard from './SessionCard';

function toProjectSession(
  session: SessionState & { workspaceName?: string | null },
  projectName?: string
): ProjectSession {
  return {
    id: session.sessionId,
    title: session.title || undefined,
    summary: session.summary || session.title || undefined,
    createdAt: session.createdAt,
    created_at: session.createdAt,
    updated_at: session.lastActivity,
    lastActivity: session.lastActivity,
    __provider: session.provider,
    __projectName: projectName,
  };
}

async function renameInboxSession(session: SessionState, nextTitle: string) {
  const response = await api.renameSession(session.sessionId, nextTitle, session.provider);
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error || 'Failed to rename session');
  }
}

async function deleteInboxSession(projectName: string | undefined, session: SessionState) {
  if (session.provider === 'claude') {
    if (!projectName) {
      throw new Error('Project name is required to delete this session');
    }

    const response = await api.deleteSession(projectName, session.sessionId);
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(payload.error || 'Failed to delete session');
    }
    return;
  }

  if (session.provider === 'codex') {
    const response = await api.deleteCodexSession(session.sessionId);
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(payload.error || 'Failed to delete session');
    }
    return;
  }

  if (session.provider === 'gemini') {
    const response = await api.deleteGeminiSession(session.sessionId);
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(payload.error || 'Failed to delete session');
    }
    return;
  }

  throw new Error('Cursor session deletion is not available yet');
}

export default function ProjectInbox({
  projectId,
  projectName,
  projectDisplayName,
  onOpenSession,
  onCreateSession,
}: ProjectInboxProps) {
  const { t } = useTranslation('common');
  const {
    project,
    workspaces,
    sessions,
    isLoading,
    error,
    refresh,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortOrder,
    setSortOrder,
    selectedWorkspaceId,
    setSelectedWorkspaceId,
  } = useProjectInbox({ projectId });
  const [actionError, setActionError] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<
    (SessionState & { workspaceName?: string | null }) | null
  >(null);
  const [renameValue, setRenameValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resolvedProjectName = useMemo(
    () => projectName || project?.name,
    [project?.name, projectName]
  );

  const openRenameDialog = (session: SessionState & { workspaceName?: string | null }) => {
    setActionError(null);
    setRenameTarget(session);
    setRenameValue(session.title || session.summary || '');
  };

  const submitRename = async () => {
    if (!renameTarget) {
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    try {
      await renameInboxSession(renameTarget, renameValue.trim());
      setRenameTarget(null);
      await refresh();
    } catch (renameError) {
      setActionError(
        renameError instanceof Error ? renameError.message : 'Failed to rename session'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (session: SessionState & { workspaceName?: string | null }) => {
    const confirmed = window.confirm(`Delete session "${session.title || session.sessionId}"?`);
    if (!confirmed) {
      return;
    }

    setActionError(null);
    try {
      await deleteInboxSession(resolvedProjectName, session);
      await refresh();
    } catch (deleteError) {
      setActionError(
        deleteError instanceof Error ? deleteError.message : 'Failed to delete session'
      );
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-background/70 px-4 py-4 sm:px-5 sm:py-5">
      <ProjectInboxHeader
        project={project}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        workspaces={workspaces}
        selectedWorkspaceId={selectedWorkspaceId}
        onWorkspaceChange={setSelectedWorkspaceId}
        onCreateSession={onCreateSession}
      />

      <div className="mt-4 min-h-0 flex-1 rounded-large border border-border/70 bg-card/80 shadow-ring">
        {actionError || error ? (
          <div className="border-b border-border/70 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {actionError || error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex h-full items-center justify-center px-6 py-16 text-sm text-muted-foreground">
            Loading project inbox...
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border/70 bg-background/90">
              {searchQuery ? (
                <FolderSearch className="h-6 w-6 text-muted-foreground" />
              ) : (
                <Sparkles className="h-6 w-6 text-primary" />
              )}
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                {searchQuery ? 'No matching sessions' : 'Create your first session'}
              </h3>
              <p className="max-w-md text-sm leading-6 text-muted-foreground">
                {searchQuery
                  ? 'Try a different title or clear filters to see more project history.'
                  : 'Your project inbox is empty. Start a fresh session and it will appear here for triage and reopening.'}
              </p>
            </div>
            <Button type="button" onClick={onCreateSession}>
              {searchQuery ? 'Start a new session instead' : 'Create your first session'}
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-full px-4 py-4">
            <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {sessions.map((session) => (
                <SessionCard
                  key={`${session.provider}:${session.sessionId}`}
                  session={session}
                  onSelect={(selectedSession) =>
                    onOpenSession(toProjectSession(selectedSession, resolvedProjectName))
                  }
                  onFreeze={() => {
                    setActionError(
                      'Freeze controls are waiting on the Phase 2 lifecycle backend endpoint.'
                    );
                  }}
                  onArchive={() => {
                    setActionError(
                      'Archive controls are waiting on the Phase 2 lifecycle backend endpoint.'
                    );
                  }}
                  onDelete={handleDelete}
                  onRename={openRenameDialog}
                  actionsEnabled={{
                    freeze: false,
                    archive: false,
                    rename: true,
                    delete: session.provider !== 'cursor' || Boolean(resolvedProjectName),
                  }}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      <Dialog open={Boolean(renameTarget)} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename session</DialogTitle>
            <DialogDescription>
              Give this conversation a clearer title so it is easier to find from the inbox later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="project-inbox-rename">
              Session title
            </label>
            <Input
              id="project-inbox-rename"
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              placeholder={t('mainContent.untitledSession')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submitRename}
              disabled={isSubmitting || renameValue.trim().length === 0}
            >
              {isSubmitting ? 'Saving...' : 'Save title'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}