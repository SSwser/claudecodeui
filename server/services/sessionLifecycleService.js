import path from 'path';
import treeKill from 'tree-kill';
import { db } from '../database/db.js';

const DEFAULT_PROVIDER = 'claude';
const VALID_STATUSES = new Set(['active', 'frozen', 'archived', 'deleted']);
const TRANSITIONS = {
  active: new Set(['frozen', 'archived', 'deleted']),
  frozen: new Set(['active', 'archived', 'deleted']),
  archived: new Set(['active', 'deleted']),
  deleted: new Set([]),
};

const processRegistry = new Map();
let lifecycleBroadcaster = null;

function createLifecycleError(message, statusCode = 400, code = 'SESSION_LIFECYCLE_ERROR') {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.exposeMessage = statusCode < 500;
  return error;
}

function normalizeProvider(provider) {
  const normalized = String(provider || DEFAULT_PROVIDER).trim().toLowerCase();
  if (!normalized) {
    throw createLifecycleError('provider is required', 400, 'VALIDATION_ERROR');
  }

  return normalized;
}

function normalizeSessionId(sessionId) {
  const normalized = String(sessionId || '').trim();
  if (!normalized) {
    throw createLifecycleError('sessionId is required', 400, 'VALIDATION_ERROR');
  }

  return normalized;
}

function normalizeFsPath(filePath) {
  if (!filePath) {
    return null;
  }

  const resolvedPath = path.resolve(String(filePath));
  return process.platform === 'win32' ? resolvedPath.toLowerCase() : resolvedPath;
}

function getRegistryKey(sessionId, provider = DEFAULT_PROVIDER) {
  return `${normalizeProvider(provider)}:${normalizeSessionId(sessionId)}`;
}

function mapSessionRow(row) {
  if (!row) {
    return null;
  }

  const processStatus = getProcessStatus(row.session_id, row.provider);
  return {
    id: row.id,
    sessionId: row.session_id,
    workspaceId: row.workspace_id,
    workspaceName: row.workspace_name,
    projectId: row.project_id,
    projectName: row.project_name,
    directoryPath: row.directory_path,
    worktreePath: row.worktree_path,
    provider: row.provider,
    status: row.status,
    title: row.title,
    summary: row.summary,
    lastActivity: row.last_activity,
    frozenAt: row.frozen_at,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    processStatus,
  };
}

function getWorkspaceCandidates() {
  return db
    .prepare(
      `SELECT
         w.id,
         w.project_id,
         w.name,
         w.worktree_path,
         w.is_default,
         p.directory_path
       FROM workspaces w
       INNER JOIN projects p ON p.id = w.project_id
       WHERE p.is_deleted = 0`
    )
    .all();
}

function resolveWorkspaceForProjectPath(projectPath) {
  const normalizedPath = normalizeFsPath(projectPath);
  if (!normalizedPath) {
    return null;
  }

  const candidates = getWorkspaceCandidates();
  let bestMatch = null;
  let bestLength = -1;

  for (const candidate of candidates) {
    const candidateRoot = normalizeFsPath(candidate.worktree_path || candidate.directory_path);
    if (!candidateRoot) {
      continue;
    }

    const isSamePath = normalizedPath === candidateRoot;
    const isNestedPath = normalizedPath.startsWith(`${candidateRoot}${path.sep}`);

    if (!isSamePath && !isNestedPath) {
      continue;
    }

    if (candidateRoot.length > bestLength) {
      bestMatch = candidate;
      bestLength = candidateRoot.length;
    }
  }

  return bestMatch;
}

function getSessionRows(sessionId, provider = null) {
  const normalizedSessionId = normalizeSessionId(sessionId);

  if (provider) {
    const normalizedProvider = normalizeProvider(provider);
    return db
      .prepare(
        `SELECT
           s.*,
           w.project_id,
           w.name AS workspace_name,
           w.worktree_path,
           p.name AS project_name,
           p.directory_path
         FROM session_state s
         INNER JOIN workspaces w ON w.id = s.workspace_id
         INNER JOIN projects p ON p.id = w.project_id
         WHERE s.session_id = ? AND s.provider = ?`
      )
      .all(normalizedSessionId, normalizedProvider);
  }

  return db
    .prepare(
      `SELECT
         s.*,
         w.project_id,
         w.name AS workspace_name,
         w.worktree_path,
         p.name AS project_name,
         p.directory_path
       FROM session_state s
       INNER JOIN workspaces w ON w.id = s.workspace_id
       INNER JOIN projects p ON p.id = w.project_id
       WHERE s.session_id = ?`
    )
    .all(normalizedSessionId);
}

