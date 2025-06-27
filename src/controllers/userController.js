const User = require('../models/User'); // Import the User model
const jwt = require('jsonwebtoken'); // Needed if generating token upon profile update for consistency

// Helper function to generate a JWT token (re-used for consistency)
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};


// @desc    Get all users with pagination and filtering
// @route   GET /api/users
// @access  Private
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    
    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Search by name, email, or username if search query is provided
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { username: searchRegex }
      ];
    }
    
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);
    
    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: users
    });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching users.' 
    });
  }
};

// @desc    Get minimal user data for dropdowns
// @route   GET /api/users/all
// @access  Private
exports.getAllUsersMinimal = async (req, res) => {
  try {
    const users = await User.find({})
      .select('_id firstName lastName email status')
      .sort({ firstName: 1, lastName: 1 });
      
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error fetching minimal user data:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching user data.' 
    });
  }
};

// @desc    Get authenticated user's profile
// @route   GET /api/users/profile
// @access  Private (requires authentication)
exports.getUserProfile = async (req, res) => {
  try {
    // req.user is populated by the 'protect' middleware based on the JWT
    // We explicitly select the password here to ensure it's not returned,
    // though the model schema already has `select: false`.
    const user = await User.findById(req.user._id).select('-password');

    if (user) {
      res.status(200).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,

        status: user.status,
        lastLogin: user.lastLogin,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } else {
      res.status(404).json({ message: 'User not found.' });
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error while fetching profile.' });
  }
};

// @desc    Update authenticated user's profile
// @route   PUT /api/users/profile
// @access  Private (requires authentication)
exports.updateUserProfile = async (req, res) => {
  try {
    // Find the user by ID from the authenticated request
    const user = await User.findById(req.user._id);

    if (user) {
      // Update fields if provided in the request body
      // We explicitly check for each field to allow partial updates
      // and prevent overwriting with undefined/null if not provided.
      // Password update requires special handling (current password verification)
      // which is omitted for simplicity but highly recommended in production.
      if (req.body.username !== undefined) user.username = req.body.username;
      if (req.body.email !== undefined) user.email = req.body.email;
      if (req.body.firstName !== undefined) user.firstName = req.body.firstName;
      if (req.body.lastName !== undefined) user.lastName = req.body.lastName;
      if (req.body.phoneNumber !== undefined) {
        // Validate phone number format if provided
        if (req.body.phoneNumber && !/^[0-9]{10}$/.test(req.body.phoneNumber)) {
          return res.status(400).json({ message: 'Please enter a valid 10-digit phone number.' });
        }
        user.phoneNumber = req.body.phoneNumber;
      }

      if (req.body.status !== undefined) user.status = req.body.status;
      if (req.body.avatar !== undefined) user.avatar = req.body.avatar;

      // Handle password change separately if a new password is provided
      if (req.body.password) {
        // In a real application, you'd typically require the current password
        // for security before allowing a new password to be set.
        user.password = req.body.password; // Pre-save hook will hash this
      }

      // Check for uniqueness if username or email is changed
      if (user.isModified('username')) {
        const usernameExists = await User.findOne({ username: user.username, _id: { $ne: user._id } });
        if (usernameExists) {
          return res.status(400).json({ message: 'Username is already taken.' });
        }
      }
      if (user.isModified('email')) {
        const emailExists = await User.findOne({ email: user.email, _id: { $ne: user._id } });
        if (emailExists) {
          return res.status(400).json({ message: 'Email is already registered.' });
        }
      }

      // Save the updated user
      const updatedUser = await user.save();

      // Regenerate token if username or email changed, to reflect updated info in payload (optional but good practice)
      const token = generateToken(updatedUser._id);

      res.status(200).json({
        message: 'Profile updated successfully',
        _id: updatedUser._id,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        role: updatedUser.role,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,

        status: updatedUser.status,
        avatar: updatedUser.avatar,
        token: token // Send new token if it was regenerated
      });
    } else {
      res.status(404).json({ message: 'User not found.' });
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    if (error.code === 11000) { // MongoDB duplicate key error
      return res.status(400).json({ message: 'A user with this username or email already exists.' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error during profile update.' });
  }
};
