const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// Helper function to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// @desc Register new user
exports.registerUser = async (req, res) => {
  console.log('Registration attempt:', {
    body: req.body,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
  
  try {
    // Log database connection status
    console.log('MongoDB connection state:', mongoose.connection.readyState);
    console.log('Available collections:', (await mongoose.connection.db.listCollections().toArray()).map(c => c.name));
    const { username, email, password, firstName, lastName, phoneNumber } = req.body;

    // Input validations
    if (!username || !email || !password) {
      const error = 'Username, email and password are required';
      console.log('Validation failed:', error);
      return res.status(400).json({ success: false, message: error });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    if (phoneNumber && !/^\d{10,15}$/.test(phoneNumber)) {
      return res.status(400).json({ success: false, message: 'Phone number must be 10-15 digits' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { username: username.trim() },
        { email: email.toLowerCase().trim() }
      ]
    });

    if (existingUser) {
      const field = existingUser.username === username.trim() ? 'Username' : 'Email';
      return res.status(400).json({ success: false, message: `${field} already exists` });
    }

    // Create new user
    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
      firstName: (firstName || '').trim(),
      lastName: (lastName || '').trim(),
      phoneNumber: phoneNumber || undefined,
      status: 'active'
    });

    // Generate token
    const token = generateToken(user._id);
    
    // Return success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { 
        _id: user._id, 
        username: user.username, 
        email: user.email, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        role: user.role, 
        token 
      }
    });

  } catch (error) {
    console.error('Register error:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        success: false, 
        message: `${field} is already registered` 
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    
    // Handle other errors
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc Login user
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Input validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    // Normalize email and find user
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    // Check if user exists and password matches
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is not active. Please contact support.' 
      });
    }

    user.lastLogin = Date.now();
    await user.save();

    const token = generateToken(user._id);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { _id: user._id, username: user.username, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, token }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// @desc Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No user found with this email' });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;
    const message = `Reset your password by clicking: ${resetUrl}`;

    try {
      await sendEmail({ email: user.email, subject: 'Password Reset', message });
      res.status(200).json({ success: true, message: 'Reset email sent successfully' });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      console.error('Email sending error:', err);
      res.status(500).json({ message: 'Failed to send email' });
    }
  } catch (error) {
    console.error('Forgot Password error:', error);
    res.status(500).json({ message: 'Server error during forgot password' });
  }
};

// @desc Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = generateToken(user._id);
    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      token,
      user: { _id: user._id, username: user.username, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role }
    });
  } catch (error) {
    console.error('Reset Password error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
};

// @desc Get User Profile (protected route)
exports.getUserProfile = async (req, res) => {
  if (!req.user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.status(200).json({
    _id: req.user._id,
    username: req.user.username,
    email: req.user.email,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    createdAt: req.user.createdAt,
    updatedAt: req.user.updatedAt,
  });
};
