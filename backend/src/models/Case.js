const mongoose = require('mongoose');

// Define the Case Schema
const caseSchema = new mongoose.Schema({
  // Reference to the User (advocate) who 'owns' this case record.
  // This ensures that cases are tied to a specific user for data isolation.
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Refers to the 'User' model
    required: true,
  },
  // The name or title of the legal case.
  caseName: {
    type: String,
    required: [true, 'Case name is required'],
    trim: true,
  },
  // A unique identifier or number for the case, often assigned by the court or internal system.
  caseNumber: {
    type: String,
    unique: true, // Ensures no two cases can have the same case number
    trim: true,
    required: [true, 'Case number is required'],
  },
  // A detailed description of the case.
  description: {
    type: String,
    trim: true,
  },
  // An array of client IDs associated with this case.
  // A single case can involve multiple clients.
  clients: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client', // Refers to the 'Client' model
    },
  ],
  // The current status of the case (e.g., open, pending, closed).
  status: {
    type: String,
    enum: ['open', 'pending', 'closed', 'on_hold', 'archived'], // Allowed statuses
    default: 'open', // Default status for new cases
  },
  // The type of case (e.g., "Family Law", "Criminal Defense", "Corporate Litigation").
  caseType: {
    type: String,
    trim: true,
  },
  // The date when the case officially started or was opened.
  startDate: {
    type: Date,
    default: Date.now,
  },
  // The expected or actual date when the case concluded.
  endDate: {
    type: Date,
  },
  // The name of the court where the case is being handled.
  court: {
    type: String,
    trim: true,
  },
  // The jurisdiction where the case is filed (e.g., "California Superior Court", "New York Federal Court").
  jurisdiction: {
    type: String,
    trim: true,
  },
  // Any additional notes or important information about the case.
  notes: {
    type: String,
    trim: true,
  },
  // Optional: A unique ID or reference for external case management systems if integrated.
  externalId: {
    type: String,
    trim: true,
    unique: false, // Can be unique or not depending on integration needs
  },
}, {
  timestamps: true, // Adds `createdAt` and `updatedAt` fields automatically
});

// Create and export the Case model
module.exports = mongoose.model('Case', caseSchema);
