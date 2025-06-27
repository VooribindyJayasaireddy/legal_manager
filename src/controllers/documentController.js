// backend/src/controllers/documentController.js

const Document = require('../models/Document');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises; // Use promises version of fs for async operations
const { existsSync, mkdirSync } = require('fs'); // Keep sync methods for startup

// Ensure the uploads directory exists (sync for startup)
const uploadDir = path.join(__dirname, '../../uploads/documents');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

// @desc    Upload a new document
// @route   POST /api/documents/upload
// @access  Private (requires authentication)
exports.uploadDocument = async (req, res) => {
  try {
    console.log('Upload request received. Files:', req.files, 'Body:', req.body);
    
    // Check if a file was uploaded by multer middleware
    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    console.log('Uploaded file details:', {
      originalname: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });

    // Ensure user is authenticated
    if (!req.user || !req.user._id) {
      console.error('User not authenticated');
      // Clean up the uploaded file if user is not authenticated
      if (req.file.path) {
        try {
          await fs.unlink(req.file.path);
          console.log('Cleaned up file after auth failure');
        } catch (err) {
          console.error('Error cleaning up file after auth failure:', err);
        }
      }
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Extract necessary data from the request
    const { originalname, filename, mimetype, size, path: filePath } = req.file;
    const { caseId, clientId, description, tags, title, documentType = 'standalone' } = req.body;
    
    console.log('Processing document upload:', {
      title,
      documentType,
      caseId,
      clientId,
      originalname,
      filename,
      mimetype,
      size
    });
    
    // Validate document type
    if (!['case', 'standalone'].includes(documentType)) {
      console.error('Invalid document type:', documentType);
      return res.status(400).json({ message: 'Invalid document type. Must be either "case" or "standalone"' });
    }
    
    // If document type is 'case', caseId is required
    if (documentType === 'case' && !caseId) {
      console.error('Case ID is required for case documents');
      return res.status(400).json({ message: 'caseId is required for case documents' });
    }
    
    // Title is required
    if (!title || typeof title !== 'string' || title.trim() === '') {
      console.error('Document title is required');
      // Clean up the uploaded file if validation fails
      if (req.file?.path) {
        try {
          await fs.promises.unlink(req.file.path);
          console.log('Cleaned up file after validation failure');
        } catch (err) {
          console.error('Error cleaning up file after validation failure:', err);
        }
      }
      return res.status(400).json({ message: 'Document title is required' });
    }
    
    const documentTitle = title.trim();

    // Ensure the uploads directory exists
    const uploadsDir = path.join(__dirname, '../../uploads/documents');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('Created uploads directory:', uploadsDir);
    }

    // Create a relative path for storage in the database
    const relativePath = path.relative(path.join(__dirname, '../../'), filePath);
    
    console.log('File paths:', {
      originalPath: filePath,
      relativePath,
      uploadsDir,
      fileExists: fs.existsSync(filePath)
    });

    // Create a new document instance
    const newDocument = new Document({
      title: documentTitle,
      user: req.user._id,
      documentType,
      case: documentType === 'case' ? caseId : null,
      client: clientId || null,
      originalName: originalname,
      fileName: filename,
      fileType: mimetype,
      filePath: relativePath, // Store relative path
      fileSize: size,
      description: description || '',
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())) : [],
      uploadedBy: req.user._id,
    });

    // Save the document to the database
    try {
      const savedDocument = await newDocument.save();
      
      res.status(201).json({
        message: 'Document uploaded successfully',
        document: savedDocument
      });
    } catch (error) {
      // If saving to DB fails, clean up the uploaded file
      if (req.file && req.file.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (err) {
          console.error('Error cleaning up file after DB error:', err);
        }
      }
      throw error; // This will be caught by the outer catch block
    }

  } catch (error) {
    console.error('Error uploading document:', error);
    
    // Clean up any uploaded file if it exists
    if (req.file && req.file.path) {
      try {
        if (existsSync(req.file.path)) {
          await fs.unlink(req.file.path);
        }
      } catch (err) {
        console.error('Error cleaning up file after error:', err);
      }
    }
    
    // Send a more detailed error message in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Error: ${error.message}` 
      : 'Server error during document upload.';
      
    res.status(500).json({ 
      message: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

// @desc    Get all documents for the authenticated user with optional filtering
// @route   GET /api/documents
// @access  Private
exports.getRecentDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ user: req.user._id })
      .populate('case', 'caseName caseNumber')
      .populate('client', 'firstName lastName')
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json(documents);
  } catch (error) {
    console.error('Error fetching recent documents:', error);
    res.status(500).json({ message: 'Server error while fetching recent documents' });
  }
};

exports.getDocuments = async (req, res) => {
  try {
    const { documentType, caseId } = req.query;
    const query = { user: req.user._id };
    
    // Apply filters if provided
    if (documentType) {
      query.documentType = documentType;
    }
    
    if (caseId) {
      query.case = caseId;
    }
    
    // Find documents based on query
    const documents = await Document.find(query)
      .populate('case', 'caseName caseNumber')
      .populate('client', 'firstName lastName')
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 }); // Sort by upload date, newest first

    res.status(200).json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ message: 'Server error while fetching documents' });
  }
};

// @desc    Get a single document by ID
// @route   GET /api/documents/:id
// @access  Private
exports.getDocumentById = async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, user: req.user._id })
      .populate('case', 'caseName caseNumber')
      .populate('client', 'firstName lastName')
      .populate('uploadedBy', 'firstName lastName username');

    if (!document) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    res.status(200).json(document);
  } catch (error) {
    console.error('Error fetching document by ID:', error);
    res.status(500).json({ message: 'Server error while fetching document.' });
  }
};

