const Profile = require('../models/Profile');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);

// @desc    Get current user's profile
// @route   GET /api/profiles/me
// @access  Private
const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ user: req.user.id })
    .populate('user', ['username']);

  if (!profile) {
    return res.status(404).json({ message: 'Profile not found' });
  }

  res.json(profile);
});

// @desc    Get profile by user ID
// @route   GET /api/profiles/user/:userId
// @access  Private/Admin
const getProfileByUserId = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ user: req.params.userId })
    .populate('user', ['username']);

  if (!profile) {
    return res.status(404).json({ message: 'Profile not found' });
  }

  res.json(profile);
});

// @desc    Create or update user profile
// @route   POST /api/profiles
// @access  Private
const createOrUpdateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address } = req.body;

  // Build profile object
  const profileFields = {
    user: req.user.id,
    name,
    email: req.user.email, // Ensure email matches user's email
    role: req.user.role,
    phone,
    address,
  };

  try {
    let profile = await Profile.findOne({ user: req.user.id });

    if (profile) {
      // Update
      profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true, runValidators: true }
      );
      return res.json(profile);
    }

    // Create
    profile = new Profile(profileFields);
    await profile.save();
    res.status(201).json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @desc    Upload profile picture
// @route   PUT /api/profiles/avatar
// @access  Private
const uploadProfilePicture = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a file' });
  }

  try {
    const profile = await Profile.findOne({ user: req.user.id });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Delete old profile picture if it exists and is not the default
    if (profile.profilePicture && profile.profilePicture !== 'default-avatar.png') {
      const oldImagePath = path.join(__dirname, '../uploads/profiles', profile.profilePicture);
      if (fs.existsSync(oldImagePath)) {
        await unlinkAsync(oldImagePath);
      }
    }

    // Update profile with new image filename
    profile.profilePicture = req.file.filename;
    await profile.save();

    res.json({ 
      success: true, 
      filePath: `/uploads/profiles/${req.file.filename}`,
      profile
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during file upload' });
  }
});

// @desc    Get all profiles
// @route   GET /api/profiles
// @access  Private/Admin
const getAllProfiles = asyncHandler(async (req, res) => {
  const profiles = await Profile.find().populate('user', ['username']);
  res.json(profiles);
});

// @desc    Delete profile & user
// @route   DELETE /api/profiles
// @access  Private
const deleteProfile = asyncHandler(async (req, res) => {
  try {
    // Remove profile
    await Profile.findOneAndRemove({ user: req.user.id });
    // Remove user
    await User.findOneAndRemove({ _id: req.user.id });

    res.json({ message: 'User removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = {
  getMyProfile,
  getProfileByUserId,
  createOrUpdateProfile,
  uploadProfilePicture,
  getAllProfiles,
  deleteProfile
};
