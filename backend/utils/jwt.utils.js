/**
 * jwt.utils.js
 * Sign and verify both access tokens and refresh tokens
 */

const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES_IN || '1m';
const REFRESH_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES_IN || '5m';

/**
 * Sign an access token (short-lived, 15 min)
 * @param {object} payload - { userId, email, role }
 */
const signAccessToken = (payload) => {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
};

/**
 * Sign a refresh token (long-lived, 7 days)
 * @param {object} payload - { userId, sessionId }
 */
const signRefreshToken = (payload) => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
};

/**
 * Verify an access token
 * Returns decoded payload or throws
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, ACCESS_SECRET);
};

/**
 * Verify a refresh token
 * Returns decoded payload or throws
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_SECRET);
};

/**
 * Get cookie options for refresh token
 * HttpOnly + Secure in production
 */
const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 5 * 60 * 1000, // 5 minutes in ms
  path: '/',
});

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getRefreshCookieOptions,
};
