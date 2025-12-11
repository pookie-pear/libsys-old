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
