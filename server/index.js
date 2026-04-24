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
const { authenticator } = require('otplib');
const { searchImage, uploadToImgBB } = require('./utils/imageService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:5000',
            'http://localhost:5001'
        ];
        
        if (
            allowedOrigins.includes(origin) || 
            origin.startsWith('http://localhost:') || 
            origin.endsWith('.onrender.com')
        ) {
            return callback(null, true);
        }
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

// Helper to create a session and generate token
const createSessionAndToken = async (user, req) => {
  const session = await Session.create({
    userId: user._id,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
  });

  const token = generateToken({ 
    id: user._id, 
    email: user.email,
    sessionId: session._id 
  }, process.env.JWT_SECRET);

  return { token, session };
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
    
    // Check if session is still valid in DB
    if (decoded.sessionId) {
      const session = await Session.findById(decoded.sessionId);
      if (!session || !session.isValid) {
        return res.status(401).json({ success: false, message: 'Session has been revoked or expired' });
      }
      // Update last active
      session.lastActive = new Date();
      await session.save();
    }

    req.user = decoded;
    req.isAdmin = decoded.email === process.env.ADMIN_EMAIL;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    return res.status(401).json({ success: false, message: 'Not authorized, session expired or invalid' });
  }
};

const auth = protectWithCookie(process.env.JWT_SECRET);

const adminOnly = (req, res, next) => {
  if (!req.isAdmin) return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
  next();
};

// Connect to Database
const connectToDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('SERVER ERROR: MONGO_URI is not defined in .env');
    return;
  }

  try {
    await connectDB(process.env.MONGO_URI);
  } catch (err) {
    console.error('SERVER ERROR: Initial database connection failed.');
    console.error(`Reason: ${err.message}`);
    // Retry connection after 5 seconds
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectToDB, 5000);
  }
};

connectToDB();

// User DB Connection (Separate for shared services)
let userConn;
try {
  userConn = mongoose.createConnection(process.env.USER_DB_URI);
  userConn.on('connected', () => console.log('User DB Connected (Shared)'));
  userConn.on('error', (err) => console.error('User DB Connection error:', err));
} catch (err) {
  console.error('Failed to create User DB connection:', err);
}

// User Schema & Model (Using shared user database)
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { timestamps: true });
const User = userConn ? userConn.model('User', userSchema) : mongoose.model('User', userSchema);

// Session Schema & Model for device/session control
const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userAgent: String,
  ip: String,
  lastActive: { type: Date, default: Date.now },
  isValid: { type: Boolean, default: true }
}, { timestamps: true });
const Session = userConn ? userConn.model('Session', sessionSchema) : mongoose.model('Session', sessionSchema);

// Personal Wishlist Schema
const wishlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  type: String,
  note: String,
  image: String,
  rating: Number,
  genres: [String],
  description: String,
  author: String,
  year: String,
  pageCount: Number,
  link: String,
  mediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
  addedAt: { type: Date, default: Date.now }
}, { timestamps: true });
const Wishlist = userConn ? userConn.model('Wishlist', wishlistSchema) : mongoose.model('Wishlist', wishlistSchema);

// Notification Schema
const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
  addedAt: { type: Date, default: Date.now }
}, { timestamps: true });
const Notification = userConn ? userConn.model('Notification', notificationSchema) : mongoose.model('Notification', notificationSchema);

// Media Schema & Model (Movies/YouTube/etc)
const mediaSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: { type: String, enum: ['movie', 'series', 'youtube', 'book', 'game', 'short'], required: true },
    image: String,
    link: String,
    author: String,
    publisher: String,
    isbn: String,
    year: String,
    language: String,
    pageCount: Number,
    genre: String, // Kept for legacy
    genres: [String],
    rating: Number,
    description: String,
    review: String,
    status: { type: String, default: 'Available' },
    category: { type: String, default: 'completed' }, // completed, to-watch, reading, etc.
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });
const Media = mongoose.model('Media', mediaSchema);

// IRL Book Schema & Model
const borrowerSchema = new mongoose.Schema({
    id: String, // Local borrower ID
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Linked shared user ID
    userEmail: String,
    name: String,
    dueDate: String,
    checkoutDate: { type: String, default: () => new Date().toISOString() }
});

const irlBookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    image: String,
    genre: String,
    genres: [String],
    description: String,
    isbn: String,
    language: String,
    publisher: String,
    year: String,
    pageCount: Number,
    totalCopies: { type: Number, default: 1 },
    borrowers: [borrowerSchema],
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });
const IrlBook = mongoose.model('IrlBook', irlBookSchema);

