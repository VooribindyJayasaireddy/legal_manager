const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

// --- Appointment Routes ---

// POST /api/appointments - Create a new appointment
router.post('/', protect, appointmentController.createAppointment);

// GET /api/appointments - Get all appointments for the authenticated user
router.get('/', protect, appointmentController.getAppointments);

// GET /api/appointments/:id - Get a single appointment by ID
router.get('/:id', protect, appointmentController.getAppointmentById);

// PUT /api/appointments/:id - Update an appointment's information
router.put('/:id', protect, appointmentController.updateAppointment);

// DELETE /api/appointments/:id - Delete an appointment
router.delete('/:id', protect, appointmentController.deleteAppointment);

module.exports = router;
