import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import './TopBar.css'

function TopBar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userData, setUserData] = useState(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Check authentication status
    const token = localStorage.getItem('userToken')
    const storedUserData = localStorage.getItem('userData')
    
    if (token && storedUserData) {
      setIsAuthenticated(true)
      setUserData(JSON.parse(storedUserData))
    } else {
      setIsAuthenticated(false)
      setUserData(null)
    }
  }, [location]) // Re-check on route changes

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('userToken')
    localStorage.removeItem('userData')
    
    // Update state
    setIsAuthenticated(false)
    setUserData(null)
    
    // Close mobile menu
    setIsMobileMenuOpen(false)
    
    // Redirect to login
    navigate('/login')
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const isActivePage = (path) => {
    return location.pathname === path
  }

  return (
    <nav className="topbar">
      <div className="topbar-container">
        {/* Logo/Brand */}
        <div className="topbar-brand">
          <Link to={isAuthenticated ? "/dashboard" : "/login"} className="brand-link">
            <span className="brand-icon">💰</span>
            <span className="brand-text">ExpenseTracker</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="topbar-nav desktop-nav">
          {isAuthenticated ? (
            // Authenticated user navigation
            <>
              <Link 
                to="/dashboard" 
                className={`nav-link ${isActivePage('/dashboard') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span className="nav-icon">📊</span>
                Dashboard
              </Link>
              <Link 
                to="/transactions" 
                className={`nav-link ${isActivePage('/transactions') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span className="nav-icon">📝</span>
                Transactions
              </Link>
            </>
          ) : (
            // Guest navigation
            <>
              <Link 
                to="/login" 
                className={`nav-link ${isActivePage('/login') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Login
              </Link>
            </>
          )}
        </div>

        {/* User Profile / Auth Section */}
        <div className="topbar-user desktop-nav">
          {isAuthenticated ? (
            <div className="user-menu">
              <div className="user-info">
                <span className="user-avatar">👤</span>
                <span className="user-name">{userData?.name}</span>
              </div>
              <button className="logout-btn" onClick={handleLogout}>
                <span className="logout-icon">🚪</span>
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="login-btn">
              Get Started
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-btn"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <span className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      <div className={`mobile-nav ${isMobileMenuOpen ? 'active' : ''}`}>
        <div className="mobile-nav-content">
          {isAuthenticated ? (
            // Authenticated mobile navigation
            <>
              <div className="mobile-user-info">
                <span className="user-avatar">👤</span>
                <div className="user-details">
                  <span className="user-name">{userData?.name}</span>
                  <span className="user-email">{userData?.email}</span>
                </div>
              </div>
              
              <div className="mobile-nav-links">
                <Link 
                  to="/dashboard" 
                  className={`mobile-nav-link ${isActivePage('/dashboard') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <span className="nav-icon">📊</span>
                  Dashboard
                </Link>
                <Link 
                  to="/transactions" 
                  className={`mobile-nav-link ${isActivePage('/transactions') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <span className="nav-icon">📝</span>
                  Transactions
                </Link>
              </div>
              
              <button className="mobile-logout-btn" onClick={handleLogout}>
                <span className="logout-icon">🚪</span>
                Logout
              </button>
            </>
          ) : (
            // Guest mobile navigation
            <div className="mobile-nav-links">
              <Link 
                to="/login" 
                className={`mobile-nav-link ${isActivePage('/login') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Login / Signup
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={closeMobileMenu}></div>
      )}
    </nav>
  )
}

export default TopBar