// --- Auth Endpoints ---

app.post('/api/auth/register', checkDB, async (req, res, next) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return errorResponse(res, 400, 'User already exists');

    const hashedPassword = await hashPassword(password);
    const user = await User.create({ name, email, password: hashedPassword });

    const { token } = await createSessionAndToken(user, req);
    res.cookie('unil_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    return successResponse(res, 201, { user: { id: user._id, name: user.name, email: user.email }, token }, 'User registered successfully');
  } catch (error) { next(error); }
});

app.post('/api/auth/login', checkDB, async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const envAdminEmail = process.env.ADMIN_EMAIL;
    const envAdminPassword = process.env.ADMIN_PASSWORD;
    const adminSecret = process.env.ADMIN_2FA_SECRET;

    // 1. Check for Super-Admin bypass via .env
    if (email === envAdminEmail && envAdminPassword && password === envAdminPassword) {
      let user = await User.findOne({ email });
      if (!user) {
        const hashedPassword = await hashPassword(envAdminPassword);
        user = await User.create({ name: 'Admin', email, password: hashedPassword });
      }

      if (adminSecret) {
        return successResponse(res, 200, { twoFactorRequired: true, email: user.email }, 'Admin credentials verified. 2FA code required.');
      }

      const { token } = await createSessionAndToken(user, req);
      res.cookie('unil_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

      return successResponse(res, 200, { user: { id: user._id, name: user.name, email: user.email, isAdmin: true }, token }, 'Admin Login Successful');
    }

    // 2. Standard User Login
    const user = await User.findOne({ email });
    if (!user) return errorResponse(res, 401, 'Invalid credentials');

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) return errorResponse(res, 401, 'Invalid credentials');

    const isAdmin = user.email === envAdminEmail;
    if (isAdmin && adminSecret) {
      return successResponse(res, 200, { twoFactorRequired: true, email: user.email }, 'Admin credentials verified. 2FA code required.');
    }

    const { token } = await createSessionAndToken(user, req);
    res.cookie('unil_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    return successResponse(res, 200, { user: { id: user._id, name: user.name, email: user.email, isAdmin }, token }, 'Login Successful');
  } catch (error) { next(error); }
});

app.post('/api/auth/verify-sso', checkDB, async (req, res, next) => {
  const { code } = req.body;
  try {
    const userData = exchangeAuthCode(code, process.env.JWT_SECRET);
    
    let user = await User.findOne({ email: userData.email });
    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await hashPassword(randomPassword);
      user = await User.create({
        name: userData.name || userData.email.split('@')[0],
        email: userData.email,
        password: hashedPassword
      });
    }

    const isAdmin = user.email === process.env.ADMIN_EMAIL;
    const adminSecret = process.env.ADMIN_2FA_SECRET;

    if (isAdmin && adminSecret) {
      return successResponse(res, 200, { twoFactorRequired: true, email: user.email }, 'SSO Login verified. 2FA code required.');
    }

    const { token } = await createSessionAndToken(user, req);
    res.cookie('unil_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    return successResponse(res, 200, { user: { id: user._id, name: user.name, email: user.email, isAdmin }, token }, 'SSO Login Successful');
  } catch (error) {
    return errorResponse(res, 401, 'SSO Verification Failed');
  }
});

app.get('/api/auth/me', [checkDB, auth], async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return errorResponse(res, 404, 'User not found');
        res.json({ ...user._doc, isAdmin: req.isAdmin });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

app.post('/api/auth/logout', [checkDB, auth], async (req, res) => {
  try {
    if (req.user && req.user.sessionId) {
      await Session.findByIdAndDelete(req.user.sessionId);
    }
    res.clearCookie('unil_session');
    return successResponse(res, 200, null, 'Logged out successfully');
  } catch (error) {
    res.clearCookie('unil_session');
    return successResponse(res, 200, null, 'Logged out with errors');
  }
});

// --- Profile & Session Management ---

app.put('/api/auth/profile', [checkDB, auth], async (req, res) => {
    const { name, email } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) return errorResponse(res, 404, 'User not found');

        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) return errorResponse(res, 400, 'Email already in use');
            user.email = email;
        }

        if (name) user.name = name;
        await user.save();

        return successResponse(res, 200, { user: { id: user._id, name: user.name, email: user.email } }, 'Profile updated successfully');
    } catch (error) {
        return errorResponse(res, 500, 'Failed to update profile');
    }
});

