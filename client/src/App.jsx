import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './views/Dashboard';
import IrLibrary from './views/IrLibrary';
import Login from './views/Login';
import { AuthProvider, useAuth } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/library" element={<IrLibrary />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}


export default App;

