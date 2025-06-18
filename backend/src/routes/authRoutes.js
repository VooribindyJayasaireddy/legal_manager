const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// --- Authentication Routes ---

// POST /api/auth/register - Register a new user
router.post('/register', authController.registerUser);

// POST /api/auth/login - Authenticate user and get JWT token
router.post('/login', authController.loginUser);

// POST /api/auth/forgotpassword - Send password reset email
router.post('/forgotpassword', authController.forgotPassword);

// PUT /api/auth/resetpassword/:resettoken - Reset password with token
router.put('/resetpassword/:resettoken', authController.resetPassword);

// GET /api/auth/profile - Get authenticated user's profile (protected route example)
router.get('/profile', protect, authController.getUserProfile);

module.exports = router;
