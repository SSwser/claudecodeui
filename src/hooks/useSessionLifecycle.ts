import { useCallback, useEffect, useState } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { authenticatedFetch } from '../utils/api';
import type { SessionStatus } from '../types/session';

// Tracks real-time status overrides from WebSocket `session_state_changed` events.
// These override prop-derived status until the parent component refreshes from the server.
type StatusOverrides = Record<string, SessionStatus>;

export interface SessionLifecycleHook {
  freezeSession: (sessionId: string) => Promise<boolean>;
  resumeSession: (sessionId: string) => Promise<boolean>;
  archiveSession: (sessionId: string) => Promise<boolean>;
  deleteSession: (sessionId: string) => Promise<boolean>;
  getSessionState: (sessionId: string) => Promise<unknown>;
  getStatus: (sessionId: string, fallback: SessionStatus) => SessionStatus;
  statusOverrides: StatusOverrides;
  loadingIds: Set<string>;
  error: string | null;
  clearError: () => void;
}

export function useSessionLifecycle(): SessionLifecycleHook {
  const { latestMessage } = useWebSocket();
  const [statusOverrides, setStatusOverrides] = useState<StatusOverrides>({});
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Listen for session_state_changed WebSocket events to keep all UI surfaces in sync
  // without requiring a full data refresh from the server.
  useEffect(() => {
    if (!latestMessage || latestMessage.type !== 'session_state_changed') return;
    const { sessionId, status } = latestMessage as { sessionId?: string; status?: SessionStatus };
    if (sessionId && status) {
      setStatusOverrides((prev) => ({ ...prev, [sessionId]: status }));
    }
  }, [latestMessage]);

  const setLoading = useCallback((sessionId: string, loading: boolean) => {
    setLoadingIds((prev) => {
      const next = new Set(prev);
      if (loading) next.add(sessionId);
      else next.delete(sessionId);
      return next;
    });
  }, []);

  const revertOverride = useCallback((sessionId: string) => {
    setStatusOverrides((prev) => {
      const next = { ...prev };
      delete next[sessionId];
      return next;
    });
  }, []);

  const freezeSession = useCallback(
    async (sessionId: string): Promise<boolean> => {
      const confirmed = window.confirm('Freeze this session? You can resume it at any time.');
      if (!confirmed) return false;
      setLoading(sessionId, true);
      setError(null);
      // Optimistic update so UI responds immediately before server round-trip
      setStatusOverrides((prev) => ({ ...prev, [sessionId]: 'frozen' }));
      try {
        const response = await authenticatedFetch(
          `/api/sessions/${encodeURIComponent(sessionId)}/freeze`,
          { method: 'POST' },
        );
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error || 'Failed to freeze session');
        }
        return true;
      } catch (err) {
        // Revert optimistic update on failure so stale status isn't shown
        revertOverride(sessionId);
        setError(err instanceof Error ? err.message : 'Failed to freeze session');
        return false;
      } finally {
        setLoading(sessionId, false);
      }
    },
    [setLoading, revertOverride],
  );

  const resumeSession = useCallback(
    async (sessionId: string): Promise<boolean> => {
      setLoading(sessionId, true);
      setError(null);
      setStatusOverrides((prev) => ({ ...prev, [sessionId]: 'active' }));
      try {
        const response = await authenticatedFetch(
          `/api/sessions/${encodeURIComponent(sessionId)}/resume`,
          { method: 'POST' },
        );
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error || 'Failed to resume session');
        }
        return true;
      } catch (err) {
        revertOverride(sessionId);
        setError(err instanceof Error ? err.message : 'Failed to resume session');
        return false;
      } finally {
        setLoading(sessionId, false);
      }
    },
    [setLoading, revertOverride],
  );

  const archiveSession = useCallback(
    async (sessionId: string): Promise<boolean> => {
      setLoading(sessionId, true);
      setError(null);
      setStatusOverrides((prev) => ({ ...prev, [sessionId]: 'archived' }));
      try {
        const response = await authenticatedFetch(
          `/api/sessions/${encodeURIComponent(sessionId)}/archive`,
          { method: 'POST' },
        );
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error || 'Failed to archive session');
        }
        return true;
      } catch (err) {
        revertOverride(sessionId);
        setError(err instanceof Error ? err.message : 'Failed to archive session');
        return false;
      } finally {
        setLoading(sessionId, false);
      }
    },
    [setLoading, revertOverride],
  );

  const deleteSession = useCallback(
    async (sessionId: string): Promise<boolean> => {
      const confirmed = window.confirm('Delete this session? This cannot be undone.');
      if (!confirmed) return false;
      setLoading(sessionId, true);
      setError(null);
      setStatusOverrides((prev) => ({ ...prev, [sessionId]: 'deleted' }));
      try {
        const response = await authenticatedFetch(
          `/api/sessions/${encodeURIComponent(sessionId)}`,
          { method: 'DELETE' },
        );
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error || 'Failed to delete session');
        }
        return true;
      } catch (err) {
        revertOverride(sessionId);
        setError(err instanceof Error ? err.message : 'Failed to delete session');
        return false;
      } finally {
        setLoading(sessionId, false);
      }
    },
    [setLoading, revertOverride],
  );

  const getSessionState = useCallback(async (sessionId: string): Promise<unknown> => {
    try {
      const response = await authenticatedFetch(
        `/api/sessions/${encodeURIComponent(sessionId)}/state`,
      );
      if (!response.ok) return null;
      return response.json();
    } catch {
      return null;
    }
  }, []);

  const getStatus = useCallback(
    (sessionId: string, fallback: SessionStatus): SessionStatus => {
      return statusOverrides[sessionId] ?? fallback;
    },
    [statusOverrides],
  );

  return {
    freezeSession,
    resumeSession,
    archiveSession,
    deleteSession,
    getSessionState,
    getStatus,
    statusOverrides,
    loadingIds,
    error,
    clearError: () => setError(null),
  };
}
