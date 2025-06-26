const express = require('express');
const router = express.Router();
const { 
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getReminders,
  markReminderAsSeen
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// Apply authentication middleware to all notification routes
router.use(protect);

// @route   GET /api/notifications
// @desc    Get all notifications for the authenticated user
// @access  Private
router.get('/', getNotifications);

// @route   GET /api/notifications/reminders
// @desc    Get all active reminders (appointments and tasks) for the user
// @access  Private
router.get('/reminders', getReminders);

// @route   PUT /api/notifications/:id/read
// @desc    Mark a specific notification as read
// @access  Private
router.put('/:id/read', markAsRead);

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read for the authenticated user
// @access  Private
router.put('/read-all', markAllAsRead);

// @route   DELETE /api/notifications/:id
// @desc    Delete a specific notification
// @access  Private
router.delete('/:id', deleteNotification);

// @route   PUT /api/notifications/reminders/:entityType/:entityId/seen
// @desc    Mark a specific reminder as seen/processed
// @access  Private
router.put('/reminders/:entityType/:entityId/seen', markReminderAsSeen);

module.exports = router;
