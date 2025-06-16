const User = require('../models/User');
const jwt = require('jsonwebtoken'); // For creating JSON Web Tokens

// Helper function to generate a JWT token
const generateToken = (id) => {
  // Sign the token with the user's ID and your JWT_SECRET from .env
  // The token expires in 1 hour (3600 seconds)
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1h', // Token valid for 1 hour
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    // Destructure required fields from the request body
    const { username, email, password, firstName, lastName, phoneNumber } = req.body;

    // Basic validation for required fields
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please enter all required fields: username, email, and password.' });
    }
    
    // Validate phone number format if provided
    if (phoneNumber && !/^[0-9]{10}$/.test(phoneNumber)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit phone number.' });
    }

    // Check if a user with the given username or email already exists
    const userExists = await User.findOne({ $or: [{ username }, { email }] });
    if (userExists) {
      return res.status(400).json({ message: 'User with this username or email already exists.' });
    }

    // Create a new user instance. The password hashing happens in the pre-save middleware defined in User model.
    const user = await User.create({
      username,
      email,
      password, // Mongoose pre-save hook will hash this
      firstName,
      lastName,
      phoneNumber
    });

    // If user creation is successful
    if (user) {
      // Generate a token for the newly registered user
      const token = generateToken(user._id);

      res.status(201).json({
        message: 'User registered successfully',
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        token: token, // Send the token back to the client
      });
    } else {
      res.status(400).json({ message: 'Invalid user data provided.' });
    }
  } catch (error) {
    console.error('Error during user registration:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter both email and password.' });
    }

    // Find the user by email. Use .select('+password') to explicitly retrieve the password field
    // because it's set to `select: false` in the schema for security reasons.
    const user = await User.findOne({ email }).select('+password');

    // Check if user exists and if the password matches
    if (user && (await user.matchPassword(password))) {
      // Update lastLogin timestamp
      user.lastLogin = Date.now();
      await user.save(); // Save the updated user document

      // Generate a token for the authenticated user
      const token = generateToken(user._id);

      res.status(200).json({
        message: 'Login successful',
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        token: token, // Send the token back to the client
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials (email or password incorrect).' });
    }
  } catch (error) {
    console.error('Error during user login:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

// @desc    Get user profile (example of a protected route)
// @route   GET /api/auth/profile
// @access  Private (requires authentication)
exports.getUserProfile = async (req, res) => {
  // req.user is populated by the 'protect' middleware
  if (req.user) {
    res.status(200).json({
      _id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
    });
  } else {
    res.status(404).json({ message: 'User not found.' });
  }
};
