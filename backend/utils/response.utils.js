/**
 * response.utils.js
 * Standardised API response helpers for consistent JSON output
 */

/**
 * 200 OK
 */
const sendSuccess = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * 201 Created
 */
const sendCreated = (res, data = {}, message = 'Resource created') => {
  return sendSuccess(res, data, message, 201);
};

/**
 * 400 Bad Request
 */
const sendBadRequest = (res, message = 'Bad request', errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(400).json(body);
};

/**
 * 401 Unauthorized
 */
const sendUnauthorized = (res, message = 'Unauthorized') => {
  return res.status(401).json({ success: false, message });
};

/**
 * 403 Forbidden
 */
const sendForbidden = (res, message = 'Forbidden') => {
  return res.status(403).json({ success: false, message });
};

/**
 * 404 Not Found
 */
const sendNotFound = (res, message = 'Resource not found') => {
  return res.status(404).json({ success: false, message });
};

/**
 * 409 Conflict
 */
const sendConflict = (res, message = 'Conflict') => {
  return res.status(409).json({ success: false, message });
};

/**
 * 429 Too Many Requests
 */
const sendTooManyRequests = (res, message = 'Too many requests. Please try again later.') => {
  return res.status(429).json({ success: false, message });
};

/**
 * 500 Internal Server Error
 */
const sendServerError = (res, message = 'Internal server error') => {
  return res.status(500).json({ success: false, message });
};

module.exports = {
  sendSuccess,
  sendCreated,
  sendBadRequest,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendConflict,
  sendTooManyRequests,
  sendServerError,
};
