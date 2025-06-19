// backend/src/models/Document.js

const mongoose = require('mongoose');

// Define the Document Schema
const documentSchema = new mongoose.Schema({
  // Title of the document (optional, defaults to original filename without extension)
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters'],
  },
  // Reference to the User (advocate) who owns this document.
  // This ensures that documents are tied to a specific user.
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Refers to the 'User' model
    required: true,
  },
  // Optional: Reference to the Case this document belongs to (for case-attached documents)
  case: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: false,
  },
  // Optional: Reference to the Client this document belongs to
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: false,
  },
  // Document type to distinguish between case-attached and standalone documents
  documentType: {
    type: String,
    enum: ['case', 'standalone'],
    default: 'standalone',
    required: true
  },
  // The original name of the file when it was uploaded by the user.
  originalName: {
    type: String,
    required: true,
    trim: true,
  },
  // The unique name of the file as stored on the server/storage.
  // This helps prevent naming conflicts and provides a stable reference.
  fileName: {
    type: String,
    required: true,
    unique: true, // Ensures each stored file name is unique
    trim: true,
  },
  // The MIME type of the file (e.g., "application/pdf", "image/jpeg").
  // Useful for displaying or handling different file types on the frontend.
  fileType: {
    type: String,
    required: true,
  },
  // The path or URL where the file is physically stored (e.g., './uploads/documents/').
  // In a production environment, this might be a cloud storage URL (S3, GCS).
  filePath: {
    type: String,
    required: true,
  },
  // The size of the file in bytes.
  fileSize: {
    type: Number,
    required: true,
  },
  // A brief description or notes about the document.
  description: {
    type: String,
    trim: true,
  },
  // The date and time when the document was uploaded.
  uploadDate: {
    type: Date,
    default: Date.now,
  },
  // Reference to the User (advocate) who uploaded this document.
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Optional tags for categorizing and searching documents.
  tags: [
    {
      type: String,
      trim: true,
    }
  ]
}, {
  // Mongoose will automatically add `createdAt` and `updatedAt` fields.
  timestamps: true,
});

// Create and export the Document model
module.exports = mongoose.model('Document', documentSchema);
