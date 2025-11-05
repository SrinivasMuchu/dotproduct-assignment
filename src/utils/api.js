// API Configuration
export const API_BASE_URL = process.env.REACT_APP_BACKEND_BASE_URL || 'http://localhost:5050';

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication endpoints
  LOGIN: '/tracker/login',
  SIGNUP: '/tracker/signup',
  UPDATE_BUDGET: '/tracker/update-budget',
  
  // Transaction endpoints
  TRANSACTIONS: '/transaction-tracker/transactions'
};

// Helper function to build complete API URLs
export const buildApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

// Helper function for transaction API with user ID
export const buildTransactionUrl = (userId) => {
  return `${API_BASE_URL}${API_ENDPOINTS.TRANSACTIONS}/${userId}`;
};

// Default axios configuration
export const axiosConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
};