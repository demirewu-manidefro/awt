/**
 * auth.controller.js
 * Handles: register, login, logout, refresh token, get-me, google callback
 */

const crypto = require('crypto');
const UserModel = require('../models/user.model');
const SessionModel = require('../models/session.model');
const LoginAttemptModel = require('../models/loginAttempt.model');
const { hashPassword, comparePassword, validatePasswordStrength } = require('../utils/password.utils');
const { signAccessToken, signRefreshToken, verifyRefreshToken, getRefreshCookieOptions } = require('../utils/jwt.utils');
const { parseUserAgent, detectSuspiciousActivity } = require('../utils/suspicious.utils');
const { sendSuccess, sendCreated, sendBadRequest, sendUnauthorized, sendConflict, sendServerError } = require('../utils/response.utils');

// ─────────────────────────────────────────────────
// Helper: get client IP (handles proxy headers)
// ─────────────────────────────────────────────────
const getClientIp = (req) =>
  (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
  req.socket?.remoteAddress ||
  'unknown';

// ─────────────────────────────────────────────────
// Helper: issue tokens + set cookie + return response
// ─────────────────────────────────────────────────
const issueTokensAndRespond = async (res, user, req) => {
  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'] || '';
  const { device, browser } = parseUserAgent(userAgent);

  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = signRefreshToken({ userId: user.id });

  const session = await SessionModel.create({
    userId: user.id,
    refreshToken,
    ip,
    userAgent,
    deviceInfo: device,
    browserInfo: browser,
  });

  res.cookie('refreshToken', refreshToken, getRefreshCookieOptions());

  return sendSuccess(res, {
    accessToken,
    user: UserModel.toPublicProfile(user),
    sessionId: session.id,
  });
};

// ─────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    // Check if email already exists
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      return sendConflict(res, 'An account with this email already exists.');
    }

    // Password strength check
    const strength = validatePasswordStrength(password, [email]);
    if (!strength.valid) {
      return sendBadRequest(res, `Weak password: ${strength.feedback}`);
    }

    const passwordHash = await hashPassword(password);
    const user = await UserModel.createEmailUser({ email, passwordHash, displayName });

    return sendCreated(res, {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
        createdAt: user.created_at,
      },
    }, 'Account created successfully. You may now log in.');
  } catch (err) {
    console.error('[register]', err);
    return sendServerError(res);
  }
};

// ─────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────
const login = async (req, res) => {
  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'] || '';
  const { email, password } = req.body;

  try {
    const user = await UserModel.findByEmail(email);

    // User not found — still log the attempt
    if (!user) {
      await LoginAttemptModel.log({
        email,
        ip,
        userAgent,
        success: false,
        failureReason: 'user_not_found',
      });
      // Generic message — don't reveal whether email exists
      return sendUnauthorized(res, 'Invalid email or password.');
    }

    // Check account lockout
    const lockStatus = UserModel.isAccountLocked(user);
    if (lockStatus.locked) {
      await LoginAttemptModel.log({
        userId: user.id,
        email,
        ip,
        userAgent,
        success: false,
        failureReason: 'account_locked',
      });
      const minutesLeft = Math.ceil((lockStatus.until - Date.now()) / 60000);
      return sendUnauthorized(res, `Account locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`);
    }

    // No password set (Google-only user)
    if (!user.password_hash) {
      return sendBadRequest(res, 'This account uses Google Sign-In. Please continue with Google.');
    }

    // Verify password
    const passwordMatch = await comparePassword(password, user.password_hash);
    if (!passwordMatch) {
      await UserModel.incrementFailedAttempts(user.id);
      await LoginAttemptModel.log({
        userId: user.id,
        email,
        ip,
        userAgent,
        success: false,
        failureReason: 'invalid_password',
      });
      return sendUnauthorized(res, 'Invalid email or password.');
    }

    // ── Suspicious activity detection ──
    const recentSuccessful = await LoginAttemptModel.getRecentSuccessful(user.id);
    const { isSuspicious, reason } = detectSuspiciousActivity({ ip, userAgent }, recentSuccessful);

    // Log successful attempt
    await LoginAttemptModel.log({
      userId: user.id,
      email,
      ip,
      userAgent,
      success: true,
      isSuspicious,
      suspiciousReason: reason,
    });

    // Reset failed attempts & update last login
    await UserModel.recordSuccessfulLogin(user.id, ip);

    // Issue tokens
    return await issueTokensAndRespond(res, user, req);
  } catch (err) {
    console.error('[login]', err);
    return sendServerError(res);
  }
};

