const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  role: {
    type: String,
    enum: ['lawyer', 'client', 'admin'],
    default: 'client'
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  profilePicture: {
    type: String,
    default: 'default-avatar.png'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
profileSchema.index({ email: 1 });
profileSchema.index({ user: 1 });

// Virtual for profile URL
profileSchema.virtual('profileUrl').get(function() {
  return `/api/profiles/${this._id}`;
});

// Static method to get profile by user ID
profileSchema.statics.findByUserId = async function(userId) {
  return this.findOne({ user: userId });
};

// Pre-save hook to ensure email matches user's email if user exists
profileSchema.pre('save', async function(next) {
  if (this.isModified('email')) {
    const user = await mongoose.model('User').findById(this.user);
    if (user && user.email !== this.email) {
      throw new Error('Profile email must match user email');
    }
  }
  next();
});

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;
