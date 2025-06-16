const Case = require('../models/Case');
const Client = require('../models/Client'); // Required for client validation/population

// @desc    Create a new case
// @route   POST /api/cases
// @access  Private (requires authentication)
exports.createCase = async (req, res) => {
  try {
    const { caseName, caseNumber, description, clients, status, caseType, startDate, endDate, court, jurisdiction, notes, externalId } = req.body;

    // Basic validation for required fields
    if (!caseName || !caseNumber) {
      return res.status(400).json({ message: 'Case name and case number are required.' });
    }

    // Check if the case number already exists for this user
    const caseExists = await Case.findOne({ user: req.user._id, caseNumber });
    if (caseExists) {
      return res.status(400).json({ message: 'Case with this case number already exists for your account.' });
    }

    // Optional: Validate if provided client IDs actually belong to the authenticated user
    if (clients && clients.length > 0) {
      const existingClients = await Client.find({ _id: { $in: clients }, user: req.user._id });
      if (existingClients.length !== clients.length) {
        return res.status(400).json({ message: 'One or more client IDs provided are invalid or do not belong to you.' });
      }
    }

    // Create a new case instance, linking it to the authenticated user
    const newCase = new Case({
      user: req.user._id, // Populated by auth middleware
      caseName,
      caseNumber,
      description,
      clients, // Array of client ObjectIds
      status,
      caseType,
      startDate,
      endDate,
      court,
      jurisdiction,
      notes,
      externalId,
    });

    // Save the new case to the database
    const savedCase = await newCase.save();

    // Populate clients for the response if needed, otherwise just return the ID
    const populatedCase = await savedCase.populate('clients', 'firstName lastName email');

    res.status(201).json({
      message: 'Case created successfully',
      case: populatedCase
    });

  } catch (error) {
    console.error('Error creating case:', error);
    res.status(500).json({ message: 'Server error during case creation.' });
  }
};

// @desc    Get all cases for the authenticated user
// @route   GET /api/cases
// @access  Private
exports.getCases = async (req, res) => {
  try {
    // Find all cases associated with the authenticated user's ID
    // Populate client details (firstName, lastName, email) for display
    const cases = await Case.find({ user: req.user._id })
      .populate('clients', 'firstName lastName email')
      .sort({ createdAt: -1 }); // Sort by creation date, newest first

    res.status(200).json(cases);
  } catch (error) {
    console.error('Error fetching cases:', error);
    res.status(500).json({ message: 'Server error while fetching cases.' });
  }
};

// @desc    Get a single case by ID
// @route   GET /api/cases/:id
// @access  Private
exports.getCaseById = async (req, res) => {
  try {
    // Find a case by ID and ensure it belongs to the authenticated user
    const singleCase = await Case.findOne({ _id: req.params.id, user: req.user._id })
      .populate('clients', 'firstName lastName email'); // Populate client details

    if (!singleCase) {
      return res.status(404).json({ message: 'Case not found.' });
    }

    res.status(200).json(singleCase);
  } catch (error) {
    console.error('Error fetching case by ID:', error);
    res.status(500).json({ message: 'Server error while fetching case.' });
  }
};

// @desc    Update a case's information
// @route   PUT /api/cases/:id
// @access  Private
exports.updateCase = async (req, res) => {
  try {
    // Find the case by ID and ensure it belongs to the authenticated user
    let caseToUpdate = await Case.findOne({ _id: req.params.id, user: req.user._id });

    if (!caseToUpdate) {
      return res.status(404).json({ message: 'Case not found.' });
    }

    const { caseName, caseNumber, description, clients, status, caseType, startDate, endDate, court, jurisdiction, notes, externalId } = req.body;

    // Check for duplicate case number if it's being changed
    if (caseNumber && caseNumber !== caseToUpdate.caseNumber) {
      const existingCaseWithNumber = await Case.findOne({ user: req.user._id, caseNumber });
      if (existingCaseWithNumber && String(existingCaseWithNumber._id) !== req.params.id) {
        return res.status(400).json({ message: 'Another case with this case number already exists for your account.' });
      }
    }

    // Optional: Validate if provided client IDs actually belong to the authenticated user
    if (clients && clients.length > 0) {
      const existingClients = await Client.find({ _id: { $in: clients }, user: req.user._id });
      if (existingClients.length !== clients.length) {
        return res.status(400).json({ message: 'One or more client IDs provided are invalid or do not belong to you.' });
      }
    }

    // Update case fields based on the request body
    if (caseName) caseToUpdate.caseName = caseName;
    if (caseNumber) caseToUpdate.caseNumber = caseNumber;
    if (description !== undefined) caseToUpdate.description = description; // Allow null/empty string
    if (clients !== undefined) caseToUpdate.clients = clients; // Array
    if (status) caseToUpdate.status = status;
    if (caseType) caseToUpdate.caseType = caseType;
    if (startDate) caseToUpdate.startDate = startDate;
    if (endDate !== undefined) caseToUpdate.endDate = endDate; // Allow null/empty string
    if (court !== undefined) caseToUpdate.court = court;
    if (jurisdiction !== undefined) caseToUpdate.jurisdiction = jurisdiction;
    if (notes !== undefined) caseToUpdate.notes = notes;
    if (externalId !== undefined) caseToUpdate.externalId = externalId;

    // Save the updated case
    const updatedCase = await caseToUpdate.save();

    // Populate clients for the response
    const populatedUpdatedCase = await updatedCase.populate('clients', 'firstName lastName email');

    res.status(200).json({
      message: 'Case updated successfully',
      case: populatedUpdatedCase
    });

  } catch (error) {
    console.error('Error updating case:', error);
    res.status(500).json({ message: 'Server error during case update.' });
  }
};

// @desc    Delete a case
// @route   DELETE /api/cases/:id
// @access  Private
exports.deleteCase = async (req, res) => {
  try {
    // Find and delete the case by ID, ensuring it belongs to the authenticated user
    const deletedCase = await Case.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!deletedCase) {
      return res.status(404).json({ message: 'Case not found.' });
    }

    // In a full application, you would also consider:
    // 1. Deleting or re-associating documents linked ONLY to this case.
    // 2. Deleting or re-associating appointments linked ONLY to this case.
    // 3. Deleting or re-associating tasks linked ONLY to this case.
    // For simplicity, we are just deleting the case record itself here.

    res.status(200).json({ message: 'Case deleted successfully.' });

  } catch (error) {
    console.error('Error deleting case:', error);
    res.status(500).json({ message: 'Server error during case deletion.' });
  }
};
