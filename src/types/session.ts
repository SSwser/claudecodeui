import type { SessionProvider } from './app';

export type SessionStatus = 'active' | 'frozen' | 'archived' | 'deleted';

export interface SessionState {
  id: number;
  sessionId: string;
  workspaceId: number;
  provider: SessionProvider;
  status: SessionStatus;
  title: string | null;
  summary: string | null;
  lastActivity: string;
  frozenAt: string | null;
  archivedAt: string | null;
  createdAt: string;
}

export interface SessionSearchResult {
  sessionId: string;
  rank: number;
  title: string | null;
  provider: SessionProvider;
  status: SessionStatus;
}
