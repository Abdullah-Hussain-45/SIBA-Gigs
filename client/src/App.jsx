import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import MyGigs from './pages/History.jsx';
import History from './pages/History.jsx';
import Profile from './pages/Profile.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

function App() {
  return (
    <Router>
      <Routes>
        {/* Base Redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Active Route Channels */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} /> {/* <-- This was missing! */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/my-gigs" element={<MyGigs />} />
        <Route path="/history" element={<History />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin-portal-siba" element={<AdminDashboard />} />

        {/* Fallback Catch */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;