/**
 * Standardized success response helper
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {Object} data - Payload to send in the response
 * @param {string} message - Success message
 * @returns {Object} - JSON response
 */
const successResponse = (res, statusCode, data, message = 'Success') => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Standardized error response helper
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Error} error - Optional error object
 * @returns {Object} - JSON response
 */
const errorResponse = (res, statusCode, message = 'Error', error = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: error ? error.message : null,
  });
};

module.exports = {
  successResponse,
  errorResponse,
};
