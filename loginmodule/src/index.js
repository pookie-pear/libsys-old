const mongoose = require('mongoose');
const connectDB = require('./db/connect');
const { generateToken, protect } = require('./auth/jwt');
const { verifyGoogleToken } = require('./auth/google');
const { hashPassword, comparePassword } = require('./auth/password');
const { generateAuthCode, exchangeAuthCode, ssoRedirect } = require('./auth/sso');
const { notFound, errorHandler } = require('./middleware/error');
const { successResponse, errorResponse } = require('./utils/response');
const { validateEmail, validatePassword } = require('./utils/validate');

module.exports = {
  // Database connection
  connectDB,
  mongoose,

  // Authentication
  generateToken,
  protect,
  verifyGoogleToken,
  hashPassword,
  comparePassword,

  // SSO Utilities
  generateAuthCode,
  exchangeAuthCode,
  ssoRedirect,

  // Middleware
  notFound,
  errorHandler,

  // Response helpers
  successResponse,
  errorResponse,

  // Validation
  validateEmail,
  validatePassword,
};
