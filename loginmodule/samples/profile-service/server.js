const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { exchangeAuthCode, successResponse, errorResponse } = require('../../src/index');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 1. SSO Callback (This is where UniLogin redirects back to)
app.get('/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.redirect('/?error=no_code');
    res.redirect(`/?code=${code}`);
});

// 2. Verify SSO Code (Called by Frontend)
app.post('/api/verify-sso', async (req, res) => {
    const { code } = req.body;
    try {
        const userData = exchangeAuthCode(code, process.env.JWT_SECRET);
        return successResponse(res, 200, { user: userData }, 'SSO login successful on Profile Service');
    } catch (error) {
        return errorResponse(res, 401, 'SSO verification failed');
    }
});

const PORT = 5003;
app.listen(PORT, () => {
    console.log(`Profile Service (Service B) running on http://localhost:${PORT}`);
});
