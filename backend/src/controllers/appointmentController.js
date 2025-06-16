const Appointment = require('../models/Appointment');

// @desc    Create a new appointment
// @route   POST /api/appointments
// @access  Private (requires authentication)
exports.createAppointment = async (req, res) => {
  try {
    const { title, description, client, case: caseId, startTime, endTime, location, attendees, status } = req.body;

    // Basic validation for required fields
    if (!title || !startTime || !endTime) {
      return res.status(400).json({ message: 'Title, start time, and end time are required for an appointment.' });
    }

    // Convert string dates to Date objects
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Validate time sequence
    if (start >= end) {
      return res.status(400).json({ message: 'End time must be after start time.' });
    }

    // Create a new appointment instance
    const newAppointment = new Appointment({
      user: req.user._id, // Authenticated user's ID
      title,
      description,
      client,
      case: caseId, // Use 'caseId' for consistency with frontend naming, maps to 'case' field in model
      startTime: start,
      endTime: end,
      location,
      attendees,
      status,
    });

    // Save the new appointment to the database
    const savedAppointment = await newAppointment.save();

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment: savedAppointment
    });

  } catch (error) {
    console.error('Error creating appointment:', error);
    if (error.name === 'ValidationError') {
      // Mongoose validation errors
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error during appointment creation.' });
  }
};

// @desc    Get all appointments for the authenticated user
// @route   GET /api/appointments
// @access  Private
exports.getAppointments = async (req, res) => {
  try {
    // Find all appointments associated with the authenticated user's ID
    // Populate client and case details for display on frontend
    const appointments = await Appointment.find({ user: req.user._id })
      .populate('client', 'firstName lastName email') // Populate client details
      .populate('case', 'caseName caseNumber') // Populate case details
      .sort({ startTime: 1 }); // Sort by start time ascending

    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Server error while fetching appointments.' });
  }
};

// @desc    Get a single appointment by ID
// @route   GET /api/appointments/:id
// @access  Private
exports.getAppointmentById = async (req, res) => {
  try {
    // Find an appointment by ID and ensure it belongs to the authenticated user
    const appointment = await Appointment.findOne({ _id: req.params.id, user: req.user._id })
      .populate('client', 'firstName lastName email')
      .populate('case', 'caseName caseNumber');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    res.status(200).json(appointment);
  } catch (error) {
    console.error('Error fetching appointment by ID:', error);
    res.status(500).json({ message: 'Server error while fetching appointment.' });
  }
};

// @desc    Update an appointment's information
// @route   PUT /api/appointments/:id
// @access  Private
exports.updateAppointment = async (req, res) => {
  try {
    let appointment = await Appointment.findOne({ _id: req.params.id, user: req.user._id });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    const { title, description, client, case: caseId, startTime, endTime, location, attendees, status, reminderSent } = req.body;

    // Convert string dates to Date objects if they are being updated
    const updatedStartTime = startTime ? new Date(startTime) : appointment.startTime;
    const updatedEndTime = endTime ? new Date(endTime) : appointment.endTime;

    // Validate time sequence for updated times
    if (updatedStartTime >= updatedEndTime) {
      return res.status(400).json({ message: 'End time must be after start time.' });
    }

    // Update fields if provided in the request body
    if (title !== undefined) appointment.title = title;
    if (description !== undefined) appointment.description = description;
    if (client !== undefined) appointment.client = client || null; // Allow null to unlink
    if (caseId !== undefined) appointment.case = caseId || null; // Allow null to unlink
    if (startTime !== undefined) appointment.startTime = updatedStartTime;
    if (endTime !== undefined) appointment.endTime = updatedEndTime;
    if (location !== undefined) appointment.location = location;
    if (attendees !== undefined) appointment.attendees = attendees;
    if (status !== undefined) appointment.status = status;
    if (reminderSent !== undefined) appointment.reminderSent = reminderSent;

    const updatedAppointment = await appointment.save();

    res.status(200).json({
      message: 'Appointment updated successfully',
      appointment: updatedAppointment
    });

  } catch (error) {
    console.error('Error updating appointment:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error during appointment update.' });
  }
};

// @desc    Delete an appointment
// @route   DELETE /api/appointments/:id
// @access  Private
exports.deleteAppointment = async (req, res) => {
  try {
    const deletedAppointment = await Appointment.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!deletedAppointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    res.status(200).json({ message: 'Appointment deleted successfully.' });

  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ message: 'Server error during appointment deletion.' });
  }
};
