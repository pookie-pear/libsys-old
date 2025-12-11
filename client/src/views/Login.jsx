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
