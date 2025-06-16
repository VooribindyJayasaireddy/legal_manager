const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { protect } = require('../middleware/authMiddleware');

// --- Client Routes ---

// GET /api/clients/search - Search clients by name or email
router.get('/search', protect, clientController.searchClients);

// POST /api/clients - Create a new client
router.post('/', protect, clientController.createClient);

// GET /api/clients - Get all clients for the authenticated user
router.get('/', protect, clientController.getClients);

// GET /api/clients/:id - Get a single client by ID
router.get('/:id', protect, clientController.getClientById);

// PUT /api/clients/:id - Update a client's information
router.put('/:id', protect, clientController.updateClient);

// DELETE /api/clients/:id - Delete a client
router.delete('/:id', protect, clientController.deleteClient);

module.exports = router;
