
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './Components/Login/Login';
import Dashboard from './Components/Dashboard/Dashboard';
import Transaction from './Components/Transactions/Transaction';
import ProtectedRoute from './Components/ProtectedRoute/ProtectedRoute';
import TopBar from './Components/NavBar/TopaBar';

function App() {
  return (
    <Router>
      <div className="App">
        <TopBar />
        
        <Routes>
          {/* Default route - redirect based on authentication */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Authentication routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Dashboard route */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected Transactions route */}
          <Route 
            path="/transactions" 
            element={
              <ProtectedRoute>
                <Transaction />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch all route - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
