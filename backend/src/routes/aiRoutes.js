const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware'); // Your existing authentication middleware

router.use(protect); // All AI routes are protected

// POST /api/ai/chat - General AI chat
router.post('/chat', aiController.handleChatQuery);

// POST /api/ai/extract - Extract structured information via AI
router.post('/extract', aiController.extractInformation);

module.exports = router;
