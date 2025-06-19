// backend/src/routes/documentRoutes.js

const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware'); // Assuming you have an auth middleware
const multer = require('multer');
const path = require('path');
const crypto = require('crypto'); // For generating unique filenames
const fs = require('fs');

// --- Multer Configuration for File Uploads ---
// Define storage for files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Files will be stored in 'backend/uploads/documents'
    const uploadPath = path.join(__dirname, '../../uploads/documents');
    // Ensure the directory exists
    // fs.mkdirSync(uploadPath, { recursive: true }); // This should ideally be handled once on server start
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename using a timestamp and a random string
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(8).toString('hex');
    // Get the file extension from the original file name
    const extname = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extname);
  }
});

// Filter to allow only certain file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx|ppt|pptx/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only images (jpeg, jpg, png) and documents (pdf, doc, docx, xls, xlsx, ppt, pptx) are allowed!'));
};

// Initialize multer upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { 
    fileSize: 1024 * 1024 * 10, // 10MB file size limit
    files: 1 // Limit to 1 file per request
  }
});

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
  upload.single('file'),
  handleMulterError,
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
      return upload.single('documentFile')(req, res, next);
    }
    
    // Otherwise, proceed to the controller
    next();
  },
  handleMulterError,
  documentController.updateDocument
);

// DELETE /api/documents/:id - Delete a document and its file
router.delete('/:id', protect, documentController.deleteDocument);

module.exports = router;