function resolveSessionRow(sessionId, provider = null) {
  const rows = getSessionRows(sessionId, provider);
  if (rows.length === 0) {
    throw createLifecycleError('Session not found', 404, 'SESSION_NOT_FOUND');
  }

  if (!provider && rows.length > 1) {
    throw createLifecycleError(
      'Multiple providers found for this sessionId. Provide a provider value.',
      400,
      'AMBIGUOUS_SESSION_PROVIDER'
    );
  }

  return rows[0];
}

function assertValidTransition(currentStatus, targetStatus) {
  if (!VALID_STATUSES.has(currentStatus)) {
    throw createLifecycleError(`Unknown session status: ${currentStatus}`, 409, 'INVALID_STATUS');
  }

  if (!VALID_STATUSES.has(targetStatus)) {
    throw createLifecycleError(`Unknown target status: ${targetStatus}`, 409, 'INVALID_STATUS');
  }

  const allowedTargets = TRANSITIONS[currentStatus] || new Set();
  if (!allowedTargets.has(targetStatus)) {
    throw createLifecycleError(
      `Cannot transition session from ${currentStatus} to ${targetStatus}`,
      409,
      'INVALID_STATE_TRANSITION'
    );
  }
}

function upsertSessionState({ sessionId, provider, projectPath, workspaceId = null, title = null, summary = null, status = 'active' }) {
  const normalizedSessionId = normalizeSessionId(sessionId);
  const normalizedProvider = normalizeProvider(provider);

  let resolvedWorkspaceId = workspaceId;
  if (!resolvedWorkspaceId) {
    const workspace = resolveWorkspaceForProjectPath(projectPath);
    if (!workspace?.id) {
      throw createLifecycleError(
        'Unable to resolve project workspace for this session',
        400,
        'WORKSPACE_NOT_FOUND'
      );
    }
    resolvedWorkspaceId = workspace.id;
  }

  db.prepare(
    `INSERT INTO session_state (
       session_id,
       workspace_id,
       provider,
       status,
       title,
       summary,
       last_activity,
       frozen_at,
       archived_at
     ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, NULL, NULL)
     ON CONFLICT(session_id, provider) DO UPDATE SET
       workspace_id = excluded.workspace_id,
       status = excluded.status,
       title = COALESCE(excluded.title, session_state.title),
       summary = COALESCE(excluded.summary, session_state.summary),
       last_activity = CURRENT_TIMESTAMP,
       frozen_at = CASE WHEN excluded.status = 'active' THEN NULL ELSE session_state.frozen_at END,
       archived_at = CASE WHEN excluded.status = 'active' THEN NULL ELSE session_state.archived_at END`
  ).run(
    normalizedSessionId,
    resolvedWorkspaceId,
    normalizedProvider,
    status,
    title,
    summary,
  );

  return getSessionState(normalizedSessionId, normalizedProvider);
}

function updateSessionStatus(row, targetStatus) {
  assertValidTransition(row.status, targetStatus);

  const statusStatements = {
    active: `UPDATE session_state
      SET status = 'active',
          frozen_at = NULL,
          archived_at = NULL,
          last_activity = CURRENT_TIMESTAMP
      WHERE id = ?`,
    frozen: `UPDATE session_state
      SET status = 'frozen',
          frozen_at = CURRENT_TIMESTAMP,
          last_activity = CURRENT_TIMESTAMP
      WHERE id = ?`,
    archived: `UPDATE session_state
      SET status = 'archived',
          archived_at = CURRENT_TIMESTAMP,
          last_activity = CURRENT_TIMESTAMP
      WHERE id = ?`,
    deleted: `UPDATE session_state
      SET status = 'deleted',
          last_activity = CURRENT_TIMESTAMP
      WHERE id = ?`,
  };

  db.prepare(statusStatements[targetStatus]).run(row.id);
  return getSessionState(row.session_id, row.provider);
}

async function killProcessTree(pid, signal = 'SIGTERM') {
  return new Promise((resolve, reject) => {
    treeKill(pid, signal, (error) => {
      if (!error || error.code === 'ESRCH') {
        resolve();
        return;
      }

      reject(error);
    });
  });
}

async function terminateProcessTree(pid) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return;
  }

  try {
    await Promise.race([
      killProcessTree(pid, 'SIGTERM'),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('SIGTERM timeout')), 5000);
      }),
    ]);
  } catch (error) {
    try {
      await killProcessTree(pid, 'SIGKILL');
    } catch (forceError) {
      console.warn(`[sessionLifecycle] Failed to terminate process ${pid}:`, forceError.message);
    }

    if (error?.message !== 'SIGTERM timeout') {
      console.warn(`[sessionLifecycle] Graceful stop failed for process ${pid}:`, error.message);
    }
  }
}