// ─────────────────────────────────────────────────
// POST /api/auth/refresh
// ─────────────────────────────────────────────────
const refresh = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return sendUnauthorized(res, 'No refresh token provided.');
    }

    // Verify JWT signature + expiry
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      res.clearCookie('refreshToken');
      return sendUnauthorized(res, 'Invalid or expired refresh token. Please log in again.');
    }

    const { userId } = decoded;

    // Find the matching session in DB (bcrypt compare loop)
    const session = await SessionModel.findByToken(userId, token);
    if (!session) {
      res.clearCookie('refreshToken');
      return sendUnauthorized(res, 'Session not found or revoked. Please log in again.');
    }

    // Ensure user still exists and is active
    const user = await UserModel.findById(userId);
    if (!user) {
      res.clearCookie('refreshToken');
      return sendUnauthorized(res, 'User account not found.');
    }

    // ── Rotate refresh token ──
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';
    const { device, browser } = parseUserAgent(userAgent);

    const newRefreshToken = signRefreshToken({ userId });
    const newAccessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role });

    await SessionModel.rotate(session.id, {
      userId,
      refreshToken: newRefreshToken,
      ip,
      userAgent,
      deviceInfo: device,
      browserInfo: browser,
    });

    res.cookie('refreshToken', newRefreshToken, getRefreshCookieOptions());

    return sendSuccess(res, {
      accessToken: newAccessToken,
      user: UserModel.toPublicProfile(user),
    }, 'Token refreshed successfully.');
  } catch (err) {
    console.error('[refresh]', err);
    return sendServerError(res);
  }
};

// ─────────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      try {
        const decoded = verifyRefreshToken(token);
        const session = await SessionModel.findByToken(decoded.userId, token);
        if (session) {
          await SessionModel.revokeById(session.id, decoded.userId);
        }
      } catch {
        // Token invalid — still clear cookie
      }
    }

    res.clearCookie('refreshToken', { path: '/' });
    return sendSuccess(res, {}, 'Logged out successfully.');
  } catch (err) {
    console.error('[logout]', err);
    return sendServerError(res);
  }
};

// ─────────────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) return sendUnauthorized(res, 'User not found.');
    return sendSuccess(res, { user: UserModel.toPublicProfile(user) });
  } catch (err) {
    console.error('[getMe]', err);
    return sendServerError(res);
  }
};

// ─────────────────────────────────────────────────
// GET /api/auth/google/callback — called by Passport
// ─────────────────────────────────────────────────
const googleCallback = async (req, res) => {
  try {
    // req.user is set by passport after successful OAuth
    const user = req.user;
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }

    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';
    const { device, browser } = parseUserAgent(userAgent);

    const accessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id });

    await SessionModel.create({
      userId: user.id,
      refreshToken,
      ip,
      userAgent,
      deviceInfo: device,
      browserInfo: browser,
    });

    await UserModel.recordSuccessfulLogin(user.id, ip);

    res.cookie('refreshToken', refreshToken, getRefreshCookieOptions());

    // Redirect frontend with access token in query param (frontend stores in memory)
    return res.redirect(
      `${process.env.FRONTEND_URL}/oauth/callback?token=${encodeURIComponent(accessToken)}`
    );
  } catch (err) {
    console.error('[googleCallback]', err);
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_error`);
  }
};

module.exports = {
  register,
  login,
  logout,
  refresh,
  getMe,
  googleCallback,
};
