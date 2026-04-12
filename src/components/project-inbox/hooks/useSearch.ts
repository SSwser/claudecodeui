import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { authenticatedFetch } from '../../../utils/api';
import type { SessionState, SessionSearchResult } from '../../../types/session';

const CONTENT_SEARCH_DEBOUNCE_MS = 300;

type UseSearchArgs = {
  projectId: number;
  sessions: SessionState[];
};

export type UseSearchReturn = {
  query: string;
  setQuery: (q: string) => void;
  /** Tier 1 — instant title/summary match, no network. */
  titleMatches: SessionState[];
  /** Tier 2 — debounced FTS5 content match, deduplicated from titleMatches. */
  contentMatches: SessionSearchResult[];
  isSearching: boolean;
  hasQuery: boolean;
};

export function useSearch({ projectId, sessions }: UseSearchArgs): UseSearchReturn {
  const [query, setQuery] = useState('');
  const [contentResults, setContentResults] = useState<SessionSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const trimmed = query.trim();
  const lower = trimmed.toLowerCase();

  // Tier 1: instant title/summary match — no network required.
  const titleMatches = useMemo(
    () =>
      trimmed
        ? sessions.filter(
            (s) =>
              (s.title ?? '').toLowerCase().includes(lower) ||
              (s.summary ?? '').toLowerCase().includes(lower),
          )
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trimmed, lower, sessions],
  );

  const titleMatchIds = useMemo(
    () => new Set(titleMatches.map((s) => s.sessionId)),
    [titleMatches],
  );

  // Deduplicate: sessions already surfaced by title match are excluded from content matches
  // so each session appears in exactly one section of the results dropdown.
  const contentMatches = useMemo(
    () => contentResults.filter((r) => !titleMatchIds.has(r.sessionId)),
    [contentResults, titleMatchIds],
  );

  const runContentSearch = useCallback(
    async (q: string) => {
      // Cancel any in-flight request before starting a new one.
      abortRef.current?.abort();

      if (!q) {
        setContentResults([]);
        setIsSearching(false);
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;
      setIsSearching(true);

      try {
        const params = new URLSearchParams({ q, projectId: String(projectId) });
        const res = await authenticatedFetch(`/api/search?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          setContentResults([]);
          return;
        }

        const data = (await res.json()) as SessionSearchResult[];
        if (!controller.signal.aborted) {
          setContentResults(data);
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.warn('[useSearch] content search error:', err);
          setContentResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    },
    [projectId],
  );

  useEffect(() => {
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
    }

    if (!trimmed) {
      setContentResults([]);
      setIsSearching(false);
      return;
    }

    debounceRef.current = window.setTimeout(() => {
      runContentSearch(trimmed);
    }, CONTENT_SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [trimmed, runContentSearch]);

  return {
    query,
    setQuery,
    titleMatches,
    contentMatches,
    isSearching,
    hasQuery: Boolean(trimmed),
  };
}
