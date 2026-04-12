/**
 * Migration 002: FTS5 full-text search index for sessions.
 *
 * session_id is stored UNINDEXED — used in JOINs but not as a FTS5 MATCH target.
 * contentless_delete=1 allows row deletion without needing a backing content table,
 * but requires supplying original column values when deleting via the 'delete' command.
 *
 * prefix='2 3' enables prefix matching for 2- and 3-character prefixes at index time,
 * improving performance for partial-word queries.
 */
export function runMigration(db) {
  // If the table already exists without session_id (created by an earlier inline migration),
  // drop it so we can recreate with the correct schema. The FTS index is purely a search
  // cache; data loss is safe — searchService.reindexAll() rebuilds it from session_state.
  const existing = db
    .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='session_search'")
    .get();

  if (existing && existing.sql && !existing.sql.includes('session_id')) {
    db.exec('DROP TABLE IF EXISTS session_search');
  }

  db.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS session_search USING fts5(
    session_id UNINDEXED,
    title,
    content,
    content='',
    contentless_delete=1,
    prefix='2 3',
    tokenize='unicode61'
  )`);
}
