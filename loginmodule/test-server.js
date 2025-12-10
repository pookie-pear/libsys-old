require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const { 
  connectDB,
  generateToken,
  hashPassword,
  comparePassword,
  generateAuthCode,
  exchangeAuthCode,
  ssoRedirect,
  successResponse, 
  errorResponse, 
  notFound, 
  errorHandler 
} = require('./src/index');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5001', 'http://localhost:5002', 'http://localhost:5003', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public')); // Serve the web UI

// New Middleware: Check DB Connection Status before processing requests
app.use((req, res, next) => {
  if (req.path.startsWith('/api') && mongoose.connection.readyState !== 1) {
    return errorResponse(res, 503, 'Database not connected. Please check your MONGO_URI and IP whitelist.');
