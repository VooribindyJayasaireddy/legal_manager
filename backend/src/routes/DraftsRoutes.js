const express = require('express');
const router = express.Router();
const draftController = require('../controllers/DraftController');
const { protect } = require('../middleware/authMiddleware'); // Your existing authentication middleware

// All routes in this file are protected
router.use(protect);

// GET all drafts and POST a new draft
router.route('/')
    .get(draftController.getDrafts)
    .post(draftController.createDraft);

// GET, PUT, DELETE a single draft by ID
router.route('/:id')
    .get(draftController.getDraftById)
    .put(draftController.updateDraft)
    .delete(draftController.deleteDraft);

module.exports = router;
