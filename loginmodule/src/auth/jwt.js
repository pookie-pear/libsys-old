const jwt = require('jsonwebtoken');

/**
 * Generates a JWT token
 * @param {Object} payload - Data to be encoded in the token
 * @param {string} secret - Secret key for signing the token
 * @param {string} expiresIn - Token expiration time (e.g., '30d')
 * @returns {string} - Signed JWT token
 */
const generateToken = (payload, secret, expiresIn = '30d') => {
  return jwt.sign(payload, secret, {
    expiresIn,
  });
};

/**
 * Middleware to protect routes and verify JWT tokens
 * @param {string} secret - Secret key for verifying the token
 * @returns {Function} - Express middleware
 */
const protect = (secret) => async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, secret);

      // Add decoded payload to request object
      req.user = decoded;

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      return next(new Error('Not authorized, token failed'));
    }
  }

  if (!token) {
    res.status(401);
    return next(new Error('Not authorized, no token'));
  }
};

module.exports = {
  generateToken,
  protect,
};