// @desc    Download a document
// @route   GET /api/documents/:id/download
// @access  Private
exports.downloadDocument = async (req, res) => {
  try {
    console.log('Download request for document ID:', req.params.id);
    
    const document = await Document.findOne({ _id: req.params.id, user: req.user._id });

    if (!document) {
      console.log('Document not found in database');
      return res.status(404).json({ message: 'Document not found.' });
    }

    console.log('Document found:', {
      id: document._id,
      fileName: document.fileName,
      filePath: document.filePath,
      originalName: document.originalName
    });

    // Normalize the file path to handle any path traversal issues
    const normalizedPath = path.normalize(document.filePath);
    // Resolve the path to ensure it's absolute and doesn't contain any '..' that could escape the uploads directory
    const resolvedPath = path.resolve(__dirname, '../../', normalizedPath);
    
    console.log('Resolved file path:', resolvedPath);

    // Check if the file exists on the disk
    if (fs.existsSync(resolvedPath)) {
      console.log('File exists, preparing download...');
      
      // Set the Content-Disposition header to prompt download
      res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
      // Set the Content-Type header to the document's MIME type
      res.setHeader('Content-Type', document.fileType);
      
      // Stream the file to the client
      const fileStream = fs.createReadStream(resolvedPath);
      fileStream.pipe(res);
      
      fileStream.on('error', (error) => {
        console.error('Error streaming file:', error);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error streaming file' });
        }
      });
      
    } else {
      console.error('File not found at path:', resolvedPath);
      res.status(404).json({ 
        message: 'File not found on server storage.',
        details: {
          resolvedPath,
          fileExists: fs.existsSync(resolvedPath),
          directory: path.dirname(resolvedPath),
          directoryExists: fs.existsSync(path.dirname(resolvedPath))
        }
      });
    }
  } catch (error) {
    console.error('Error downloading document:', {
      error: error.message,
      stack: error.stack,
      params: req.params,
      user: req.user?._id
    });
    res.status(500).json({ 
      message: 'Server error while downloading document.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update a document's metadata and optionally replace the file
// @route   PUT /api/documents/:id
// @access  Private
exports.updateDocument = async (req, res) => {
  try {
    const { title, description, tags, caseId, clientId } = req.body;
    const documentId = req.params.id;

    // Find the document
    const document = await Document.findOne({ _id: documentId, user: req.user._id });
    if (!document) {
      // Clean up uploaded file if document not found
      if (req.file && req.file.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (err) {
          console.error('Error cleaning up file after document not found:', err);
        }
      }
      return res.status(404).json({ message: 'Document not found.' });
    }

    // If a new file was uploaded
    if (req.file) {
      const { originalname, filename, mimetype, size, path: filePath } = req.file;
      
      // Delete the old file if it exists
      if (document.filePath) {
        try {
          const oldFilePath = path.join(__dirname, '../../', document.filePath);
          if (fs.existsSync(oldFilePath)) {
            await fs.unlink(oldFilePath);
          }
        } catch (err) {
          console.error('Error deleting old file:', err);
          // Don't fail the operation if file deletion fails
        }
      }

      // Update document with new file info
      document.originalName = originalname;
      document.fileName = filename;
      document.fileType = mimetype;
      document.fileSize = size;
      document.filePath = `/uploads/documents/${filename}`;
    }

    // Update other fields if provided
    if (title !== undefined) {
      if (!title || typeof title !== 'string' || title.trim() === '') {
        // Clean up uploaded file if validation fails
        if (req.file && req.file.path) {
          try {
            await fs.unlink(req.file.path);
          } catch (err) {
            console.error('Error cleaning up file after validation error:', err);
          }
        }
        return res.status(400).json({ message: 'Document title is required' });
      }
      document.title = title.trim();
    }

    if (description !== undefined) document.description = description;
    
    if (tags !== undefined) {
      document.tags = Array.isArray(tags) 
        ? tags.map(tag => typeof tag === 'string' ? tag.trim() : String(tag))
        : String(tags || '').split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    
    if (caseId !== undefined) document.case = caseId || null;
    if (clientId !== undefined) document.client = clientId || null;

    // Save the updated document
    const updatedDocument = await document.save();
    
    // Populate the updated document with related fields for the response
    const populatedDoc = await Document.findById(updatedDocument._id)
      .populate('case', 'caseName caseNumber')
      .populate('client', 'firstName lastName')
      .populate('uploadedBy', 'firstName lastName username');

    res.status(200).json({
      message: 'Document updated successfully',
      document: populatedDoc || updatedDocument
    });

  } catch (error) {
    console.error('Error updating document:', error);
    
    // Clean up uploaded file if an error occurs
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (err) {
        console.error('Error cleaning up file after error:', err);
      }
    }
    
    res.status(500).json({ 
      message: 'Server error during document update.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete a document and its file from storage
// @route   DELETE /api/documents/:id
// @access  Private
exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, user: req.user._id });

    if (!document) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    const filePath = path.join(__dirname, '../../', document.filePath);

    // Delete the file if it exists
    try {
      await fsPromises.access(filePath);
      await fsPromises.unlink(filePath);
      console.log(`File deleted from storage: ${filePath}`);
    } catch (fileError) {
      if (fileError.code === 'ENOENT') {
        console.warn(`File not found at path: ${filePath}. Proceeding with DB deletion.`);
      } else {
        console.error('Error deleting file:', fileError);
        // Don't fail the entire operation if file deletion fails
      }
    }

    // Delete the document record from the database
    await Document.deleteOne({ _id: req.params.id });

    return res.status(200).json({ message: 'Document and associated file deleted successfully.' });
  } catch (error) {
    console.error('Error in deleteDocument:', error);
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Error: ${error.message}` 
      : 'Server error during document deletion.';
      
    return res.status(500).json({ 
      message: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};
