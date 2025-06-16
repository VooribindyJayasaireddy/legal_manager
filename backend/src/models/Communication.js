const mongoose = require('mongoose');

// Define the Communication Schema
const communicationSchema = new mongoose.Schema({
  // Reference to the User (advocate) who logged this communication.
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Refers to the 'User' model
    required: true,
  },
  // Optional: Reference to the Case this communication is related to.
  case: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case', // Refers to the 'Case' model
    required: false,
  },
  // Optional: Reference to the Client this communication is related to.
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client', // Refers to the 'Client' model
    required: false,
  },
  // Type of communication (e.g., "call", "email", "meeting", "note", "SMS").
  type: {
    type: String,
    required: [true, 'Communication type is required'],
    enum: ['call', 'email', 'meeting', 'note', 'sms', 'other'], // Allowed types
    default: 'note',
  },
  // Date and time when the communication occurred.
  date: {
    type: Date,
    default: Date.now,
  },
  // Subject or brief summary of the communication.
  subject: {
    type: String,
    trim: true,
  },
  // Detailed notes or content of the communication.
  notes: {
    type: String,
    required: [true, 'Communication notes are required'],
    trim: true,
  },
  // Array of participants involved in the communication.
  participants: [
    {
      name: { type: String, trim: true },
      email: { type: String, trim: true },
      phone: { type: String, trim: true },
      role: { type: String, trim: true }, // e.g., "Client", "Opposing Counsel", "Witness"
    }
  ],
  // Optional: Array of document IDs related to this communication (e.g., attached emails, meeting minutes).
  relatedDocuments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document', // Refers to the 'Document' model
    }
  ],
}, {
  // Automatic timestamps for creation and last update.
  timestamps: true,
});

// Create and export the Communication model
module.exports = mongoose.model('Communication', communicationSchema);
