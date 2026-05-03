const { validationResult } = require('express-validator');
const ApiResponse = require('../utils/apiResponse');

/**
 * Runs after express-validator chains.
 * Returns 400 with field errors if validation fails.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    return ApiResponse.badRequest(res, 'Validation failed', formatted);
  }
  next();
};

module.exports = validate;