function broadcastSessionState(state, extra = {}) {
  if (!state || typeof lifecycleBroadcaster !== 'function') {
    return;
  }

  lifecycleBroadcaster({
    type: 'session_state_changed',
    sessionId: state.sessionId,
    provider: state.provider,
    status: state.status,
    projectId: state.projectId,
    workspaceId: state.workspaceId,
    timestamp: new Date().toISOString(),
    processStatus: state.processStatus,
    ...extra,
  });
}

function emitSessionStateChange(state, extra = {}) {
  broadcastSessionState(state, extra);
}

function handleRuntimeClose(key, metadata = {}) {
  const entry = processRegistry.get(key);
  if (!entry) {
    return;
  }

  processRegistry.delete(key);

  const isUnexpected =
    entry.runtimeType === 'child-process' && (metadata.code !== 0 || metadata.signal);

  if (!isUnexpected) {
    return;
  }

  try {
    const row = resolveSessionRow(entry.sessionId, entry.provider);
    if (row.status !== 'active') {
      return;
    }

    const nextState = updateSessionStatus(row, 'frozen');
    broadcastSessionState(nextState, {
      reason: 'runtime_exit',
      exitCode: metadata.code ?? null,
      signal: metadata.signal ?? null,
    });
  } catch (error) {
    console.warn(`[sessionLifecycle] Failed to handle runtime exit for ${key}:`, error.message);
  }
}

function resolveRegistryEntry(sessionId, provider = null) {
  if (provider) {
    return processRegistry.get(getRegistryKey(sessionId, provider)) || null;
  }

  const normalizedSessionId = normalizeSessionId(sessionId);
  const matches = [];
  for (const entry of processRegistry.values()) {
    if (entry.sessionId === normalizedSessionId) {
      matches.push(entry);
    }
  }

  if (matches.length > 1) {
    throw createLifecycleError(
      'Multiple runtime entries found for this sessionId. Provide a provider value.',
      400,
      'AMBIGUOUS_RUNTIME_PROVIDER'
    );
  }

  return matches[0] || null;
}

async function stopRegistryEntry(entry) {
  if (!entry) {
    return;
  }

  processRegistry.delete(entry.key);

  if (typeof entry.stop === 'function') {
    try {
      await Promise.resolve(entry.stop());
    } catch (error) {
      console.warn(`[sessionLifecycle] Custom stop failed for ${entry.key}:`, error.message);
    }
    return;
  }

  await terminateProcessTree(entry.pid);
}

function registerProcess(optionsOrSessionId, pid, provider = DEFAULT_PROVIDER) {
  const normalizedOptions =
    typeof optionsOrSessionId === 'object' && optionsOrSessionId !== null
      ? optionsOrSessionId
      : {
          sessionId: optionsOrSessionId,
          pid,
          provider,
        };

  const sessionId = normalizeSessionId(normalizedOptions.sessionId);
  const normalizedProvider = normalizeProvider(normalizedOptions.provider);
  const key = getRegistryKey(sessionId, normalizedProvider);
  const runtimeType = normalizedOptions.runtimeType || (normalizedOptions.process ? 'child-process' : 'virtual');

  const state = upsertSessionState({
    sessionId,
    provider: normalizedProvider,
    projectPath: normalizedOptions.projectPath,
    workspaceId: normalizedOptions.workspaceId,
    title: normalizedOptions.title || null,
    summary: normalizedOptions.summary || null,
    status: 'active',
  });

  const entry = {
    key,
    sessionId,
    provider: normalizedProvider,
    pid: Number.isInteger(normalizedOptions.pid) ? normalizedOptions.pid : null,
    process: normalizedOptions.process || null,
    projectPath: normalizedOptions.projectPath || state.worktreePath || state.directoryPath || null,
    workspaceId: state.workspaceId,
    startedAt: new Date().toISOString(),
    stop: normalizedOptions.stop || null,
    runtimeType,
  };

  processRegistry.set(key, entry);

  if (entry.process?.once && runtimeType === 'child-process') {
    entry.process.once('close', (code, signal) => {
      handleRuntimeClose(key, { code, signal });
    });

    entry.process.once('error', (error) => {
      handleRuntimeClose(key, { code: null, signal: null, error });
    });
  }

  return getSessionState(sessionId, normalizedProvider);
}

function clearProcessRegistration(sessionId, provider = DEFAULT_PROVIDER) {
  const entry = resolveRegistryEntry(sessionId, provider);
  if (!entry) {
    return false;
  }

  processRegistry.delete(entry.key);
  return true;
}

