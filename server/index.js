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
    console.error('JWT Verification Error:', error.message);
    return res.status(401).json({ success: false, message: 'Not authorized, session expired or invalid' });
  }
};

const auth = protectWithCookie(process.env.JWT_SECRET);

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

    const token = generateToken({ id: user._id, email: user.email }, process.env.JWT_SECRET);
    res.cookie('unil_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    return successResponse(res, 201, { id: user._id, name: user.name, email: user.email, token }, 'User registered successfully');
  } catch (error) { next(error); }
});

app.post('/api/auth/login', checkDB, async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return errorResponse(res, 401, 'Invalid credentials');

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) return errorResponse(res, 401, 'Invalid credentials');

    const token = generateToken({ id: user._id, email: user.email }, process.env.JWT_SECRET);
    res.cookie('unil_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    return successResponse(res, 200, { user: { id: user._id, name: user.name, email: user.email }, token }, 'Login Successful');
  } catch (error) { next(error); }
});

app.post('/api/auth/verify-sso', checkDB, async (req, res, next) => {
  const { code } = req.body;
  try {
    const userData = exchangeAuthCode(code, process.env.JWT_SECRET);
    
    // Find or create user in our local database
    let user = await User.findOne({ email: userData.email });
    if (!user) {
      // Create a random password since they logged in via SSO
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await hashPassword(randomPassword);
      user = await User.create({
        name: userData.name || userData.email.split('@')[0],
        email: userData.email,
        password: hashedPassword
      });
    }

    const token = generateToken({ id: user._id, email: user.email }, process.env.JWT_SECRET);
    res.cookie('unil_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    return successResponse(res, 200, { user: { id: user._id, name: user.name, email: user.email }, token }, 'SSO Login Successful');
  } catch (error) {
    return errorResponse(res, 401, 'SSO Verification Failed');
  }
});

app.get('/api/auth/me', [checkDB, auth], async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return errorResponse(res, 404, 'User not found');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('unil_session');
  return successResponse(res, 200, null, 'Logged out successfully');
});

// --- Protected API Endpoints ---

app.get('/api/media', async (req, res) => {
    try {
        const media = await Media.find().sort({ createdAt: -1 });
        // Map _id to id for frontend compatibility
        const formattedMedia = media.map(m => ({ ...m._doc, id: m._id }));
        res.json(formattedMedia);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching media' });
    }
});

app.post('/api/media', auth, async (req, res) => {
    try {
        const newMedia = await Media.create(req.body);
        res.status(201).json({ ...newMedia._doc, id: newMedia._id });
    } catch (err) {
        res.status(400).json({ message: 'Error adding media' });
    }
});

app.put('/api/media/:id', auth, async (req, res) => {
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

app.delete('/api/media/:id', auth, async (req, res) => {
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
        const books = await IrlBook.find().sort({ createdAt: -1 });
        const formattedBooks = books.map(b => ({ ...b._doc, id: b._id }));
        res.json(formattedBooks);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching books' });
    }
});

app.post('/api/irl-books', auth, async (req, res) => {
    try {
        const newBook = await IrlBook.create({
            ...req.body,
            borrowers: []
        });
        res.status(201).json({ ...newBook._doc, id: newBook._id });
    } catch (err) {
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

// Serve static assets in production
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

