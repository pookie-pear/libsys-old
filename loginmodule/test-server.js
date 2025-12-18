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
  }
  next();
});

// 1. Connect to Database (Re-added as requested)
if (process.env.MONGO_URI) {
  connectDB(process.env.MONGO_URI).catch(err => {
    console.error('SERVER WARNING: Database connection failed. Auth routes will not work.');
    console.error(`Reason: ${err.message}`);
  });
} else {
  console.warn('MONGO_URI not found in .env, DB connection skipped.');
}

// 2. Simple User Schema for demonstration
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// 3. Custom Auth Routes
/**
 * Register Route
 * POST { "name": "...", "email": "...", "password": "..." }
 */
app.post('/api/register', async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return errorResponse(res, 400, 'User already exists');
    }

    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    console.log('DEBUG: User created in DB:', {
      id: user._id,
      name: user.name,
      email: user.email,
      collection: User.collection.name,
      db: User.db.name
    });

    const token = generateToken({ id: user._id, email: user.email }, process.env.JWT_SECRET);
    
    // Set cookie for browser-based SSO
    res.cookie('unil_session', token, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    return successResponse(res, 201, {
      id: user._id,
      name: user.name,
      email: user.email,
      token: token
    }, 'User registered successfully');
    
  } catch (error) {
    next(error);
  }
});

/**
 * Custom Login Route
 * POST { "email": "...", "password": "..." }
 */
app.post('/api/login', async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return errorResponse(res, 401, 'Invalid credentials (User not found)');
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid credentials (Incorrect password)');
    }

    console.log('Login successful for:', email);
    const token = generateToken({ id: user._id, email: user.email }, process.env.JWT_SECRET);

    // Set cookie for browser-based SSO
    res.cookie('unil_session', token, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    return successResponse(res, 200, { 
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      token: token
    }, 'Login Successful');
    
  } catch (error) {
    next(error);
  }
});

/**
 * SSO Authorize Endpoint
 * GET /api/sso/authorize?redirect_uri=http://service-b.com/callback
 * This checks if the user is already logged in to UniLogin.
 */
app.get('/api/sso/authorize', (req, res) => {
