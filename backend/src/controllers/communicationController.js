const Communication = require('../models/Communication');

// @desc    Create a new communication log
// @route   POST /api/communications
// @access  Private (requires authentication)
exports.createCommunication = async (req, res) => {
  try {
    const { type, date, subject, notes, client, case: caseId, participants, relatedDocuments } = req.body;

    // Basic validation for required fields
    if (!type || !notes) {
      return res.status(400).json({ message: 'Communication type and notes are required.' });
    }

    // Convert string date to Date object
    const commDate = date ? new Date(date) : new Date();
    if (isNaN(commDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format for communication.' });
    }

    // Create a new communication instance
    const newCommunication = new Communication({
      user: req.user._id, // Authenticated user's ID
      type,
      date: commDate,
      subject,
      notes,
      client,
      case: caseId, // Maps to 'case' field in model
      participants: participants || [], // Ensure participants is an array
      relatedDocuments: relatedDocuments || [], // Ensure relatedDocuments is an array
    });

    // Save the new communication to the database
    const savedCommunication = await newCommunication.save();

    res.status(201).json({
      message: 'Communication log created successfully',
      communication: savedCommunication
    });

  } catch (error) {
    console.error('Error creating communication log:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error during communication log creation.' });
  }
};

// @desc    Get all communication logs for the authenticated user
// @route   GET /api/communications
// @access  Private
exports.getCommunications = async (req, res) => {
  try {
    // Find all communications associated with the authenticated user's ID
    const communications = await Communication.find({ user: req.user._id })
      .populate('client', 'firstName lastName email') // Populate client details
      .populate('case', 'caseName caseNumber')       // Populate case details
      .populate('relatedDocuments', 'originalName fileType') // Populate document details
      .sort({ date: -1 }); // Sort by most recent first

    res.status(200).json(communications);
  } catch (error) {
    console.error('Error fetching communication logs:', error);
    res.status(500).json({ message: 'Server error while fetching communication logs.' });
  }
};

// @desc    Get a single communication log by ID
// @route   GET /api/communications/:id
// @access  Private
exports.getCommunicationById = async (req, res) => {
  try {
    const communication = await Communication.findOne({ _id: req.params.id, user: req.user._id })
      .populate('client', 'firstName lastName email')
      .populate('case', 'caseName caseNumber')
      .populate('relatedDocuments', 'originalName fileType');

    if (!communication) {
      return res.status(404).json({ message: 'Communication log not found.' });
    }

    res.status(200).json(communication);
  } catch (error) {
    console.error('Error fetching communication log by ID:', error);
    res.status(500).json({ message: 'Server error while fetching communication log.' });
  }
};

// @desc    Update a communication log's information
// @route   PUT /api/communications/:id
// @access  Private
exports.updateCommunication = async (req, res) => {
  try {
    let communication = await Communication.findOne({ _id: req.params.id, user: req.user._id });

    if (!communication) {
      return res.status(404).json({ message: 'Communication log not found.' });
    }

    const { type, date, subject, notes, client, case: caseId, participants, relatedDocuments } = req.body;

    // Convert string date to Date object if it's being updated
    const updatedDate = date ? new Date(date) : communication.date;
    if (date && isNaN(updatedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format for communication.' });
    }

    // Update fields if provided in the request body
    if (type !== undefined) communication.type = type;
    if (date !== undefined) communication.date = updatedDate;
    if (subject !== undefined) communication.subject = subject;
    if (notes !== undefined) communication.notes = notes;
    if (client !== undefined) communication.client = client || null;
    if (caseId !== undefined) communication.case = caseId || null;
    if (participants !== undefined) communication.participants = participants;
    if (relatedDocuments !== undefined) communication.relatedDocuments = relatedDocuments;

    const updatedCommunication = await communication.save();

    res.status(200).json({
      message: 'Communication log updated successfully',
      communication: updatedCommunication
    });

  } catch (error) {
    console.error('Error updating communication log:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error during communication log update.' });
  }
};

// @desc    Delete a communication log
// @route   DELETE /api/communications/:id
// @access  Private
exports.deleteCommunication = async (req, res) => {
  try {
    const deletedCommunication = await Communication.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!deletedCommunication) {
      return res.status(404).json({ message: 'Communication log not found.' });
    }

    res.status(200).json({ message: 'Communication log deleted successfully.' });

  } catch (error) {
    console.error('Error deleting communication log:', error);
    res.status(500).json({ message: 'Server error during communication log deletion.' });
  }
};
