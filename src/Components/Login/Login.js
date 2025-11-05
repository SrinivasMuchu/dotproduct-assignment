import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('login')
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    })
  }

  const handleSignupChange = (e) => {
    setSignupData({
      ...signupData,
      [e.target.name]: e.target.value
    })
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_BASE_URL}/tracker/login`, loginData)
      
      if (response.data.success) {
        // Store user data in localStorage for authentication
        localStorage.setItem('userToken', response.data.data.uuid)
        localStorage.setItem('userData', JSON.stringify(response.data.data))
        
        alert('Login successful!')
        console.log('User data:', response.data.data)
        
        // Navigate to dashboard
        navigate('/dashboard')
      } else {
        alert(response.data.message)
      }
    } catch (error) {
      console.error('Login error:', error)
      if (error.response && error.response.data) {
        const { message, action } = error.response.data
        
        // If user doesn't exist, show message and switch to signup tab
        if (action === 'signup_required') {
          alert(message)
          setActiveTab('signup')
          // Pre-fill email in signup form
          setSignupData({
            ...signupData,
            email: loginData.email
          })
        } else {
          alert(message)
        }
      } else {
        alert('An error occurred during login')
      }
    }
  }

  const handleSignupSubmit = async (e) => {
    e.preventDefault()
    
    // Check if passwords match
    if (signupData.password !== signupData.confirmPassword) {
      alert('Passwords do not match!')
      return
    }
    
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_BASE_URL}/tracker/signup`, {
        name: signupData.name,
        email: signupData.email,
        password: signupData.password
      })
      
      if (response.data.success) {
        // Store user data in localStorage for authentication
        localStorage.setItem('userToken', response.data.data.uuid)
        localStorage.setItem('userData', JSON.stringify(response.data.data))
        
        alert('Signup successful!')
        console.log('User data:', response.data.data)
        
        // Clear signup form
        setSignupData({
          name: '',
          email: '',
          password: '',
          confirmPassword: ''
        })
        
        // Navigate to dashboard after successful signup
        navigate('/dashboard')
      } else {
        alert(response.data.message)
      }
    } catch (error) {
      console.error('Signup error:', error)
      if (error.response && error.response.data) {
        alert(error.response.data.message)
      } else {
        alert('An error occurred during signup')
      }
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="tab-buttons">
          <button 
            className={`tab-button ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
          <button 
            className={`tab-button ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => setActiveTab('signup')}
          >
            Signup
          </button>
        </div>

        {activeTab === 'login' && (
          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <h2>Login</h2>
            <div className="form-group">
              <label htmlFor="login-email">Email:</label>
              <input
                type="email"
                id="login-email"
                name="email"
                value={loginData.email}
                onChange={handleLoginChange}
                required
                placeholder="Enter your email"
              />
            </div>
            <div className="form-group">
              <label htmlFor="login-password">Password:</label>
              <input
                type="password"
                id="login-password"
                name="password"
                value={loginData.password}
                onChange={handleLoginChange}
                required
                placeholder="Enter your password"
              />
            </div>
            <button type="submit" className="submit-button">
              Login
            </button>
          </form>
        )}

        {activeTab === 'signup' && (
          <form className="auth-form" onSubmit={handleSignupSubmit}>
            <h2>Signup</h2>
            <div className="form-group">
              <label htmlFor="signup-name">Name:</label>
              <input
                type="text"
                id="signup-name"
                name="name"
                value={signupData.name}
                onChange={handleSignupChange}
                required
                placeholder="Enter your full name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="signup-email">Email:</label>
              <input
                type="email"
                id="signup-email"
                name="email"
                value={signupData.email}
                onChange={handleSignupChange}
                required
                placeholder="Enter your email"
              />
            </div>
            <div className="form-group">
              <label htmlFor="signup-password">Password:</label>
              <input
                type="password"
                id="signup-password"
                name="password"
                value={signupData.password}
                onChange={handleSignupChange}
                required
                placeholder="Enter your password"
              />
            </div>
            <div className="form-group">
              <label htmlFor="signup-confirm-password">Confirm Password:</label>
              <input
                type="password"
                id="signup-confirm-password"
                name="confirmPassword"
                value={signupData.confirmPassword}
                onChange={handleSignupChange}
                required
                placeholder="Confirm your password"
              />
            </div>
            <button type="submit" className="submit-button">
              Signup
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default Login