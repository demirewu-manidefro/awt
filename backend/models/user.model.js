/**
 * user.model.js
 * All database queries for the `users` table
 */

const pool = require('../config/db');

const LOCKOUT_DURATION_MINUTES = 15;
const MAX_FAILED_ATTEMPTS = 5;

const UserModel = {
  /**
   * Find a user by their email address
   */
  async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
      [email.toLowerCase()]
    );
    return result.rows[0] || null;
  },

  /**
   * Find a user by ID
   */
  async findById(id) {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND is_active = TRUE',
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Find a user by Google ID
   */
  async findByGoogleId(googleId) {
    const result = await pool.query(
      'SELECT * FROM users WHERE google_id = $1 AND is_active = TRUE',
      [googleId]
    );
    return result.rows[0] || null;
  },

  /**
   * Create a new user with email + hashed password
   */
  async createEmailUser({ email, passwordHash, displayName }) {
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, display_name, is_verified)
       VALUES ($1, $2, $3, FALSE)
       RETURNING id, email, display_name, role, is_verified, created_at`,
      [email.toLowerCase(), passwordHash, displayName || email.split('@')[0]]
    );
    return result.rows[0];
  },

  /**
   * Create a new user via Google OAuth (no password)
   */
  async createGoogleUser({ email, googleId, displayName, avatarUrl }) {
    const result = await pool.query(
      `INSERT INTO users (email, google_id, display_name, avatar_url, is_verified)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id, email, display_name, avatar_url, role, is_verified, created_at`,
      [email.toLowerCase(), googleId, displayName, avatarUrl]
    );
    return result.rows[0];
  },

  /**
   * Link a Google ID to an existing email/password account
   */
  async linkGoogleId(userId, googleId, avatarUrl) {
    const result = await pool.query(
      `UPDATE users SET google_id = $1, avatar_url = COALESCE(avatar_url, $2), is_verified = TRUE
       WHERE id = $3
       RETURNING *`,
      [googleId, avatarUrl, userId]
    );
    return result.rows[0];
  },

  /**
   * Record a successful login — reset failed attempts, update last_login info
   */
  async recordSuccessfulLogin(userId, ip) {
    await pool.query(
      `UPDATE users SET
         failed_attempts = 0,
         locked_until = NULL,
         last_login_at = NOW(),
         last_login_ip = $2
       WHERE id = $1`,
      [userId, ip]
    );
  },

  /**
   * Increment failed login attempts.
   * If threshold reached, lock the account for LOCKOUT_DURATION_MINUTES.
   * @returns {object} updated user row
   */
  async incrementFailedAttempts(userId) {
    const result = await pool.query(
      `UPDATE users SET
         failed_attempts = failed_attempts + 1,
         locked_until = CASE
           WHEN failed_attempts + 1 >= $2
           THEN NOW() + INTERVAL '${LOCKOUT_DURATION_MINUTES} minutes'
           ELSE locked_until
         END
       WHERE id = $1
       RETURNING failed_attempts, locked_until`,
      [userId, MAX_FAILED_ATTEMPTS]
    );
    return result.rows[0];
  },

  /**
   * Check if a user account is currently locked
   * @returns {{ locked: boolean, until: Date|null }}
   */
  isAccountLocked(user) {
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return { locked: true, until: new Date(user.locked_until) };
    }
    return { locked: false, until: null };
  },

  /**
   * Get a safe public profile (no password_hash)
   */
  toPublicProfile(user) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      role: user.role,
      isVerified: user.is_verified,
      lastLoginAt: user.last_login_at,
      createdAt: user.created_at,
    };
  },
};

module.exports = UserModel;
