/**
 * loginAttempt.model.js
 * All database queries for the `login_attempts` table
 */

const pool = require('../config/db');

const LoginAttemptModel = {
  /**
   * Log a login attempt (success or failure)
   * @param {object} params
   */
  async log({
    userId = null,
    email,
    ip,
    userAgent,
    success,
    failureReason = null,
    isSuspicious = false,
    suspiciousReason = null,
  }) {
    await pool.query(
      `INSERT INTO login_attempts
         (user_id, email, ip_address, user_agent, success, failure_reason,
          is_suspicious, suspicious_reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId,
        email ? email.toLowerCase() : null,
        ip,
        userAgent,
        success,
        failureReason,
        isSuspicious,
        suspiciousReason,
      ]
    );
  },

  /**
   * Get recent SUCCESSFUL login attempts for a user (last 30 days)
   * Used by the suspicious activity detector to compare known IPs and devices
   */
  async getRecentSuccessful(userId, limit = 20) {
    const result = await pool.query(
      `SELECT ip_address, user_agent, attempted_at
       FROM login_attempts
       WHERE user_id = $1
         AND success = TRUE
         AND attempted_at > NOW() - INTERVAL '30 days'
       ORDER BY attempted_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  },

  /**
   * Get suspicious login attempts for a user (for dashboard display)
   */
  async getSuspicious(userId, limit = 10) {
    const result = await pool.query(
      `SELECT id, ip_address, user_agent, suspicious_reason, attempted_at
       FROM login_attempts
       WHERE user_id = $1
         AND is_suspicious = TRUE
       ORDER BY attempted_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  },

  /**
   * Count failed attempts from a given IP in the last 15 minutes
   * Used for IP-based lockout detection alongside the DB-level user lockout
   */
  async countRecentFailuresByIp(ip, windowMinutes = 15) {
    const result = await pool.query(
      `SELECT COUNT(*) AS count FROM login_attempts
       WHERE ip_address = $1
         AND success = FALSE
         AND attempted_at > NOW() - INTERVAL '${windowMinutes} minutes'`,
      [ip]
    );
    return parseInt(result.rows[0].count, 10);
  },
};

module.exports = LoginAttemptModel;
