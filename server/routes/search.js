import express from 'express';
import { search, reindexAll } from '../services/searchService.js';

const router = express.Router();

function parsePositiveInt(value, defaultValue) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
}

/**
 * GET /api/search?q=<query>&projectId=<id>&limit=20
 * Full-text search using the FTS5 index. Returns sessions matching the query
 * within the given project.
 */
router.get('/', (req, res) => {
  try {
    const q = String(req.query.q ?? '').trim();
    if (!q) {
      return res.status(400).json({ error: 'q parameter is required' });
    }

    const projectId = parsePositiveInt(req.query.projectId, null);
    if (!projectId) {
      return res.status(400).json({ error: 'projectId must be a positive integer' });
    }

    // Cap at 100 to prevent runaway queries; default is 20.
    const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);

    const results = search(q, projectId, limit);
    return res.json(results);
  } catch (error) {
    console.error('[search] GET / error:', error);
    return res.status(500).json({ error: 'Search failed' });
  }
});

/**
 * POST /api/search/reindex
 * Trigger a full rebuild of the FTS5 index from session_state.
 * Admin operation — rate-limit or restrict in production if needed.
 */
router.post('/reindex', (req, res) => {
  try {
    const result = reindexAll();
    return res.json(result);
  } catch (error) {
    console.error('[search] POST /reindex error:', error);
    return res.status(500).json({ error: 'Reindex failed' });
  }
});

export default router;
