const express = require('express');
const router = express.Router();
const { 
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getReminders,
    markReminderAsSeen
} = require('../controllers/NotificationController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected and require authentication
router.use(protect);

// Get all notifications for the logged-in user
router.get('/', getNotifications);

// Get all reminders for the logged-in user
router.get('/reminders', getReminders);

// Mark a notification as read
router.put('/:id/read', markAsRead);

// Mark all notifications as read
router.put('/read-all', markAllAsRead);

// Delete a notification
router.delete('/:id', deleteNotification);

// Mark a reminder as seen
router.put('/reminders/:entityType/:entityId/seen', markReminderAsSeen);

module.exports = router;
