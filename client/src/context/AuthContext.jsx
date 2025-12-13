import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkLoggedIn = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('http://localhost:5000/api/auth/me', {
        headers,
        credentials: 'include' // Important for cookie-based SSO
      });

      // Handle both standard user object and standardized response { success, data }
      const responseData = await res.json();
      
      if (res.ok) {
        const userData = responseData.data || responseData;
        setUser(userData);
        return userData;
      } else {
        // If unauthorized and we had a token, clear it
        if (res.status === 401 && token) {
          localStorage.removeItem('token');
        }
        setUser(null);
        return null;
      }
    } catch (err) {
      console.error('Error checking auth:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    checkLoggedIn();
  }, []);

  const login = async (email, password) => {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
    const data = await res.json();
    if (res.ok) {
      setUser(data.data.user);
      localStorage.setItem('token', data.data.token);
      return { success: true };
    }
    return { success: false, message: data.message };
  };

  const register = async (name, email, password) => {
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
      credentials: 'include'
    });
