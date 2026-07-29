/**
 * password.utils.js
 * Password hashing, comparison, and strength validation
 */

const bcrypt = require('bcryptjs');
const zxcvbn = require('zxcvbn');

const SALT_ROUNDS = 12;

/**
 * Hash a plaintext password
 * @param {string} password
 * @returns {Promise<string>} bcrypt hash
 */
const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare a plaintext password against a stored hash
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Validate password strength using zxcvbn
 * Requires score >= 2 (out of 4) and minimum 8 characters
 * @param {string} password
 * @param {string[]} userInputs - extra context (email, name) to penalise
 * @returns {{ valid: boolean, score: number, feedback: string }}
 */
const validatePasswordStrength = (password, userInputs = []) => {
  if (!password || password.length < 8) {
    return {
      valid: false,
      score: 0,
      feedback: 'Password must be at least 8 characters long.',
    };
  }

  const result = zxcvbn(password, userInputs);

  // score 0 = very weak, 1 = weak, 2 = fair, 3 = good, 4 = strong
  if (result.score < 2) {
    const suggestion =
      result.feedback.suggestions.length > 0
        ? result.feedback.suggestions[0]
        : result.feedback.warning || 'Use a mix of letters, numbers, and symbols.';

    return {
      valid: false,
      score: result.score,
      feedback: suggestion,
    };
  }

  return {
    valid: true,
    score: result.score,
    feedback: 'Password is strong enough.',
  };
};

module.exports = {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
};
