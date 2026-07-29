/**
 * session.controller.js
 * Handles: list sessions, revoke one session, revoke all other sessions
 */

const SessionModel = require('../models/session.model');
const LoginAttemptModel = require('../models/loginAttempt.model');
const { sendSuccess, sendNotFound, sendServerError } = require('../utils/response.utils');

// ─────────────────────────────────────────────────
// GET /api/sessions
// Returns all active sessions for the current user
// ─────────────────────────────────────────────────
const listSessions = async (req, res) => {
  try {
    const sessions = await SessionModel.findByUserId(req.user.id);

    const formatted = sessions.map((s) => ({
      id: s.id,
      ipAddress: s.ip_address,
      device: s.device_info,
      browser: s.browser_info,
      createdAt: s.created_at,
      expiresAt: s.expires_at,
      lastUsedAt: s.last_used_at,
    }));

    return sendSuccess(res, { sessions: formatted });
  } catch (err) {
    console.error('[listSessions]', err);
    return sendServerError(res);
  }
};

// ─────────────────────────────────────────────────
// DELETE /api/sessions/:sessionId
// Revoke a single session (logout from one device)
// ─────────────────────────────────────────────────
const revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const revoked = await SessionModel.revokeById(sessionId, req.user.id);

    if (!revoked) {
      return sendNotFound(res, 'Session not found or already revoked.');
    }

    return sendSuccess(res, { sessionId }, 'Session revoked successfully.');
  } catch (err) {
    console.error('[revokeSession]', err);
    return sendServerError(res);
  }
};

// ─────────────────────────────────────────────────
// DELETE /api/sessions/all
// Revoke all sessions except the current one
// ─────────────────────────────────────────────────
const revokeAllOtherSessions = async (req, res) => {
  try {
    // We need the current session ID — sent from the frontend in the request body
    const { currentSessionId } = req.body;

    const count = await SessionModel.revokeAllExcept(req.user.id, currentSessionId || '');

    return sendSuccess(res, { revokedCount: count }, `Revoked ${count} other session(s).`);
  } catch (err) {
    console.error('[revokeAllOtherSessions]', err);
    return sendServerError(res);
  }
};

// ─────────────────────────────────────────────────
// GET /api/sessions/suspicious
// Returns suspicious login attempts for the current user
// ─────────────────────────────────────────────────
const getSuspiciousActivity = async (req, res) => {
  try {
    const attempts = await LoginAttemptModel.getSuspicious(req.user.id);

    const formatted = attempts.map((a) => ({
      id: a.id,
      ipAddress: a.ip_address,
      reason: a.suspicious_reason,
      attemptedAt: a.attempted_at,
    }));

    return sendSuccess(res, { suspiciousAttempts: formatted });
  } catch (err) {
    console.error('[getSuspiciousActivity]', err);
    return sendServerError(res);
  }
};

module.exports = {
  listSessions,
  revokeSession,
  revokeAllOtherSessions,
  getSuspiciousActivity,
};