async function markProcessRuntimeFailure(sessionId, provider = DEFAULT_PROVIDER, error = null) {
  const normalizedSessionId = normalizeSessionId(sessionId);
  const normalizedProvider = normalizeProvider(provider);
  clearProcessRegistration(normalizedSessionId, normalizedProvider);

  try {
    const row = resolveSessionRow(normalizedSessionId, normalizedProvider);
    if (row.status !== 'active') {
      return getSessionState(normalizedSessionId, normalizedProvider);
    }

    const nextState = updateSessionStatus(row, 'frozen');
    broadcastSessionState(nextState, {
      reason: 'runtime_error',
      error: error?.message || null,
    });
    return nextState;
  } catch (runtimeError) {
    console.warn(
      `[sessionLifecycle] Failed to record runtime failure for ${normalizedProvider}:${normalizedSessionId}:`,
      runtimeError.message
    );
    return null;
  }
}

function getSessionState(sessionId, provider = null) {
  return mapSessionRow(resolveSessionRow(sessionId, provider));
}

function getProcessStatus(sessionId, provider = null) {
  const entry = resolveRegistryEntry(sessionId, provider);
  if (!entry) {
    return {
      running: false,
      pid: null,
      provider: provider ? normalizeProvider(provider) : null,
      startedAt: null,
    };
  }

  return {
    running: true,
    pid: entry.pid,
    provider: entry.provider,
    startedAt: entry.startedAt,
  };
}

function listSessionsByProject(projectId, includeDeleted = false) {
  const filters = ['w.project_id = ?'];
  if (!includeDeleted) {
    filters.push("s.status != 'deleted'");
  }

  const rows = db
    .prepare(
      `SELECT
         s.*,
         w.project_id,
         w.name AS workspace_name,
         w.worktree_path,
         p.name AS project_name,
         p.directory_path
       FROM session_state s
       INNER JOIN workspaces w ON w.id = s.workspace_id
       INNER JOIN projects p ON p.id = w.project_id
       WHERE ${filters.join(' AND ')}
       ORDER BY s.last_activity DESC, s.created_at DESC`
    )
    .all(Number(projectId));

  return rows.map(mapSessionRow);
}

async function freezeSession(sessionId, provider = null) {
  const row = resolveSessionRow(sessionId, provider);
  const entry = resolveRegistryEntry(row.session_id, row.provider);

  if (row.status !== 'active') {
    throw createLifecycleError(
      `Cannot transition session from ${row.status} to frozen`,
      409,
      'INVALID_STATE_TRANSITION'
    );
  }

  await stopRegistryEntry(entry);
  const nextState = updateSessionStatus(row, 'frozen');
  return nextState;
}

async function resumeSession(sessionId, provider = null) {
  const row = resolveSessionRow(sessionId, provider);
  const nextState = updateSessionStatus(row, 'active');
  return nextState;
}

async function archiveSession(sessionId, provider = null) {
  const row = resolveSessionRow(sessionId, provider);
  const entry = resolveRegistryEntry(row.session_id, row.provider);

  if (row.status === 'deleted') {
    throw createLifecycleError(
      'Cannot transition session from deleted to archived',
      409,
      'INVALID_STATE_TRANSITION'
    );
  }

  if (row.status !== 'active' && row.status !== 'frozen') {
    throw createLifecycleError(
      `Cannot transition session from ${row.status} to archived`,
      409,
      'INVALID_STATE_TRANSITION'
    );
  }

  await stopRegistryEntry(entry);
  const nextState = updateSessionStatus(row, 'archived');
  return nextState;
}

async function deleteSession(sessionId, provider = null) {
  const row = resolveSessionRow(sessionId, provider);
  const entry = resolveRegistryEntry(row.session_id, row.provider);

  if (row.status === 'deleted') {
    throw createLifecycleError('Session already deleted', 409, 'INVALID_STATE_TRANSITION');
  }

  await stopRegistryEntry(entry);
  const nextState = updateSessionStatus(row, 'deleted');
  return { success: true, state: nextState };
}

function setSessionLifecycleBroadcaster(broadcaster) {
  lifecycleBroadcaster = typeof broadcaster === 'function' ? broadcaster : null;
}

export {
  processRegistry,
  setSessionLifecycleBroadcaster,
  emitSessionStateChange,
  registerProcess,
  clearProcessRegistration,
  markProcessRuntimeFailure,
  freezeSession,
  resumeSession,
  archiveSession,
  deleteSession,
  getSessionState,
  getProcessStatus,
  listSessionsByProject,
};
