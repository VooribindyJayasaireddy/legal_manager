// backend/src/routes/documentRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const documentController = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../config/multerConfig');
const path = require('path');
const fs = require('fs');

// --- Multer Configuration ---
// We're using the imported multerConfig, but keeping this for reference
const uploadSingle = upload.single('file');
const uploadDocumentFile = upload.single('documentFile');

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files. Only one file allowed per request.' });
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Unexpected field in form data. Please check the field name.' });
    }
    return res.status(400).json({ message: 'File upload error: ' + err.message });
  } else if (err) {
    // An unknown error occurred
    console.error('File upload error:', err);
    return res.status(500).json({ message: 'An error occurred while uploading the file.' });
  }
  // No errors, proceed to the next middleware
  next();
};

// --- Document Routes ---

// POST /api/documents/upload - Upload a new document (standalone or case-attached)
// Expects multipart/form-data with file and metadata
router.post(
  '/upload', 
  protect, 
  (req, res, next) => {
    console.log('File upload request received');
    uploadSingle(req, res, (err) => {
      if (err) {
        console.error('File upload error:', err);
        return handleMulterError(err, req, res, next);
      }
      next();
    });
  },
  documentController.uploadDocument
);

// GET /api/documents/recent - Get recent documents
router.get('/recent', protect, documentController.getRecentDocuments);

// GET /api/documents - Get documents with optional filtering
// Query params: documentType (case|standalone), caseId
router.get('/', protect, documentController.getDocuments);

// GET /api/documents/:id - Get a single document by ID
router.get('/:id', protect, documentController.getDocumentById);

// GET /api/documents/:id/download - Download a document
router.get('/:id/download', protect, documentController.downloadDocument);

// PUT /api/documents/:id - Update document metadata and optionally replace the file
router.put(
  '/:id',
  protect,
  (req, res, next) => {
    // Log request info for debugging
    console.log('Document update request received');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    
    // If this is a multipart/form-data request, use multer to handle the file upload
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
      return uploadDocumentFile(req, res, (err) => {
        if (err) {
          console.error('File upload error during update:', err);
          return handleMulterError(err, req, res, next);
        }
        next();
      });
    }
    
    // Otherwise, proceed to the controller
    next();
  },
  documentController.updateDocument
);

// DELETE /api/documents/:id - Delete a document and its file
router.delete('/:id', protect, documentController.deleteDocument);

module.exports = router;