app.put('/api/auth/change-password', [checkDB, auth], async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) return errorResponse(res, 404, 'User not found');

        // Check if it's the admin from env
        if (user.email === process.env.ADMIN_EMAIL) {
            return errorResponse(res, 403, 'Master admin password must be changed in .env file');
        }

        const isMatch = await comparePassword(currentPassword, user.password);
        if (!isMatch) return errorResponse(res, 401, 'Current password incorrect');

        user.password = await hashPassword(newPassword);
        await user.save();

        // Invalidate ALL OTHER sessions for this user
        await Session.deleteMany({ 
            userId: user._id, 
            _id: { $ne: req.user.sessionId } 
        });

        return successResponse(res, 200, null, 'Password updated. All other devices logged out.');
    } catch (error) {
        return errorResponse(res, 500, 'Failed to update password');
    }
});

app.get('/api/auth/sessions', [checkDB, auth], async (req, res) => {
    try {
        const sessions = await Session.find({ userId: req.user.id }).sort({ lastActive: -1 });
        return successResponse(res, 200, sessions.map(s => ({
            id: s._id,
            userAgent: s.userAgent,
            ip: s.ip,
            lastActive: s.lastActive,
            isCurrent: s._id.toString() === req.user.sessionId
        })), 'Sessions retrieved');
    } catch (error) {
        return errorResponse(res, 500, 'Failed to retrieve sessions');
    }
});

app.delete('/api/auth/sessions/:id', [checkDB, auth], async (req, res) => {
    try {
        const session = await Session.findOne({ _id: req.params.id, userId: req.user.id });
        if (!session) return errorResponse(res, 404, 'Session not found');
        
        if (session._id.toString() === req.user.sessionId) {
            return errorResponse(res, 400, 'Cannot revoke current session via this endpoint. Use /logout instead.');
        }

        await session.deleteOne();
        return successResponse(res, 200, null, 'Session revoked');
    } catch (error) {
        return errorResponse(res, 500, 'Failed to revoke session');
    }
});

app.delete('/api/auth/sessions', [checkDB, auth], async (req, res) => {
    try {
        await Session.deleteMany({ 
            userId: req.user.id, 
            _id: { $ne: req.user.sessionId } 
        });
        return successResponse(res, 200, null, 'All other sessions revoked');
    } catch (error) {
        return errorResponse(res, 500, 'Failed to revoke other sessions');
    }
});

// --- Personal Wishlist Endpoints ---

app.get('/api/wishlist', [checkDB, auth], async (req, res) => {
    try {
        const items = await Wishlist.find({ userId: req.user.id }).sort({ addedAt: -1 });
        return successResponse(res, 200, items, 'Wishlist retrieved');
    } catch (error) {
        return errorResponse(res, 500, 'Failed to retrieve wishlist');
    }
});

app.post('/api/wishlist', [checkDB, auth], async (req, res) => {
    try {
        const item = await Wishlist.create({
            userId: req.user.id,
            ...req.body
        });
        return successResponse(res, 201, item, 'Item added to wishlist');
    } catch (error) {
        return errorResponse(res, 500, 'Failed to add to wishlist');
    }
});

app.delete('/api/wishlist/:id', [checkDB, auth], async (req, res) => {
    try {
        const item = await Wishlist.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!item) return errorResponse(res, 404, 'Item not found');
        return successResponse(res, 200, null, 'Item removed from wishlist');
    } catch (error) {
        return errorResponse(res, 500, 'Failed to remove from wishlist');
    }
});

// --- Admin User Management Endpoints ---

app.get('/api/admin/users', [checkDB, auth, adminOnly], async (req, res) => {
    try {
        // Fetch all users
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        
        // Enhance with item counts for high-speed overview
        const enhancedUsers = await Promise.all(users.map(async (user) => {
            const wishlistCount = await Wishlist.countDocuments({ userId: user._id });
            const sessionCount = await Session.countDocuments({ userId: user._id });
            const isAdmin = user.email === process.env.ADMIN_EMAIL;
            
            return {
                ...user._doc,
                id: user._id,
                wishlistCount,
                sessionCount,
                isAdmin
            };
        }));

        return successResponse(res, 200, enhancedUsers, 'Users retrieved successfully');
    } catch (error) {
        return errorResponse(res, 500, 'Failed to retrieve users');
    }
});

