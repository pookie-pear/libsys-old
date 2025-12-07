const mongoose = require('mongoose');

/**
 * Connects to MongoDB
 * @param {string} url - MongoDB connection string
 * @returns {Promise} - Mongoose connection promise
 */
const connectDB = async (url) => {
  try {
    const conn = await mongoose.connect(url, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Instead of exiting, we'll rethrow the error so the caller can handle it
    throw error;
  }
};

module.exports = connectDB;
