import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../App';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaUser, FaPhone, FaGavel, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

// Error Modal Component
const ErrorModal = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <FaTimes className="h-5 w-5" />
        </button>
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg 
              className="h-6 w-6 text-red-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
          <h3 className="mt-3 text-lg font-medium text-gray-900">Error</h3>
          <div className="mt-2">
            <p className="text-sm text-gray-500">{message}</p>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Login = () => {
  const [error, setError] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showGavel, setShowGavel] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [resetStatus, setResetStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Prevent scrolling when component mounts
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    // Cleanup function to re-enable scrolling when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    phoneNumber: '',
    agreeTerms: false,
  });

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return re.test(String(email).toLowerCase());
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'email') {
      if (value && !validateEmail(value)) {
        setEmailError('Please enter a valid email address');
      } else {
        setEmailError('');
      }
    }
    
    // Special handling for phone number to ensure it's stored as a string of digits
    if (name === 'phoneNumber') {
      // Remove all non-digit characters
      const numericValue = value.replace(/\D/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  /**
   * Validates the registration form data
   * @throws {Error} If validation fails
   */
  const validateRegistrationData = (data) => {
    // Check required fields
    const requiredFields = ['username', 'email', 'password', 'firstName', 'lastName'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
    }
    
    if (!data.agreeTerms) {
      throw new Error('You must agree to the terms and conditions');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error('Please enter a valid email address');
    }

    // Validate password strength
    if (data.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Validate phone number if provided
    if (data.phoneNumber && !/^\d{10,15}$/.test(data.phoneNumber)) {
      throw new Error('Please enter a valid phone number (10-15 digits)');
    }
  };

  /**
   * Handles the registration form submission
   */
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // Validate form data
      validateRegistrationData(formData);

      // Prepare user data for registration
      const userData = {
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phoneNumber || undefined
      };

      console.log('Sending registration request...', { 
        ...userData, 
        password: '[REDACTED]' 
      });

      // Send registration request
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache': 'no-cache'
        },
        credentials: 'include',
        body: JSON.stringify(userData),
        mode: 'cors'
      });

      // Parse response
      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.error('Failed to parse JSON response:', e, 'Response:', responseText);
        throw new Error('Invalid server response');
      }

      console.log('Registration response:', {
        status: response.status,
        data: responseData
      });

      // Handle error responses
      if (!response.ok) {
        if (response.status === 400) {
          throw new Error(responseData.message || 'Invalid registration data');
        } else if (response.status === 409) {
          throw new Error('An account with this email or username already exists');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(responseData.message || 'Registration failed');
        }
      }

      // Registration successful
      setActiveTab('login');
      setError('');
      setResetStatus('Registration successful! You can now log in with your credentials.');
      
      // Reset form
      setFormData({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        agreeTerms: false
      });
      
    } catch (err) {
      console.error('Registration error:', err);
      
      // Handle specific error cases
      let errorMessage = err.message || 'Registration failed. Please try again.';
      
      if (err.message.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      } else if (err.name === 'TypeError') {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // Validate input
      if (!formData.email || !formData.password) {
        throw new Error('Please enter both email and password');
      }

      const loginData = {
        email: formData.email.trim(),
        password: formData.password
      };
      console.log('Attempting login with email:', loginData.email);

      // Make API call to backend
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(loginData)
      });

      // Check if response is JSON
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response from login:', text);
        throw new Error('Unexpected response from server');
      }

      console.log('Login response:', { status: response.status, data });
      
      // Debug: Log the exact structure of the response
      console.log('Login response data structure:', {
        hasData: !!data,
        hasDataData: !!(data && data.data),
        dataKeys: data ? Object.keys(data) : [],
        dataDataKeys: data && data.data ? Object.keys(data.data) : []
      });

      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }

      // If we get here, login was successful
      if (data.data && data.data.token) {
        // Debug: Log the exact user data we're trying to pass
        const userData = {
          _id: data.data._id,
          username: data.data.username,
          email: data.data.email,
          firstName: data.data.firstName,
          lastName: data.data.lastName,
          role: data.data.role
        };
        
        console.log('Attempting to login with user data:', userData);
        
        // Call the login function from AuthContext with the token and user data
        login({
          token: data.data.token,
          userData: userData
        });
        
        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        console.error('Login response missing token:', data);
        throw new Error('No authentication token received in response');
      }
    } catch (err) {
      console.error('Login error:', err);
      // Provide user-friendly error messages
      let errorMessage = 'An error occurred during login. Please try again.';
      
      if (err.message.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      } else if (err.message.includes('Invalid email or password') || 
                err.message.includes('Please enter both')) {
        errorMessage = err.message; // Use the specific error message
      }
      
      setError(errorMessage);
      throw err; // Re-throw to be caught by handleSubmit
    } finally {
      setIsLoading(false);
    }
  };

  const showError = (message) => {
    setError(message);
    setShowErrorModal(true);
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setError('');
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    // Basic email validation
    if (!email || !validateEmail(email)) {
      showError('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setResetStatus('');
    
    try {
      console.log('Sending password reset request for email:', email);
      
      const response = await fetch('http://localhost:5000/api/auth/forgotpassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email: email.trim() })
      });
      
      // Check if response is JSON
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response from password reset:', text);
        throw new Error('Unexpected response from server');
      }
      
      console.log('Password reset response:', { status: response.status, data });

      if (!response.ok) {
        // Handle specific error statuses
        if (response.status === 404) {
          // For security, don't reveal if email exists or not
          console.log('Email not found in system');
        } else if (response.status === 400) {
          throw new Error(data.message || 'Invalid email format');
        } else if (response.status >= 500) {
          throw new Error('Unable to process password reset. Please try again later.');
        } else {
          throw new Error(data.message || 'Failed to process your request');
        }
      }
      
      // Always show success message (for security, don't reveal if email exists or not)
      setResetStatus('If an account exists with this email, you will receive a password reset link shortly.');
      setEmail('');
      
    } catch (err) {
      console.error('Password reset error:', err);
      
      // Show appropriate error message
      let errorMessage = err.message || 'An error occurred while processing your request.';
      
      // Handle network errors
      if (err.message.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      }
      
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle form submission with loading state
  const handleSubmit = async (e, type) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    setShowGavel(true);
    
    try {
      // Handle form submission based on type (login/register)
      if (type === 'login') {
        await handleLogin(e);
      } else {
        // Prepare user data for registration
        const userData = {
          username: formData.username.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phoneNumber: formData.phoneNumber || undefined
        };

        console.log('Sending registration request...', { 
          ...userData, 
          password: '[REDACTED]' 
        });

        // Send registration request
        const response = await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cache': 'no-cache'
          },
          credentials: 'include',
          body: JSON.stringify(userData),
          mode: 'cors'
        });

        // Parse response
        const responseText = await response.text();
        let responseData = {};
        
        try {
          responseData = responseText ? JSON.parse(responseText) : {};
        } catch (e) {
          console.error('Failed to parse JSON response:', e, 'Response text:', responseText);
          // If we can't parse the response, include the raw text in the error
          throw new Error(`Server returned an invalid response: ${response.status} ${response.statusText}\n${responseText.substring(0, 200)}`);
        }

        console.log('Registration response:', {
          status: response.status,
          data: responseData
        });

        // Handle error responses
        if (!response.ok) {
          console.error('Registration failed with status:', response.status, 'Response data:', responseData);
          
          if (response.status === 400) {
            // If there are validation errors, show them
            if (responseData.errors && Array.isArray(responseData.errors)) {
              throw new Error(responseData.errors.join('\n'));
            }
            throw new Error(responseData.message || 'Invalid registration data. Please check your input.');
          } else if (response.status === 409) {
            throw new Error('An account with this email or username already exists');
          } else if (response.status >= 500) {
            throw new Error('Server error. Please try again later.');
          } else {
            throw new Error(responseData.message || 'Registration failed. Please try again.');
          }
        }

        // Registration successful
        const { token, user } = responseData.data;
        
        if (token) {
          // Store the token in localStorage
          localStorage.setItem('token', token);
          
          // Update auth context
          login({
            id: user._id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          });
          
          // Redirect to dashboard
          navigate('/dashboard');
        } else {
          // If no token, show success message and switch to login
          setActiveTab('login');
          showError('Registration successful! Please log in with your credentials.');
          
          // Clear form
          setFormData({
            username: '',
            email: '',
            password: '',
            firstName: '',
            lastName: '',
            phoneNumber: ''
          });
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
      setShowGavel(false);
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left Panel with Image */}
      <div className="hidden md:block w-1/2 relative">
        <img
          src="/images/legal-style.png"
          alt="Legal Office"
          className="h-full w-full object-cover"
        />
      </div>

      {/* Right Panel with Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 overflow-y-auto relative">
        {/* Title */}
        <div className="absolute top-16 left-0 right-0 text-center">
          <h1 className="text-5xl font-black text-[#1e1e2f] mb-1 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            ADVOCY
          </h1>
        </div>
        {/* Loading Overlay */}
        <AnimatePresence>
          {isSubmitting && (
            <motion.div 
              className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="flex flex-col items-center"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div
                  animate={{
                    rotate: [0, 30, 0, -30, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                >
                  <FaGavel className="text-4xl text-[#1e1e2f] mb-4" />
                </motion.div>
                <motion.p 
                  className="text-gray-600 font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Processing your request...
                </motion.p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.div 
          className={`w-full max-w-md border border-gray-200 rounded-3xl shadow-lg p-5 bg-white ${
            isMounted ? 'opacity-100' : 'opacity-0'
          }`}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex justify-center mb-2">
            <div className="relative w-56">
              <div className="flex">
                <button
                  type="button"
                  className={`flex-1 py-6 px-6 text-center font-medium text-sm focus:outline-none ${
                    activeTab === 'login' 
                      ? 'text-[#1e1e2f] border-b-2 border-[#1e1e2f]' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('login')}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className={`flex-1 py-6 px-6 text-center font-medium text-sm focus:outline-none ${
                    activeTab === 'register' 
                      ? 'text-[#1e1e2f] border-b-2 border-[#1e1e2f]' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Register
                </button>
              </div>
            </div>
          </div>

          {/* Welcome Header */}
          <div className="mb-4 text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-1">
              {activeTab === 'login' 
                ? 'Welcome Back' 
                : activeTab === 'register' 
                ? 'Create an Account'
                : 'Reset Your Password'}
            </h2>
            <p className="text-xs text-gray-500">
              {activeTab === 'login' 
                ? 'Sign in to continue to your account'
                : activeTab === 'register'
                ? 'Fill in your details to create an account'
                : 'Enter your email to receive a password reset link'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Success Message */}
          {resetStatus && (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4">
              {resetStatus}
            </div>
          )}

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={(e) => handleSubmit(e, 'login')} className="space-y-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-3 py-3 border ${
                    emailError ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
                  placeholder="Enter your email"
                  required
                />
                {emailError && activeTab === 'login' && (
                  <p className="text-red-500 text-xs mt-1">{emailError}</p>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-[#1e1e2f] focus:ring-[#1e1e2f] border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('forgot')}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className={`w-full bg-[#1e1e2f] text-white py-2 rounded-md hover:bg-[#2e2e3f] text-sm font-medium transition-colors ${
                  isSubmitting || isLoading 
                    ? 'opacity-70 cursor-not-allowed' 
                    : 'hover:bg-[#2e2e3f]'
                }`}
              >
                {isSubmitting || isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign in'}
              </button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <form onSubmit={(e) => handleSubmit(e, 'register')} className="space-y-1">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <label htmlFor="first-name" className="block text-sm font-medium text-gray-700">
                    First name
                  </label>
                  <input
                    type="text"
                    id="first-name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="last-name" className="block text-sm font-medium text-gray-700">
                    Last name
                  </label>
                  <input
                    type="text"
                    id="last-name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="username" className="block text-xs font-medium text-gray-700 mb-0.5">
                  Username
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="pl-10 block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Choose a username"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`pl-9 block w-full border ${
                      emailError ? 'border-red-500' : 'border-gray-300'
                    } rounded-md py-1.5 px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                {emailError && (
                  <p className="mt-0.5 text-xs text-red-600">{emailError}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                <p className="mt-0.5 text-xs text-gray-500 mb-1">
                  Must be at least 6 characters
                </p>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone number
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaPhone className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => {
                      // Only allow numbers and limit to 10 digits
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      handleInputChange({
                        target: {
                          name: 'phoneNumber',
                          value: value
                        }
                      });
                    }}
                    className="pl-10 block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="1234567890"
                    required
                  />
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    required
                  />
                </div>
                <div className="ml-2 text-xs">
                  <label htmlFor="terms" className="text-gray-700">
                    I agree to the{' '}
                    <a href="#" className="text-blue-600 hover:text-blue-500">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-blue-600 hover:text-blue-500">
                      Privacy Policy
                    </a>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#1e1e2f] text-white py-2 rounded-md hover:bg-[#2e2e3f] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>

              <p className="mt-4 text-center text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}

          {/* Forgot Password Form */}
          {activeTab === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#1e1e2f] text-white py-2 rounded-md hover:bg-[#2e2e3f] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending...' : 'Send reset link'}
              </button>


              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Back to login
                </button>
              </div>
            </form>
          )}

          {/* Footer */}
          <div className="mt-2">
            {/* Footer Links */}
            <div className="text-xs text-gray-500 text-center space-x-4">
              <a href="#" className="hover:underline">Terms of Service</a>
              <a href="#" className="hover:underline">Privacy Policy</a>
              <a href="#" className="hover:underline">Contact Support</a>
            </div>

            <p className="text-[10px] text-center text-gray-400 mt-1">
              2024 Advocy. All rights reserved.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
