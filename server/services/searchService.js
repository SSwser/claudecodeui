import { db } from '../database/db.js';

/**
 * Sanitize a raw user query for safe use in FTS5 MATCH.
 * Keep Unicode letters/numbers across all shipped locales, but strip punctuation
 * that would otherwise turn into malformed FTS syntax.
 */
function sanitizeFtsQuery(query) {
  return query
    .replace(/[^\p{L}\p{N}\s_-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Build an FTS5 MATCH expression with prefix wildcards.
 * "hello world" → "hello* world*"  (both tokens must be present, prefix-matched)
 */
function buildFtsQuery(sanitized) {
  return sanitized
    .split(' ')
    .filter(Boolean)
    .map((token) => `${token}*`)
    .join(' ');
}

/**
 * Index (or re-index) a session in the FTS5 table.
 * Deletes any existing entry first — contentless tables do not support UPDATE in place.
 */
export function indexSession(sessionId, provider, title, content) {
  // Remove before re-inserting to avoid duplicate FTS5 tokens for the same session.
  removeFromIndex(sessionId, provider);
  db.prepare(
    'INSERT INTO session_search(provider, session_id, title, content) VALUES (?, ?, ?, ?)'
  ).run(provider, sessionId, title ?? '', content ?? '');
}

/**
 * Remove a session from the FTS5 index.
 *
 * contentless_delete=1 requires supplying the original column values for deletion —
 * SQLite cannot retrieve them from the content table (there is none). We read the
 * current row from the FTS5 shadow tables first, then issue the 'delete' command.
 */
export function removeFromIndex(sessionId, provider) {
  try {
    const existing = db
      .prepare(
        'SELECT rowid, provider, session_id, title, content FROM session_search WHERE session_id = ? AND provider = ?'
      )
      .get(sessionId, provider);

    if (existing) {
      db.prepare(
        "INSERT INTO session_search(session_search, rowid, provider, session_id, title, content) VALUES ('delete', ?, ?, ?, ?, ?)"
      ).run(
        existing.rowid,
        existing.provider,
        existing.session_id,
        existing.title,
        existing.content
      );
    }
  } catch (error) {
    console.warn('[searchService] removeFromIndex error:', error.message);
  }
}

/**
 * Full-text search across sessions belonging to a project.
 *
 * Returns [] on any FTS5 parse error rather than throwing — malformed queries
 * (e.g. empty string after sanitization) must never propagate to the route layer.
 *
 * Note: highlight() and snippet() are not available in contentless FTS5 mode.
 * Titles are returned from the session_state join, not from FTS5 snippet helpers.
 */
export function search(query, projectId, limit = 20) {
  try {
    const sanitized = sanitizeFtsQuery(query);
    if (!sanitized) return [];

    const ftsQuery = buildFtsQuery(sanitized);

    return db
      .prepare(
        `SELECT
          ss.session_id AS sessionId,
          s.status,
          s.provider,
          s.title,
          ss.rank
        FROM session_search ss
        JOIN session_state s ON s.session_id = ss.session_id AND s.provider = ss.provider
        JOIN workspaces w ON w.id = s.workspace_id
        WHERE ss MATCH ?
          AND s.status != 'deleted'
          AND w.project_id = ?
        ORDER BY ss.rank
        LIMIT ?`
      )
      .all(ftsQuery, projectId, limit);
  } catch (error) {
    console.warn('[searchService] search error:', error.message);
    return [];
  }
}

/**
 * Rebuild the entire FTS5 index from session_state.
 * Used after bulk imports or to recover from potential index drift.
 */
export function reindexAll() {
  const sessions = db
    .prepare(
      "SELECT session_id, provider, title, summary FROM session_state WHERE status != 'deleted'"
    )
    .all();

  // Clear the existing index before bulk rebuild.
  db.exec('DELETE FROM session_search');

  const insert = db.prepare(
    'INSERT INTO session_search(provider, session_id, title, content) VALUES (?, ?, ?, ?)'
  );
  for (const session of sessions) {
    insert.run(session.provider, session.session_id, session.title ?? '', session.summary ?? '');
  }

  return { indexed: sessions.length };
}
