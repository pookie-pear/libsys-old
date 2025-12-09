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
