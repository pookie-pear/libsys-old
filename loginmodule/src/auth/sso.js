const jwt = require('jsonwebtoken');

/**
 * Creates a short-lived authorization code (represented by a JWT) 
 * for Single Sign-On (SSO) redirects.
 * @param {Object} payload - User data to be encoded
 * @param {string} secret - The SSO secret
 * @returns {string} - Short-lived token (auth code)
 */
const generateAuthCode = (payload, secret) => {
  return jwt.sign(payload, secret, { expiresIn: '5m' }); // Short-lived (5 mins)
};

/**
 * Exchanges an auth code for a full user profile and long-lived token.
 * This is used by an external service to verify the user from UniLogin.
 * @param {string} code - The temporary auth code received from the redirect
 * @param {string} secret - The SSO secret used to sign the code
 * @returns {Object} - Decoded user data
 */
const exchangeAuthCode = (code, secret) => {
  try {
    return jwt.verify(code, secret);
  } catch (error) {
    throw new Error('SSO Auth Code verification failed: ' + error.message);
  }
};

