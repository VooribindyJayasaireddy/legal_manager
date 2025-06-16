const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes: verifies JWT and attaches user to req
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1]; // Get token from header

      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token

      // Find user by ID and attach to request, excluding password
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found.' });
      }

      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      console.error('Token verification failed:', error);
      res.status(401).json({ message: 'Not authorized, token failed or expired.' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token.' });
  }
};

module.exports = { protect };
