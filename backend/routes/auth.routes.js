/**
 * auth.routes.js
 * Routes: /api/auth/*
 */

const router = require('express').Router();
const passport = require('passport');

const {
  register,
  login,
  logout,
  refresh,
  getMe,
  googleCallback,
} = require('../controllers/auth.controller');

const { protect } = require('../middleware/auth.middleware');
const { loginLimiter, registerLimiter, refreshLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');

// ── Validation schemas ──────────────────────────────────────────
const registerSchema = {
  email: { required: true, type: 'email', maxLength: 255 },
  password: { required: true, minLength: 8, maxLength: 128 },
};

const loginSchema = {
  email: { required: true, type: 'email' },
  password: { required: true },
};

// ── Routes ──────────────────────────────────────────────────────

// Register new user
router.post('/register', registerLimiter, validate(registerSchema), register);

// Login
router.post('/login', loginLimiter, validate(loginSchema), login);

// Logout (requires auth)
router.post('/logout', protect, logout);

// Refresh access token (reads HttpOnly cookie, no auth header needed)
router.post('/refresh', refreshLimiter, refresh);

// Get current user profile
router.get('/me', protect, getMe);

// Google OAuth — redirect to Google
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth — handle callback from Google
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth_failed' }),
  googleCallback
);

module.exports = router;