app.delete('/api/admin/users/:id', [checkDB, auth, adminOnly], async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Prevent self-deletion
        if (userId === req.user.id) {
            return errorResponse(res, 400, 'Cannot delete your own admin account');
        }

        // 1. Delete user
        const user = await User.findByIdAndDelete(userId);
        if (!user) return errorResponse(res, 404, 'User not found');

        // 2. Cleanup all user data
        await Wishlist.deleteMany({ userId });
        await Session.deleteMany({ userId });
        
        // Note: We don't delete shared Media items as they belong to the library,
        // but IRL book loans linked to this user should be cleared.
        await IrlBook.updateMany(
            { 'borrowers.userId': userId },
            { $pull: { borrowers: { userId: userId } } }
        );

        return successResponse(res, 200, null, 'User and all associated data deleted successfully');
    } catch (error) {
        return errorResponse(res, 500, 'Failed to delete user');
    }
});

// --- 2FA Endpoints ---

app.post('/api/auth/verify-2fa', checkDB, async (req, res) => {
    const { email, code } = req.body;
    const envAdminEmail = process.env.ADMIN_EMAIL;
    const adminSecret = process.env.ADMIN_2FA_SECRET;

    if (!email || !code) return errorResponse(res, 400, 'Email and code required');
    if (email !== envAdminEmail) return errorResponse(res, 403, 'Invalid request');
    if (!adminSecret) return errorResponse(res, 400, '2FA not configured for admin');

    if (!authenticator) return errorResponse(res, 500, 'TOTP Library failed to load');
    
    // Verify 2FA code
    const isValid = authenticator.check(code, adminSecret);
    if (!isValid) return errorResponse(res, 401, 'Invalid 2FA code');

    try {
        const user = await User.findOne({ email });
        if (!user) return errorResponse(res, 404, 'Admin user not found');

        const { token } = await createSessionAndToken(user, req);
        res.cookie('unil_session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        return successResponse(res, 200, { 
            user: { id: user._id, name: user.name, email: user.email, isAdmin: true }, 
            token 
        }, '2FA Verification Successful');
    } catch (error) {
        return errorResponse(res, 500, 'Verification failed');
    }
});

