const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getMyProfile,
  getProfileByUserId,
  createOrUpdateProfile,
  uploadProfilePicture,
  getAllProfiles,
  deleteProfile
} = require('../controllers/profileController');

// Multer setup for file uploads
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads/profiles');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Apply protect middleware to all routes
router.use(protect);

// @route   GET /api/profiles/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', getMyProfile);

// @route   GET /api/profiles/user/:userId
// @desc    Get profile by user ID
// @access  Private/Admin
router.get('/user/:userId', authorize('admin'), getProfileByUserId);

// @route   POST /api/profiles
// @desc    Create or update user profile
// @access  Private
router.post('/', createOrUpdateProfile);

// @route   PUT /api/profiles/avatar
// @desc    Upload profile picture
// @access  Private
router.put('/avatar', upload.single('avatar'), uploadProfilePicture);

// @route   GET /api/profiles
// @desc    Get all profiles
// @access  Private/Admin
router.get('/', authorize('admin'), getAllProfiles);

// @route   DELETE /api/profiles
// @desc    Delete profile & user
// @access  Private
router.delete('/', deleteProfile);

module.exports = router;
