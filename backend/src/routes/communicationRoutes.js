const express = require('express');
const router = express.Router();
const communicationController = require('../controllers/communicationController');
const { protect } = require('../middleware/authMiddleware'); // Assuming you have an auth middleware

// --- Communication Routes ---

// POST /api/communications - Create a new communication log
router.post('/', protect, communicationController.createCommunication);

// GET /api/communications - Get all communication logs for the authenticated user
router.get('/', protect, communicationController.getCommunications);

// GET /api/communications/:id - Get a single communication log by ID
router.get('/:id', protect, communicationController.getCommunicationById);

// PUT /api/communications/:id - Update a communication log's information
router.put('/:id', protect, communicationController.updateCommunication);

// DELETE /api/communications/:id - Delete a communication log
router.delete('/:id', protect, communicationController.deleteCommunication);

module.exports = router;
