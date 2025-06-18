const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // For password hashing
const crypto = require('crypto'); // For generating password reset tokens

// Define the User Schema
const userSchema = new mongoose.Schema({
  // Username for login, must be unique across all users.
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true, // Ensures no two users can have the same username
    trim: true, // Removes whitespace from both ends of the string
    minlength: 3, // Minimum length for username
  },
  // Email address, also unique, and stored in lowercase for consistency.
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'] // Basic email regex validation
  },
  // Hashed password. It's crucial to store hashed passwords, never plain text.
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6, // Minimum length for password
    select: false, // Prevents password from being returned in queries by default
  },
  // User's first name
  firstName: {
    type: String,
    trim: true,
  },
  // User's last name
  lastName: {
    type: String,
    trim: true,
  },
  // User's phone number
  phoneNumber: {
    type: String,
    trim: true,
    match: [/^[0-9]{10,15}$/, 'Please enter a valid phone number (10-15 digits)']
  },
  // Status of the user account (e.g., active, inactive, pending)
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active',
  },
  // Date when the user last logged in
  lastLogin: {
    type: Date,
  },
  // Optional: avatar or profile picture URL
  avatar: {
    type: String,
  },
  // Password reset token
  resetPasswordToken: String,
  // Expiry time for the password reset token (default: 10 minutes from creation)
  resetPasswordExpire: Date
}, {
  // Mongoose will automatically add `createdAt` and `updatedAt` fields
  timestamps: true,
});

// --- Pre-save middleware for password hashing ---
// This middleware runs BEFORE a user document is saved to the database.
// It checks if the password field has been modified (e.g., on registration or password change).
// If modified, it hashes the password using bcrypt.
userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) {
    return next();
  }

  // Generate a salt (random string) to add to the password before hashing.
  // A higher saltRound number makes hashing more secure but takes longer. 10 is a good default.
  const salt = await bcrypt.genSalt(10);

  // Hash the password using the generated salt
  this.password = await bcrypt.hash(this.password, salt);
  next(); // Proceed to save the user
});

// --- Method to compare entered password with hashed password ---
// This is a custom method added to the userSchema, making it available on user documents.
userSchema.methods.matchPassword = async function (enteredPassword) {
  // Use bcrypt.compare to compare the plain text enteredPassword with the hashed password stored in the database.
  // `this.password` refers to the hashed password of the current user document.
  // Note: 'select: false' on the password field means you might need to explicitly select it
  // in your query (e.g., `.select('+password')`) before calling this method if you're not getting it by default.
  return await bcrypt.compare(enteredPassword, this.password);
};

// --- Method to generate and hash password reset token ---
userSchema.methods.getResetPasswordToken = function() {
  // Generate a random token using Node's crypto module
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash the token and set it to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set token expiry time (10 minutes from now)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Return the unhashed token (we'll send this to the user's email)
  return resetToken;
};

// Create and export the User model
module.exports = mongoose.model('User', userSchema);
