// backend/src/models/Client.js

const mongoose = require('mongoose');

// Define the Client Schema
const clientSchema = new mongoose.Schema({
  // Reference to the User (advocate) who 'owns' this client record.
  // This ensures data isolation and that each advocate sees only their clients.
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Refers to the 'User' model (from your User Authentication phase)
    required: true,
  },
  // Client's first name
  firstName: {
    type: String,
    required: true,
    trim: true, // Remove whitespace from both ends of a string
  },
  // Client's last name
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  // Client's email address. Marked as unique per user to prevent duplicate entries for an advocate.
  email: {
    type: String,
    lowercase: true,
    trim: true,
    required: false, // Email can be optional
    validate: {
      validator: function(v) {
        // Only validate if email is provided
        if (!v) return true;
        // Basic email validation
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} is not a valid email address!`
    }
  },
  // Client's phone number
  phone: {
    type: String,
    trim: true,
    required: [true, 'Phone number is required'],
    validate: {
      validator: function(v) {
        // Basic phone number validation - allows numbers, +, -, (, ), and spaces
        return /^[\+\s\-0-9()]{10,20}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  // Client's physical address, structured as an embedded object
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true },
  },
  // Client's date of birth
  dateOfBirth: {
    type: Date,
  },
  // Client's occupation
  occupation: {
    type: String,
    trim: true,
  },
  // General notes about the client
  notes: {
    type: String,
    trim: true,
  },
  // Automatic timestamps for creation and last update
}, {
  timestamps: true, // Adds `createdAt` and `updatedAt` fields automatically
});

// Create and export the Client model
module.exports = mongoose.model('Client', clientSchema);
