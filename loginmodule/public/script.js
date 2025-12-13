document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const ssoBtn = document.getElementById('sso-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const responseOutput = document.getElementById('response-output');
    const clearBtn = document.getElementById('clear-btn');

    let currentToken = localStorage.getItem('unilToken');

    // Utility function to log responses
    const logResponse = (data, isError = false) => {
        const timestamp = new Date().toLocaleTimeString();
        const formattedData = JSON.stringify(data, null, 2);
        const className = isError ? 'error' : 'success';
        
        responseOutput.innerHTML = `<div class="${className}">[${timestamp}] ${isError ? 'Error' : 'Success'}:</div>\n${formattedData}\n\n` + responseOutput.innerHTML;
    };

    // Logout Logic
    logoutBtn.addEventListener('click', () => {
        currentToken = null;
        localStorage.removeItem('unilToken');
        logResponse({ message: 'Logged out successfully' });
    });

    // SSO Logic
    ssoBtn.addEventListener('click', async () => {
        if (!currentToken) {
            logResponse({ message: 'No active session found. Please login first.' }, true);
            return;
        }

        logResponse({ message: 'Attempting SSO Login with Service B...' });
        
        try {
            // 1. Call Authorize (Frontend to Backend)
            // Simulating a redirect by just calling the API with the current token
            const response = await fetch('/api/sso/authorize?redirect_uri=http://localhost:5001/callback', {
                headers: { 'Authorization': `Bearer ${currentToken}` },
                redirect: 'manual' // Prevent browser from following the redirect
            });

            if (response.type === 'opaqueredirect' || response.status === 302) {
                // In a real scenario, the browser would redirect.
                // Here, we'll manually parse the 'code' from the Location header if possible.
                // But for simulation, let's just show what happens.
                logResponse({ message: 'Redirecting to Service B with auth code...' });
            }

            // For the demo, we'll simulate the "Callback" phase:
            // 2. Service B receives a code, then verifies it (Backend to Backend)
            // Let's grab a dummy code for simulation
            const dummyCode = currentToken; // Simplified for the demo
            
            const verifyResponse = await fetch('/api/sso/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: dummyCode })
            });
            const verifyData = await verifyResponse.json();
            logResponse(verifyData, !verifyResponse.ok);
            
        } catch (error) {
            logResponse({ message: 'SSO Simulation failed', error: error.message }, true);
        }
    });

    // Register Logic
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const data = await response.json();
            logResponse(data, !response.ok);
            if(response.ok) {
                registerForm.reset();
                if(data.data.token) {
                    currentToken = data.data.token;
                    localStorage.setItem('unilToken', currentToken);
                }
            }
        } catch (error) {
            logResponse({ message: 'Network error occurred' }, true);
        }
    });

    // Login Logic
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            logResponse(data, !response.ok);