// Helper endpoint to generate a QR code for manual setup (Admin only)
app.get('/api/admin/setup-2fa', [checkDB, auth, adminOnly], async (req, res) => {
    if (!authenticator) return res.status(500).json({ success: false, message: 'TOTP Library failed to load' });
    const secret = process.env.ADMIN_2FA_SECRET || authenticator.generateSecret();
    const otpauth = authenticator.keyuri(process.env.ADMIN_EMAIL, 'LibraryShelf', secret);
    
    try {
        const QRCode = require('qrcode');
        const qrCodeDataUrl = await QRCode.toDataURL(otpauth);
        res.json({ 
            success: true, 
            secret, 
            qrCode: qrCodeDataUrl,
            message: 'Use this secret or QR code to setup your authenticator app.'
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to generate QR code' });
    }
});

// --- Notification Endpoints ---

app.get('/api/notifications', async (req, res) => {
    try {
        const notifications = await Notification.find().sort({ addedAt: -1 }).limit(20);
        return successResponse(res, 200, notifications, 'Notifications retrieved');
    } catch (error) {
        return errorResponse(res, 500, 'Failed to retrieve notifications');
    }
});

app.post('/api/notifications', [checkDB, auth, adminOnly], async (req, res) => {
    const { title, message, type } = req.body;
    try {
        const notification = await Notification.create({ title, message, type });
        return successResponse(res, 201, notification, 'Notification created');
    } catch (error) {
        return errorResponse(res, 500, 'Failed to create notification');
    }
});

app.delete('/api/notifications/:id', [checkDB, auth, adminOnly], async (req, res) => {
    try {
        const notification = await Notification.findByIdAndDelete(req.params.id);
        if (!notification) return errorResponse(res, 404, 'Notification not found');
        return successResponse(res, 200, null, 'Notification deleted');
    } catch (error) {
        return errorResponse(res, 500, 'Failed to delete notification');
    }
});

app.delete('/api/notifications', [checkDB, auth, adminOnly], async (req, res) => {
    try {
        await Notification.deleteMany({});
        return successResponse(res, 200, null, 'All notifications cleared');
    } catch (error) {
        return errorResponse(res, 500, 'Failed to clear notifications');
    }
});

// --- Protected API Endpoints ---

app.get('/api/media', async (req, res) => {
    try {
        const { page = 1, limit = 30, type, category, search, minRating } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = {};
        if (type && type !== 'all') query.type = type;
        if (category && category !== 'all') query.category = category;
        if (minRating) query.rating = { $gte: parseInt(minRating) };
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { genres: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        const totalItems = await Media.countDocuments(query);
        const media = await Media.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            items: media.map(m => ({ ...m._doc, id: m._id })),
            pagination: {
                totalItems,
                totalPages: Math.ceil(totalItems / parseInt(limit)),
                currentPage: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/media', auth, adminOnly, async (req, res) => {
    try {
        let { title, type, image } = req.body;
        
        // Auto-fetch image if missing
        if (!image) {
            // Check if we already have an image for this title in the DB
            const existing = await Media.findOne({ title: { $regex: new RegExp(`^${title}$`, 'i') } });
            if (existing && existing.image) {
                image = existing.image;
            } else {
                const searched = await searchImage(title, type);
                if (searched) {
                    image = await uploadToImgBB(searched, title);
                }
            }
        }

        const newMedia = await Media.create({ ...req.body, image });
        res.status(201).json({ ...newMedia._doc, id: newMedia._id });
    } catch (err) {
        console.error('Error adding media:', err);
        res.status(400).json({ message: 'Error adding media' });
    }
});

app.put('/api/media/:id', auth, adminOnly, async (req, res) => {
    try {
        const updatedMedia = await Media.findByIdAndUpdate(
            req.params.id, 
            { ...req.body, updatedAt: new Date().toISOString() }, 
            { new: true }
        );
        if (updatedMedia) {
            res.json({ ...updatedMedia._doc, id: updatedMedia._id });
        } else {
            res.status(404).json({ message: 'Media not found' });
        }
    } catch (err) {
        res.status(400).json({ message: 'Error updating media' });
    }
});

app.delete('/api/media/:id', auth, adminOnly, async (req, res) => {
    try {
        const deletedMedia = await Media.findByIdAndDelete(req.params.id);
        if (deletedMedia) {
            res.json({ message: 'Item deleted' });
        } else {
            res.status(404).json({ message: 'Media not found' });
        }
    } catch (err) {
        res.status(400).json({ message: 'Error deleting media' });
    }
});

// --- IRL Library Endpoints ---

app.get('/api/irl-books', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 30;
        const skip = (page - 1) * limit;

        const totalItems = await IrlBook.countDocuments();
        const books = await IrlBook.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const formattedBooks = books.map(b => ({ ...b._doc, id: b._id }));
        res.json({
            items: formattedBooks,
            pagination: {
                totalItems,
                totalPages: Math.ceil(totalItems / limit),
                currentPage: page,
                limit
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching books' });
    }
});

app.post('/api/irl-books', auth, async (req, res) => {
    try {
        let { title, image } = req.body;

        // Auto-cleanup if too many items
        const count = await IrlBook.countDocuments();
        if (count >= 1000) {
            // Remove oldest item
            const oldest = await IrlBook.findOne().sort({ createdAt: 1 });
            if (oldest) await IrlBook.findByIdAndDelete(oldest._id);
        }

        // Auto-fetch image if missing
        if (!image) {
            // Check if we already have an image for this title in the DB (anywhere)
            const existingMedia = await Media.findOne({ title: { $regex: new RegExp(`^${title}$`, 'i') } });
            const existingBook = await IrlBook.findOne({ title: { $regex: new RegExp(`^${title}$`, 'i') } });
            
            if (existingMedia && existingMedia.image) {
                image = existingMedia.image;
            } else if (existingBook && existingBook.image) {
                image = existingBook.image;
            } else {
                const searched = await searchImage(title, 'book');
                if (searched) {
                    image = await uploadToImgBB(searched, title);
                }
            }
        }

        const newBook = await IrlBook.create({
            ...req.body,
            image,
            borrowers: []
        });
        res.status(201).json({ ...newBook._doc, id: newBook._id });
    } catch (err) {
        console.error('Error adding book:', err);
        res.status(400).json({ message: 'Error adding book' });
    }
});

app.put('/api/irl-books/:id', auth, async (req, res) => {
    try {
        const updatedBook = await IrlBook.findByIdAndUpdate(
            req.params.id, 
            { ...req.body, updatedAt: new Date().toISOString() }, 
            { new: true }
        );
        if (updatedBook) {
            res.json({ ...updatedBook._doc, id: updatedBook._id });
        } else {
            res.status(404).json({ message: 'Book not found' });
        }
    } catch (err) {
        res.status(400).json({ message: 'Error updating book' });
    }
});

app.delete('/api/irl-books/:id', auth, async (req, res) => {
    try {
        const deletedBook = await IrlBook.findByIdAndDelete(req.params.id);
        if (deletedBook) {
            res.json({ message: 'Book deleted' });
        } else {
            res.status(404).json({ message: 'Book not found' });
        }
    } catch (err) {
        res.status(400).json({ message: 'Error deleting book' });
    }
});

app.get('/api/yt-title', auth, async (req, res) => {

    const { url } = req.query;
    if (!url) return res.status(400).json({ message: 'URL required' });

    try {
        const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
        const data = await response.json();
        if (data.title) {
            res.json({ title: data.title });
        } else {
            res.status(404).json({ message: 'Title not found' });
        }
    } catch (err) {
        console.error('Error fetching YouTube title:', err);
        res.status(500).json({ message: 'Failed to fetch title' });
    }
});

// --- Admin/Sync Endpoints ---

app.post('/api/admin/sync', auth, async (req, res) => {
    try {
        // We'll run the sync logic directly here for simplicity
        const libraryPath = path.join(__dirname, '../data/library.json');
        const irlPath = path.join(__dirname, '../data/irl_library.json');
        const imageCache = {};

        if (fs.existsSync(libraryPath)) {
            const libraryData = JSON.parse(fs.readFileSync(libraryPath, 'utf8'));
            for (const item of libraryData) {
                let existing = await Media.findOne({ title: { $regex: new RegExp(`^${item.title}$`, 'i') } });
                let imageUrl = item.image || (existing ? existing.image : null);
                if (!imageUrl) {
                    if (imageCache[item.title.toLowerCase()]) {
                        imageUrl = imageCache[item.title.toLowerCase()];
                    } else {
                        const searched = await searchImage(item.title, item.type);
                        if (searched) {
                            imageUrl = await uploadToImgBB(searched, item.title);
                            imageCache[item.title.toLowerCase()] = imageUrl;
                        }
                    }
                }
                const updateData = { ...item, image: imageUrl, updatedAt: new Date().toISOString() };
                delete updateData.id;
                await Media.findOneAndUpdate({ title: { $regex: new RegExp(`^${item.title}$`, 'i') } }, updateData, { upsert: true });
            }
        }

        if (fs.existsSync(irlPath)) {
            const irlData = JSON.parse(fs.readFileSync(irlPath, 'utf8'));
            for (const item of irlData) {
                let existing = await IrlBook.findOne({ title: { $regex: new RegExp(`^${item.title}$`, 'i') } });
                let imageUrl = item.image || (existing ? existing.image : null);
                if (!imageUrl) {
                    if (imageCache[item.title.toLowerCase()]) {
                        imageUrl = imageCache[item.title.toLowerCase()];
                    } else {
                        const searched = await searchImage(item.title, 'book');
                        if (searched) {
                            imageUrl = await uploadToImgBB(searched, item.title);
                            imageCache[item.title.toLowerCase()] = imageUrl;
                        }
                    }
                }
                const updateData = { ...item, image: imageUrl, updatedAt: new Date().toISOString() };
                delete updateData.id;
                await IrlBook.findOneAndUpdate({ title: { $regex: new RegExp(`^${item.title}$`, 'i') } }, updateData, { upsert: true });
            }
        }

        res.json({ success: true, message: 'Sync completed successfully' });
    } catch (err) {
        console.error('Sync failed:', err);
        res.status(500).json({ success: false, message: 'Sync failed', error: err.message });
    }
});

app.get('/api/admin/sync-status', auth, async (req, res) => {
    try {
        const progressPath = path.join(__dirname, 'sync-progress.json');
        if (fs.existsSync(progressPath)) {
            const data = JSON.parse(fs.readFileSync(progressPath, 'utf8'));
            res.json(data);
        } else {
            res.json({ status: 'idle' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Error reading status' });
    }
});
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));

    app.get('*path', (req, res, next) => {
        if (req.path.startsWith('/api')) {
            return next();
        }
        const indexPath = path.resolve(__dirname, '../client', 'dist', 'index.html');
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            res.status(404).send('Frontend build not found. Did you run "npm run build"?');
        }
    });
}

// Error handling
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

