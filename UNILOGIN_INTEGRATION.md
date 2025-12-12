# UniLogin (Unil) Integration Documentation

This document details how the UniLogin module was integrated into this project. Use this as a reference for future implementations to ensure seamless SSO and database synchronization.

## 1. Core Module Structure
The `loginmodule` is a self-contained directory containing authentication logic, database utilities, and middleware.

- **`src/index.js`**: The main entry point that exports shared instances (especially `mongoose`) and utilities.
- **`src/db/connect.js`**: Handles MongoDB connection with specific timeouts to prevent buffering hangs.
- **`src/auth/jwt.js`**: Contains JWT generation and standard protection middleware.
- **`src/utils/response.js`**: Standardizes API responses to `{ success, message, data }`.

## 2. Backend Integration (`server/index.js`)

### Shared Mongoose Instance
**Crucial**: To avoid "Buffering timed out" errors, the main server must share the `mongoose` instance from the `loginmodule`.
```javascript
const { mongoose, connectDB, ...utils } = require('../loginmodule/src/index');
```

### Cookie-Based SSO Middleware
We implemented `protectWithCookie` to handle both standard `Authorization` headers and `unil_session` cookies.
```javascript
const protectWithCookie = (secret) => async (req, res, next) => {
  let token;
  // 1. Try Header (ignore literal 'null' strings)
  if (req.headers.authorization?.startsWith('Bearer')) {
    const headerToken = req.headers.authorization.split(' ')[1];
    if (headerToken !== 'null') token = headerToken;
  }
  // 2. Fallback to Cookies
  if (!token && req.cookies) {
    token = req.cookies.unil_session || req.cookies.token;
  }
  // ... verify token with jwt.verify(token, secret)
};
```

### Database Guard
Added a `checkDB` middleware to prevent queries if the connection isn't ready (`readyState !== 1`).

## 3. Frontend Integration (`client/src/`)

### AuthContext Setup
The `AuthProvider` handles the global state and session checks.
- **`credentials: 'include'`**: Mandatory for all `fetch` calls to ensure cookies are sent.
- **`refreshAuth`**: A function that manually triggers a session check against `/api/auth/me`.

### useLibrary Hook
All data-fetching hooks that require authentication must include `credentials: 'include'`:
```javascript
const res = await fetch(API_URL, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(updates),
  credentials: 'include' // Required for Unil SSO
});
```

### Login View
- Added a branded **"Login with UniLogin"** button.
- Logic: Clicking the button calls `refreshAuth()`. If a cookie exists, the user is logged in instantly without entering credentials.

## 4. Troubleshooting Checklist for Future Projects
1. **Mongoose Version**: Ensure the module and server aren't using two different versions of Mongoose.
2. **CORS**: Must allow `credentials: true` and specify (or dynamically match) the exact origin.
3. **Cookie Settings**: Ensure `unil_session` cookie is set with `httpOnly: true` and appropriate `sameSite` settings (usually `lax` or `none` for cross-site).
4. **Header 'null'**: Always sanitize incoming `Authorization` headers to ignore the string `"null"`.
