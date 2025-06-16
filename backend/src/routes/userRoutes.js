const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// --- User Routes ---

// GET /api/users - Get all users with pagination and filtering
// Query params: page, limit, status, search
router.get('/', protect, userController.getAllUsers);

// GET /api/users/all - Get all users with minimal data (for dropdowns)
// Returns basic user info for selection purposes
router.get('/all', protect, userController.getAllUsersMinimal);

// GET /api/users/profile - Get authenticated user's profile
router.get('/profile', protect, userController.getUserProfile);

// PUT /api/users/profile - Update authenticated user's profile
router.put('/profile', protect, userController.updateUserProfile);

module.exports = router;
