const asyncHandler = require('express-async-handler');
const Draft = require('../models/Draft');
const User = require('../models/User');    // For populating user details
const Client = require('../models/Client'); // For populating client details
const Case = require('../models/Case');     // For populating case details

// @desc    Create a new draft
// @route   POST /api/drafts
// @access  Private
exports.createDraft = asyncHandler(async (req, res) => {
    const { title, content, draftType, clientId, caseId, status, tags } = req.body;

    // Validate required fields
    if (!title || !content) {
        res.status(400);
        throw new Error('Please include all required fields: title and content.');
    }

    // Ensure the draft is linked to the authenticated user
    const user = req.user._id;

    const draft = await Draft.create({
        user,
        title,
        content,
        draftType: draftType || undefined, // Use undefined to prevent saving empty strings if not provided
        client: clientId || undefined,
        case: caseId || undefined,
        status: status || undefined,
        tags: tags || [], // Ensure tags are an array
    });

    res.status(201).json({
        message: 'Draft created successfully',
        draft: draft,
    });
});

// @desc    Get all drafts for the authenticated user
// @route   GET /api/drafts
// @access  Private
exports.getDrafts = asyncHandler(async (req, res) => {
    const drafts = await Draft.find({ user: req.user._id })
        .populate('client', 'firstName lastName email') // Populate client details
        .populate('case', 'caseName caseNumber')       // Populate case details
        .populate('user', 'firstName lastName username') // Populate creator details
        .sort({ updatedAt: -1 }); // Sort by most recently updated drafts first

    res.status(200).json(drafts);
});

// @desc    Get a single draft by ID
// @route   GET /api/drafts/:id
// @access  Private
exports.getDraftById = asyncHandler(async (req, res) => {
    const draft = await Draft.findOne({ _id: req.params.id, user: req.user._id })
        .populate('client', 'firstName lastName email phone')
        .populate('case', 'caseName caseNumber')
        .populate('user', 'firstName lastName username');

    if (!draft) {
        res.status(404);
        throw new Error('Draft not found.');
    }

    res.status(200).json(draft);
});

// @desc    Update a draft's metadata and content
// @route   PUT /api/drafts/:id
// @access  Private
exports.updateDraft = asyncHandler(async (req, res) => {
    const { title, content, draftType, clientId, caseId, status, tags } = req.body;

    let draft = await Draft.findOne({ _id: req.params.id, user: req.user._id });

    if (!draft) {
        res.status(404);
        throw new Error('Draft not found.');
    }

    // Update fields if provided in the request body
    // Note: Use `req.body.fieldName !== undefined` to allow clearing fields (e.g., setting to empty string or null)
    if (title !== undefined) draft.title = title;
    if (content !== undefined) draft.content = content;
    if (draftType !== undefined) draft.draftType = draftType;
    if (clientId !== undefined) draft.client = clientId || null; // Allow unlinking by passing null/empty string
    if (caseId !== undefined) draft.case = caseId || null;       // Allow unlinking by passing null/empty string
    if (status !== undefined) draft.status = status;
    if (tags !== undefined) draft.tags = tags; // Expecting an array of strings from frontend

    const updatedDraft = await draft.save();

    res.status(200).json({
        message: 'Draft updated successfully',
        draft: updatedDraft,
    });
});

// @desc    Delete a draft
// @route   DELETE /api/drafts/:id
// @access  Private
exports.deleteDraft = asyncHandler(async (req, res) => {
    const draft = await Draft.findOne({ _id: req.params.id, user: req.user._id });

    if (!draft) {
        res.status(404);
        throw new Error('Draft not found.');
    }

    await Draft.deleteOne({ _id: req.params.id });

    res.status(200).json({ message: 'Draft deleted successfully.' });
});
