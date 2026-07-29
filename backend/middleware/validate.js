/**
 * validate.js
 * Lightweight request body validation middleware factory
 */

const { sendBadRequest } = require('../utils/response.utils');

/**
 * Creates a validation middleware from a schema object.
 * Schema format:
 *   {
 *     fieldName: {
 *       required: true,
 *       type: 'string' | 'email' | 'uuid',
 *       minLength: number,
 *       maxLength: number,
 *     }
 *   }
 *
 * @param {object} schema
 * @returns Express middleware
 */
const validate = (schema) => (req, res, next) => {
  const errors = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = req.body[field];
    const isEmpty = value === undefined || value === null || value === '';

    // required check
    if (rules.required && isEmpty) {
      errors.push(`${field} is required.`);
      continue;
    }

    // skip optional fields that are absent
    if (isEmpty) continue;

    const strVal = String(value).trim();

    // type checks
    if (rules.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(strVal)) {
        errors.push(`${field} must be a valid email address.`);
      }
    }

    if (rules.type === 'uuid') {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(strVal)) {
        errors.push(`${field} must be a valid UUID.`);
      }
    }

    // length checks
    if (rules.minLength && strVal.length < rules.minLength) {
      errors.push(`${field} must be at least ${rules.minLength} characters.`);
    }

    if (rules.maxLength && strVal.length > rules.maxLength) {
      errors.push(`${field} must be at most ${rules.maxLength} characters.`);
    }
  }

  if (errors.length > 0) {
    return sendBadRequest(res, 'Validation failed', errors);
  }

  next();
};

module.exports = { validate };
