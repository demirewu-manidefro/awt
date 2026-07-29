/**
 * auth.middleware.js
 * Verifies the JWT access token from the Authorization header.
 * Attaches decoded user payload to req.user on success.
 */

const { verifyAccessToken } = require('../utils/jwt.utils');
const { sendUnauthorized } = require('../utils/response.utils');

/**
 * Protect routes — requires a valid Bearer access token
 */
const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendUnauthorized(res, 'Access token is missing or malformed.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // Attach user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendUnauthorized(res, 'Access token has expired. Please refresh your session.');
    }
    if (err.name === 'JsonWebTokenError') {
      return sendUnauthorized(res, 'Invalid access token.');
    }
    return sendUnauthorized(res, 'Authentication failed.');
  }
};

/**
 * Restrict access to specific roles
 * Usage: requireRole('admin')
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return sendUnauthorized(res, 'Not authenticated.');
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Requires one of: ${roles.join(', ')}.`,
    });
  }
  next();
};

module.exports = { protect, requireRole };
