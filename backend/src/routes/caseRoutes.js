const express = require('express');
const router = express.Router();
const caseController = require('../controllers/caseController');
const { protect } = require('../middleware/authMiddleware'); // Assuming you have an auth middleware

// --- Case Routes ---

// POST /api/cases - Create a new case
router.post('/', protect, caseController.createCase);

// GET /api/cases - Get all cases for the authenticated user
router.get('/', protect, caseController.getCases);

// GET /api/cases/:id - Get a single case by ID
router.get('/:id', protect, caseController.getCaseById);

// PUT /api/cases/:id - Update a case's information
router.put('/:id', protect, caseController.updateCase);

// DELETE /api/cases/:id - Delete a case
router.delete('/:id', protect, caseController.deleteCase);

module.exports = router;
