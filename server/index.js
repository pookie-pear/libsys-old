require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const { 
  connectDB,
  mongoose,
  generateToken,
  hashPassword,
  comparePassword,
  exchangeAuthCode,
  protect,
  successResponse, 
  errorResponse, 
  notFound, 
  errorHandler 
} = require('../loginmodule/src/index');

const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, '../data/library.json');
const IRL_DATA_FILE = path.join(__dirname, '../data/irl_library.json');

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        // Allow any localhost origin for dev flexibility
        if (origin.startsWith('http://localhost:')) return callback(null, true);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Connection Status Monitor
mongoose.connection.on('connected', () => console.log('Mongoose connected to DB'));
mongoose.connection.on('error', (err) => console.error('Mongoose connection error:', err));
mongoose.connection.on('disconnected', () => console.warn('Mongoose disconnected from DB'));

// Database Check Middleware
const checkDB = (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    return next();
  }
  
  // If disconnected or error, return 503
  if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
    return res.status(503).json({ 
      success: false, 
      message: 'Database connection is lost. Please try again later.' 
    });
  }

  // If connecting (2), wait a bit or return 503
  return res.status(503).json({ 
    success: false, 
    message: 'Database is still connecting. Please try again in a few seconds.' 
  });
};

// Custom Protect Middleware that checks both Authorization header and unil_session cookie
const protectWithCookie = (secret) => async (req, res, next) => {
  let token;

  // Log all cookies for debugging SSO
  // console.log('DEBUG: Incoming Cookies:', req.cookies);

  // Try Header first, but ignore if it's the string 'null'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    const headerToken = req.headers.authorization.split(' ')[1];
    if (headerToken && headerToken !== 'null') {
      token = headerToken;
    }
  }

  // If no token from header, try cookies
  if (!token) {
    if (req.cookies && req.cookies.unil_session) {
      token = req.cookies.unil_session;
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
  }

  if (!token || token === 'null') {
    return res.status(401).json({ success: false, message: 'Not authorized, no valid session token' });
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
