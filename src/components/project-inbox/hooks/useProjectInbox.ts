import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  InboxSortOrder,
  InboxStatusFilter,
  ProjectInboxProject,
  ProjectInboxWorkspace,
} from '../types/types';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { authenticatedFetch } from '@/utils/api';
import type { SessionState } from '@/types/session';

type SessionStateRow = SessionState & { workspaceName?: string | null };

type UseProjectInboxArgs = {
  projectId: number;
  /** Pre-select this workspace on first load (set when navigating from a
   *  specific sidebar stream row in a multi-workspace project). */
  initialWorkspaceId?: number;
};

const SEARCH_DEBOUNCE_MS = 350;

function resolveWorkspaceId(
  workspaces: ProjectInboxWorkspace[],
  preferredWorkspaceId: number | undefined,
  currentWorkspaceId: number | null
) {
  if (currentWorkspaceId && workspaces.some((workspace) => workspace.id === currentWorkspaceId)) {
    return currentWorkspaceId;
  }

  if (
    preferredWorkspaceId &&
    workspaces.some((workspace) => workspace.id === preferredWorkspaceId)
  ) {
    return preferredWorkspaceId;
  }

  return workspaces.find((workspace) => workspace.isDefault)?.id ?? workspaces[0]?.id ?? null;
}

function bySortOrder(sortOrder: InboxSortOrder) {
  return (left: SessionStateRow, right: SessionStateRow) => {
    if (sortOrder === 'name') {
      return (left.title || left.summary || left.sessionId).localeCompare(
        right.title || right.summary || right.sessionId
      );
    }

    if (sortOrder === 'created') {
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    }

    return new Date(right.lastActivity).getTime() - new Date(left.lastActivity).getTime();
  };
}

export function useProjectInbox({ projectId, initialWorkspaceId }: UseProjectInboxArgs) {
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

  const resolvedWorkspaceId = useMemo(
    () => resolveWorkspaceId(workspaces, initialWorkspaceId, selectedWorkspaceId),
    [initialWorkspaceId, selectedWorkspaceId, workspaces]
  );

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === resolvedWorkspaceId) ?? null,
    [resolvedWorkspaceId, workspaces]
  );

  const fetchProject = useCallback(async () => {
    const response = await authenticatedFetch(`/api/projects/${projectId}`);
    if (!response.ok) {
      throw new Error('Failed to load project');
    }

    const data = (await response.json()) as ProjectInboxProject;

    setProject(data);
    setWorkspaces(data.workspaces ?? []);
  }, [projectId]);

  const fetchSessions = useCallback(
    async (workspaceId: number | null, workspace: ProjectInboxWorkspace | null) => {
      const requestId = fetchSeqRef.current + 1;
      fetchSeqRef.current = requestId;

      if (workspace?.isStale) {
        setRawSessions([]);
        return;
      }

      const params = new URLSearchParams();

      if (workspaceId) {
        params.set('workspaceId', String(workspaceId));
      }
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      if (debouncedQuery) {
        params.set('q', debouncedQuery);
      }

      const queryString = params.toString();
      const response = await authenticatedFetch(
        `/api/projects/${projectId}/sessions${queryString ? `?${queryString}` : ''}`
      );
      if (!response.ok) {
        throw new Error('Failed to load sessions');
      }

      const data = (await response.json()) as SessionStateRow[];
      if (fetchSeqRef.current !== requestId) {
        return;
      }

      setRawSessions(data);
    },
    [debouncedQuery, projectId, statusFilter]
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await fetchProject();
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Failed to load inbox');
      setIsLoading(false);
    }
  }, [fetchProject]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!project) {
      return;
    }

    let isCancelled = false;

    const loadSessions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        await fetchSessions(resolvedWorkspaceId, selectedWorkspace);
      } catch (sessionError) {
        if (!isCancelled) {
          setError(sessionError instanceof Error ? sessionError.message : 'Failed to load inbox');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadSessions();

    return () => {
      isCancelled = true;
    };
  }, [fetchSessions, project, resolvedWorkspaceId, selectedWorkspace]);

  useEffect(() => {
    if (!latestMessage) {
      return;
    }

    if (latestMessage.type === 'session_state_changed') {
      setRawSessions((previousSessions) => {
        const hasMatch = previousSessions.some(
          (session) =>
            session.sessionId === latestMessage.sessionId &&
            session.provider === latestMessage.provider
        );

        if (!hasMatch) {
          void fetchSessions(resolvedWorkspaceId, selectedWorkspace);
          return previousSessions;
        }

        return previousSessions.map((session) =>
          session.sessionId === latestMessage.sessionId &&
          session.provider === latestMessage.provider
            ? { ...session, status: latestMessage.status }
            : session
        );
      });
      return;
    }

    if (
      latestMessage.type === 'projects_updated' ||
      latestMessage.type === 'websocket-reconnected'
    ) {
      void refresh();
    }
  }, [fetchSessions, latestMessage, refresh, resolvedWorkspaceId, selectedWorkspace]);

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
    selectedWorkspace,
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
    selectedWorkspaceId: resolvedWorkspaceId,
    setSelectedWorkspaceId,
  };
}
