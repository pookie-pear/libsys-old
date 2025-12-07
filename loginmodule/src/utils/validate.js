/**
 * Simple email validation regex
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const validateEmail = (email) => {
  const re = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};

/**
 * Simple password strength validation
 * @param {string} password - Password to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const validatePassword = (password) => {
  // Min 6 characters
  return password.length >= 6;
};

module.exports = {
  validateEmail,
  validatePassword,
};
