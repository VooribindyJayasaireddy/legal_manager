const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware'); // Import the authentication middleware

// --- Authentication Routes ---

// POST /api/auth/register - Register a new user
router.post('/register', authController.registerUser);

// POST /api/auth/login - Authenticate user and get JWT token
router.post('/login', authController.loginUser);

// GET /api/auth/profile - Get authenticated user's profile (protected route example)
router.get('/profile', protect, authController.getUserProfile);

module.exports = router;
