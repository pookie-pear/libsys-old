import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './views/Dashboard';
import IrLibrary from './views/IrLibrary';
import Login from './views/Login';
import { AuthProvider, useAuth } from './context/AuthContext';

function App() {
