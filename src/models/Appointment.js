const mongoose = require('mongoose');

// Define the Appointment Schema
const appointmentSchema = new mongoose.Schema({
  // Reference to the User (advocate) who created/owns this appointment.
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Refers to the 'User' model
    required: true,
  },
  // Title or subject of the appointment.
  title: {
    type: String,
    required: [true, 'Appointment title is required'],
    trim: true,
  },
  // Detailed description of the appointment.
  description: {
    type: String,
    trim: true,
  },
  // Optional: Reference to the Client associated with this appointment.
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client', // Refers to the 'Client' model
    required: false,
  },
  // Optional: Reference to the Case associated with this appointment.
  case: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case', // Refers to the 'Case' model
    required: false,
  },
  // Start date and time of the appointment.
  startTime: {
    type: Date,
    required: [true, 'Start time is required'],
  },
  // End date and time of the appointment.
  endTime: {
    type: Date,
    required: [true, 'End time is required'],
  },
  // Location of the appointment (e.g., "Courtroom 3", "Client's Office", "Zoom Call").
  location: {
    type: String,
    trim: true,
  },
  // Array of other participants in the appointment (beyond the primary user, client, case).
  attendees: [
    {
      name: { type: String, trim: true },
      email: { type: String, trim: true },
      phone: { type: String, trim: true },
      role: { type: String, trim: true }, // e.g., "Opposing Counsel", "Witness", "Colleague"
    }
  ],
  // Current status of the appointment.
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
    default: 'scheduled',
  },
  // Flag to indicate if a reminder has been sent for this appointment (useful for future reminder features).
  reminderSent: {
    type: Boolean,
    default: false,
  },
}, {
  // Automatic timestamps for creation and last update.
  timestamps: true,
});

// Add a validation to ensure endTime is after startTime
appointmentSchema.path('endTime').validate(function(value) {
  return this.startTime <= value;
}, 'End time must be after start time.');

// Create and export the Appointment model
module.exports = mongoose.model('Appointment', appointmentSchema);
