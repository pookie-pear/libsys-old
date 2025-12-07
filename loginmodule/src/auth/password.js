const bcrypt = require('bcryptjs');

/**
 * Hashes a plain text password
 * @param {string} password - The password to hash
 * @returns {Promise<string>} - The hashed password
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Compares a plain text password with a hashed password
 * @param {string} enteredPassword - The plain text password
 * @param {string} hashedContent - The hashed password from DB
 * @returns {Promise<boolean>} - True if matching, false otherwise
 */
const comparePassword = async (enteredPassword, hashedContent) => {
  return await bcrypt.compare(enteredPassword, hashedContent);
};

module.exports = {
  hashPassword,
  comparePassword,
};
