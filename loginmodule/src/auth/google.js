const { OAuth2Client } = require('google-auth-library');

/**
 * Verifies a Google ID token
 * @param {string} token - The ID token from Google (sent from frontend)
 * @param {string} clientId - Your Google Client ID
 * @returns {Promise<Object>} - The decoded user information from Google
 */
const verifyGoogleToken = async (token, clientId) => {
  const client = new OAuth2Client(clientId);

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    
    // Standardizing the user object
    return {
      googleId: payload['sub'],
      email: payload['email'],
      name: payload['name'],
      picture: payload['picture'],
      email_verified: payload['email_verified']
    };
  } catch (error) {
    throw new Error(`Google verification failed: ${error.message}`);
  }
};

module.exports = {
  verifyGoogleToken,
};
