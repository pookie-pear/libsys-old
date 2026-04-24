import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [is2FAStep, setIs2FAStep] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  
  const { login, register, verifySSO, setUser } = useAuth();
  const navigate = useNavigate();

  const UNILOGIN_URL = import.meta.env.VITE_UNILOGIN_URL || 'http://localhost:5001';

  // Handle 2FA verification
  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code: twoFactorCode })
      });
      const data = await res.json();

      if (data.success) {
        // Since verify-2fa sets the cookie, we just need to update local user state
        // and navigate. The cookie will handle the rest.
        if (data.data.user) {
          localStorage.setItem('token', data.data.token);
          // We need a way to update AuthContext user from here if not already handled
          window.location.href = '/'; // Simple way to refresh state
        }
      } else {
        setError(data.message || 'Invalid 2FA code');
      }
    } catch (err) {
      setError('Connection error during 2FA');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Check if there's an active UniLogin session
    const checkUnilSession = async () => {
      try {
        const res = await fetch(`${UNILOGIN_URL}/api/me`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          // If session found, automatically initiate SSO redirect
          if (data.success && data.data) {
            handleUniLoginSSO();
            return;
          }
        }
      } catch (err) {
        console.error('Error checking UniLogin session:', err);
      } finally {
        setCheckingSession(false);
      }
    };

    // 2. Check for SSO redirect code
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      const handleSSO = async () => {
        setLoading(true);
        const result = await verifySSO(code);
        if (result.success) {
          window.history.replaceState({}, document.title, "/login");
          navigate('/');
        } else {
          setError(result.message || 'SSO Login Failed');
        }
        setLoading(false);
      };
      handleSSO();
    } else {
      checkUnilSession();
    }
  }, []);

  const handleUniLoginSSO = async () => {
    setError('');
    const redirectUri = encodeURIComponent(window.location.origin + '/login');
    window.location.href = `${UNILOGIN_URL}/api/sso/authorize?redirect_uri=${redirectUri}`;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(formData.name, formData.email, formData.password);
      }

      if (result.success) {
        if (result.data?.twoFactorRequired) {
          setIs2FAStep(true);
        } else {
          navigate('/');
        }
      } else {
        setError(result.message || 'Authentication failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg-dark)',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '40px',
        background: 'var(--bg-card)',
        borderRadius: '24px',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(12px)'
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          marginBottom: '8px',
          fontSize: '2rem',
          background: 'linear-gradient(to right, var(--primary), var(--accent-cyan))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {is2FAStep ? 'Security Check' : (isLogin ? 'Welcome Back' : 'Create Account')}
        </h1>

        {checkingSession || (loading && !is2FAStep) ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ 
              width: '40px', 
              height: '40px', 
              border: '4px solid rgba(255,255,255,0.1)', 
              borderTop: '4px solid var(--primary)', 
              borderRadius: '50%', 
              margin: '0 auto 20px',
              animation: 'spin 1s linear infinite'
            }}></div>
            {loading ? 'Logging you in via UniLogin...' : 'Checking session...'}
            <style>{`
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
          </div>
        ) : is2FAStep ? (
          <>
            <p style={{ 
              textAlign: 'center', 
              color: 'var(--text-muted)', 
              marginBottom: '32px' 
            }}>
              Please enter the 6-digit code from your authenticator app to continue as Admin.
            </p>

            {error && (
              <div style={{
                padding: '12px',
                background: 'rgba(225, 29, 72, 0.1)',
                border: '1px solid var(--accent-rose)',
                color: 'var(--accent-rose)',
                borderRadius: '12px',
                marginBottom: '20px',
                fontSize: '0.9rem',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handle2FASubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Authenticator Code</label>
                <input
                  type="text"
                  placeholder="000000"
                  required
                  autoFocus
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  style={{
                    textAlign: 'center',
                    fontSize: '1.5rem',
                    letterSpacing: '0.5em',
                    padding: '16px'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading || twoFactorCode.length !== 6}
                style={{
                  background: 'var(--primary)',
                  color: 'white',
                  padding: '14px',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  marginTop: '10px',
                  opacity: (loading || twoFactorCode.length !== 6) ? 0.6 : 1
                }}
              >
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>

              <button
                type="button"
                onClick={() => setIs2FAStep(false)}
                style={{
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  border: 'none',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Back to Login
              </button>
            </form>
          </>
        ) : (
          <>
            <p style={{ 
              textAlign: 'center', 
              color: 'var(--text-muted)', 
              marginBottom: '32px' 
            }}>
              {isLogin ? 'Enter your details to access your library' : 'Join us to start managing your collection'}
            </p>

            {error && (
              <div style={{
                padding: '12px',
                background: 'rgba(225, 29, 72, 0.1)',
                border: '1px solid var(--accent-rose)',
                color: 'var(--accent-rose)',
                borderRadius: '12px',
                marginBottom: '20px',
                fontSize: '0.9rem',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {!isLogin && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '12px',
                  padding: '14px',
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '32px' }}>

              <button
                onClick={() => setIsLogin(!isLogin)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
