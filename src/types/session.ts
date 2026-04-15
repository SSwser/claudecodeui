import type { SessionProvider } from './app';

export type SessionStatus = 'active' | 'frozen' | 'archived' | 'deleted';

/**
 * Shared session shape for the Phase 2 inbox / lifecycle / search surfaces.
 * These UI flows were split across several commits and started importing a
 * dedicated session types module; keeping the adapter here avoids each feature
 * redefining the same transport shape in slightly different ways.
 */
export type SessionState = {
  sessionId: string;
  provider: SessionProvider;
  status: SessionStatus;
  title?: string | null;
  summary?: string | null;
  createdAt: string;
  lastActivity: string;
  messageCount?: number;
  workspaceId?: number | null;
  workspaceName?: string | null;
};

export type SessionSearchResult = {
  sessionId: string;
  provider: SessionProvider;
  status: SessionStatus;
  title?: string | null;
  summary?: string | null;
  rank?: number;
};
