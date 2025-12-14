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
