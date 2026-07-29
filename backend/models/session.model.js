/**
 * session.model.js
 * All database queries for the `sessions` table (refresh token sessions)
 */

const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const SessionModel = {
  /**
   * Create a new session record with a hashed refresh token
   * @param {object} params
   * @returns {object} created session row
   */
  async create({ userId, refreshToken, ip, userAgent, deviceInfo, browserInfo }) {
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 1 * 60 * 1000); // 5 minutes

    const result = await pool.query(
      `INSERT INTO sessions
         (user_id, refresh_token_hash, ip_address, user_agent, device_info, browser_info, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id, ip_address, device_info, browser_info, created_at, expires_at`,
      [userId, tokenHash, ip, userAgent, deviceInfo, browserInfo, expiresAt]
    );
    return result.rows[0];
  },

  /**
   * Find all non-expired, non-revoked sessions for a user
   */
  async findByUserId(userId) {
    const result = await pool.query(
      `SELECT id, user_id, ip_address, device_info, browser_info,
              created_at, expires_at, last_used_at
       FROM sessions
       WHERE user_id = $1
         AND is_revoked = FALSE
         AND expires_at > NOW()
       ORDER BY last_used_at DESC`,
      [userId]
    );
    return result.rows;
  },

  /**
   * Find all sessions for a user and compare the provided token against hashes
   * Returns the matching session row or null
   */
  async findByToken(userId, refreshToken) {
    const sessions = await pool.query(
      `SELECT * FROM sessions
       WHERE user_id = $1
         AND is_revoked = FALSE
         AND expires_at > NOW()`,
      [userId]
    );

    for (const session of sessions.rows) {
      const match = await bcrypt.compare(refreshToken, session.refresh_token_hash);
      if (match) return session;
    }
    return null;
  },

  /**
   * Rotate a refresh token: revoke old session, create new one
   * Returns the new session row
   */
  async rotate(oldSessionId, { userId, refreshToken, ip, userAgent, deviceInfo, browserInfo }) {
    await pool.query(
      'UPDATE sessions SET is_revoked = TRUE WHERE id = $1',
      [oldSessionId]
    );
    return this.create({ userId, refreshToken, ip, userAgent, deviceInfo, browserInfo });
  },

  /**
   * Revoke a specific session (logout from one device)
   */
  async revokeById(sessionId, userId) {
    const result = await pool.query(
      `UPDATE sessions SET is_revoked = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [sessionId, userId]
    );
    return result.rows[0] || null;
  },

  /**
   * Revoke all sessions for a user except the current one (logout all other devices)
   */
  async revokeAllExcept(userId, currentSessionId) {
    const result = await pool.query(
      `UPDATE sessions SET is_revoked = TRUE
       WHERE user_id = $1 AND id != $2 AND is_revoked = FALSE
       RETURNING id`,
      [userId, currentSessionId]
    );
    return result.rowCount;
  },

  /**
   * Revoke all sessions for a user (full logout)
   */
  async revokeAll(userId) {
    await pool.query(
      'UPDATE sessions SET is_revoked = TRUE WHERE user_id = $1',
      [userId]
    );
  },

  /**
   * Update last_used_at timestamp on a session
   */
  async touch(sessionId) {
    await pool.query(
      'UPDATE sessions SET last_used_at = NOW() WHERE id = $1',
      [sessionId]
    );
  },
};

module.exports = SessionModel;
