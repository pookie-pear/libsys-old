import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [unilUser, setUnilUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  
  const { login, register, verifySSO } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Check if there's an active UniLogin session on port 5001
    const checkUnilSession = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUnilUser(data.data);
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
    const redirectUri = encodeURIComponent('http://localhost:5173/login');
    window.location.href = `http://localhost:5001/api/sso/authorize?redirect_uri=${redirectUri}`;
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
        navigate('/');
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
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>

        {checkingSession ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
            Checking session...
          </div>
        ) : unilUser ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              background: 'var(--primary)', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 20px',
              fontSize: '2rem',
              color: 'white',
              fontWeight: 'bold'
            }}>
              {unilUser.name ? unilUser.name[0].toUpperCase() : unilUser.email[0].toUpperCase()}
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
              Detected UniLogin session for <strong>{unilUser.name || unilUser.email}</strong>
            </p>
            
            <button
              onClick={handleUniLoginSSO}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: 'pointer',
                marginBottom: '16px',
                transition: 'all 0.2s',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Logging in...' : `Continue as ${unilUser.name || unilUser.email.split('@')[0]}`}
            </button>

            <button
              onClick={() => setUnilUser(null)}
              style={{
                width: '100%',
                padding: '14px',
                background: 'transparent',
                color: 'var(--text-muted)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Login as different user
            </button>
          </div>
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

            <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', gap: '16px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
            </div>

            <button
              onClick={handleUniLoginSSO}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: 'transparent',
                color: 'white',
                border: '1px solid var(--primary)',
                borderRadius: '12px',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                transition: 'all 0.2s',
                opacity: loading ? 0.7 : 1
              }}
            >
              <img src="/favicon.svg" alt="Unil" style={{ width: '20px', height: '20px' }} />
              Login with UniLogin
            </button>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>

              <button
                onClick={() => setIsLogin(!isLogin)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--primary)',
