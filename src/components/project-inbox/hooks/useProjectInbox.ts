import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWebSocket } from '../../../contexts/WebSocketContext';
import { authenticatedFetch } from '../../../utils/api';
import type { SessionState } from '../../../types/session';
import type {
  InboxSortOrder,
  InboxStatusFilter,
  ProjectInboxProject,
  ProjectInboxWorkspace,
} from '../types/types';

type SessionStateRow = SessionState & { workspaceName?: string | null };

type UseProjectInboxArgs = {
  projectId: number;
};

const SEARCH_DEBOUNCE_MS = 350;

function bySortOrder(sortOrder: InboxSortOrder) {
  return (left: SessionStateRow, right: SessionStateRow) => {
    if (sortOrder === 'name') {
      return (left.title || left.summary || left.sessionId).localeCompare(
        right.title || right.summary || right.sessionId,
      );
    }

    if (sortOrder === 'created') {
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    }

    return new Date(right.lastActivity).getTime() - new Date(left.lastActivity).getTime();
  };
}

export function useProjectInbox({ projectId }: UseProjectInboxArgs) {
  const { latestMessage } = useWebSocket();
  const [project, setProject] = useState<ProjectInboxProject | null>(null);
  const [workspaces, setWorkspaces] = useState<ProjectInboxWorkspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null);
  const [rawSessions, setRawSessions] = useState<SessionStateRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InboxStatusFilter>('all');
  const [sortOrder, setSortOrder] = useState<InboxSortOrder>('recent');
  const fetchSeqRef = useRef(0);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  const fetchProject = useCallback(async () => {
    const response = await authenticatedFetch(`/api/projects/${projectId}`);
    if (!response.ok) {
      throw new Error('Failed to load project');
    }

    const data = (await response.json()) as ProjectInboxProject;
    setProject(data);
    setWorkspaces(data.workspaces ?? []);
    setSelectedWorkspaceId((currentValue) => {
      if (currentValue && data.workspaces?.some((workspace) => workspace.id === currentValue)) {
        return currentValue;
      }

      return data.workspaces?.find((workspace) => workspace.isDefault)?.id ?? data.workspaces?.[0]?.id ?? null;
    });
  }, [projectId]);

  const fetchSessions = useCallback(async () => {
    const requestId = fetchSeqRef.current + 1;
    fetchSeqRef.current = requestId;

    const params = new URLSearchParams();
    if (selectedWorkspaceId) {
      params.set('workspaceId', String(selectedWorkspaceId));
    }
    if (statusFilter !== 'all') {
      params.set('status', statusFilter);
    }
    if (debouncedQuery) {
      params.set('q', debouncedQuery);
    }

    const response = await authenticatedFetch(
      `/api/projects/${projectId}/sessions${params.size ? `?${params.toString()}` : ''}`,
    );
    if (!response.ok) {
      throw new Error('Failed to load sessions');
    }

    const data = (await response.json()) as SessionStateRow[];
    if (fetchSeqRef.current !== requestId) {
      return;
    }

    setRawSessions(data);
  }, [debouncedQuery, projectId, selectedWorkspaceId, statusFilter]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await fetchProject();
      await fetchSessions();
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Failed to load inbox');
    } finally {
      setIsLoading(false);
    }
  }, [fetchProject, fetchSessions]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!latestMessage) {
      return;
    }

    if (latestMessage.type === 'session_state_changed') {
      setRawSessions((previousSessions) => {
        const hasMatch = previousSessions.some(
          (session) =>
            session.sessionId === latestMessage.sessionId && session.provider === latestMessage.provider,
        );

        if (!hasMatch) {
          void fetchSessions();
          return previousSessions;
        }

        return previousSessions.map((session) =>
          session.sessionId === latestMessage.sessionId && session.provider === latestMessage.provider
            ? { ...session, status: latestMessage.status }
            : session,
        );
      });
      return;
    }

    if (latestMessage.type === 'projects_updated' || latestMessage.type === 'websocket-reconnected') {
      void fetchSessions();
    }
  }, [fetchSessions, latestMessage]);

  const sessions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return [...rawSessions]
      .filter((session) => {
        if (!normalizedQuery) {
          return true;
        }

        return [session.title, session.summary, session.sessionId]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort(bySortOrder(sortOrder));
  }, [rawSessions, searchQuery, sortOrder]);

  return {
    project,
    workspaces,
    sessions,
    rawSessions,
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
  };
}