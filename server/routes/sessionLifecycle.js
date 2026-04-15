import express from 'express';
import {
  archiveSession,
  deleteSession,
  emitSessionStateChange,
  freezeSession,
  getProcessStatus,
  getSessionState,
  resumeSession,
} from '../services/sessionLifecycleService.js';

const router = express.Router();

function parseProvider(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const provider = value.trim().toLowerCase();
  return provider || null;
}

function getProviderFromRequest(req) {
  return parseProvider(req.body?.provider) || parseProvider(req.query.provider);
}

function validateSessionId(sessionId) {
  const normalizedSessionId = String(sessionId || '').trim();
  if (!normalizedSessionId) {
    const error = new Error('sessionId is required');
    error.statusCode = 400;
    error.exposeMessage = true;
    throw error;
  }

  return normalizedSessionId;
}

function handleRouteError(res, error) {
  const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
  const message = error?.exposeMessage ? error.message : 'Failed to update session state';

  if (statusCode >= 500) {
    console.error('[session-lifecycle] Route error:', error);
  }

  return res.status(statusCode).json({ error: message });
}

router.get('/:sessionId/state', async (req, res) => {
  try {
    const sessionId = validateSessionId(req.params.sessionId);
    const provider = getProviderFromRequest(req);
    const state = await getSessionState(sessionId, provider);

    res.status(200).json({
      ...state,
      processStatus: getProcessStatus(state.sessionId, state.provider),
    });
  } catch (error) {
    handleRouteError(res, error);
  }
});

router.post('/:sessionId/freeze', async (req, res) => {
  try {
    const sessionId = validateSessionId(req.params.sessionId);
    const provider = getProviderFromRequest(req);
    const state = await freezeSession(sessionId, provider);
    emitSessionStateChange(state, { reason: 'freeze' });
    res.status(200).json(state);
  } catch (error) {
    handleRouteError(res, error);
  }
});

router.post('/:sessionId/resume', async (req, res) => {
  try {
    const sessionId = validateSessionId(req.params.sessionId);
    const provider = getProviderFromRequest(req);
    const state = await resumeSession(sessionId, provider);
    emitSessionStateChange(state, { reason: 'resume' });
    res.status(200).json(state);
  } catch (error) {
    handleRouteError(res, error);
  }
});

router.post('/:sessionId/archive', async (req, res) => {
  try {
    const sessionId = validateSessionId(req.params.sessionId);
    const provider = getProviderFromRequest(req);
    const state = await archiveSession(sessionId, provider);
    emitSessionStateChange(state, { reason: 'archive' });
    res.status(200).json(state);
  } catch (error) {
    handleRouteError(res, error);
  }
});

router.delete('/:sessionId', async (req, res) => {
  try {
    const sessionId = validateSessionId(req.params.sessionId);
    const provider = getProviderFromRequest(req);
    const result = await deleteSession(sessionId, provider);
    emitSessionStateChange(result.state, { reason: 'delete' });
    res.status(200).json(result);
  } catch (error) {
    handleRouteError(res, error);
  }
});

export default router;
