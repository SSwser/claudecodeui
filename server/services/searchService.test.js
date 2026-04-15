import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => ({
  prepare: vi.fn(),
  exec: vi.fn(),
}));

vi.mock('../database/db.js', () => ({
  db: {
    prepare: dbMocks.prepare,
    exec: dbMocks.exec,
  },
}));

import { reindexAll, search } from './searchService.js';

describe('searchService', () => {
  beforeEach(() => {
    dbMocks.prepare.mockReset();
    dbMocks.exec.mockReset();
  });

  it('keeps Unicode search terms and joins provider-aware session rows', () => {
    const all = vi.fn().mockReturnValue([]);
    dbMocks.prepare.mockReturnValue({ all });

    search('你好 мир', 7, 10);

    expect(dbMocks.prepare).toHaveBeenCalledTimes(1);
    expect(dbMocks.prepare.mock.calls[0][0]).toContain('s.provider = ss.provider');
    expect(all).toHaveBeenCalledWith('你好* мир*', 7, 10);
  });

  it('reindexes provider-qualified rows so duplicate session ids stay isolated', () => {
    const insertRun = vi.fn();
    const sessions = [
      { session_id: 'shared-id', provider: 'claude', title: 'Claude title', summary: 'Alpha' },
      { session_id: 'shared-id', provider: 'codex', title: 'Codex title', summary: 'Beta' },
    ];

    dbMocks.prepare.mockImplementation((sql) => {
      if (sql.startsWith('SELECT session_id, provider')) {
        return { all: () => sessions };
      }

      if (sql.startsWith('INSERT INTO session_search(provider')) {
        return { run: insertRun };
      }

      throw new Error(`Unexpected SQL in test: ${sql}`);
    });

    const result = reindexAll();

    expect(dbMocks.exec).toHaveBeenCalledWith('DELETE FROM session_search');
    expect(insertRun).toHaveBeenNthCalledWith(1, 'claude', 'shared-id', 'Claude title', 'Alpha');
    expect(insertRun).toHaveBeenNthCalledWith(2, 'codex', 'shared-id', 'Codex title', 'Beta');
    expect(result).toEqual({ indexed: 2 });
  });
});
