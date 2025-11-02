import React from 'react';
import { Navigate } from 'react-router-dom';

// Simple authentication check - you can enhance this based on your needs
const isAuthenticated = () => {
  // Check if user is logged in (you might store this in localStorage, context, etc.)
  return localStorage.getItem('userToken') !== null;
};

function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

export default ProtectedRoute;