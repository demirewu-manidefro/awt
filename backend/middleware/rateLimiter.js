/**
 * rateLimiter.js
 * Rate limiting middleware using express-rate-limit
 */

const rateLimit = require('express-rate-limit');

/**
 * Global API rate limiter — applies to all routes
 * 100 requests per 15 minutes per IP
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

/**
 * Strict login rate limiter — only applies to POST /api/auth/login
 * 10 attempts per 15 minutes per IP
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // don't count successful logins
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please wait 15 minutes before trying again.',
  },
});

/**
 * Strict register rate limiter — prevents account-creation spam
 * 5 attempts per hour per IP
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many registration attempts from this IP. Please try again in an hour.',
  },
});

/**
 * Refresh token rate limiter
 * 30 refreshes per 15 minutes per IP
 */
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many token refresh requests. Please try again later.',
  },
});

module.exports = {
  globalLimiter,
  loginLimiter,
  registerLimiter,
  refreshLimiter,
};
