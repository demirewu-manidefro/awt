/**
 * session.routes.js
 * Routes: /api/sessions/*
 */

const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const {
  listSessions,
  revokeSession,
  revokeAllOtherSessions,
  getSuspiciousActivity,
} = require('../controllers/session.controller');

// All session routes require a valid access token
router.use(protect);

// GET  /api/sessions            — list all active sessions
router.get('/', listSessions);

// GET  /api/sessions/suspicious — list suspicious login attempts
router.get('/suspicious', getSuspiciousActivity);

// DELETE /api/sessions/all      — revoke all sessions except current
router.delete('/all', revokeAllOtherSessions);

// DELETE /api/sessions/:sessionId — revoke one specific session
router.delete('/:sessionId', revokeSession);

module.exports = router;
