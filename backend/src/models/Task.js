const mongoose = require('mongoose');

// Define the Task Schema
const taskSchema = new mongoose.Schema({
  // Reference to the User (advocate) who created/owns this task.
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Refers to the 'User' model
    required: true,
  },
  // Title or short description of the task.
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
  },
  // Detailed description of the task.
  description: {
    type: String,
    trim: true,
  },
  // Optional: Reference to the Case this task is related to.
  case: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case', // Refers to the 'Case' model
    required: false,
  },
  // Optional: Reference to the Client this task is related to.
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client', // Refers to the 'Client' model
    required: false,
  },
  // The due date for the task.
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
  },
  // Priority level of the task.
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'], // Allowed priority levels
    default: 'medium',
  },
  // Current status of the task.
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'on_hold', 'cancelled'], // Allowed task statuses
    default: 'pending',
  },
  // Optional: Reference to another user (e.g., a colleague or staff member) if the task is assigned.
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Can be assigned to another user in the system
    required: false, // Not required, as a task can be for the creator themselves
  },
  // Date when the task was marked as completed.
  completedAt: {
    type: Date,
  },
}, {
  // Automatic timestamps for creation and last update.
  timestamps: true,
});

// Create and export the Task model
module.exports = mongoose.model('Task', taskSchema);
