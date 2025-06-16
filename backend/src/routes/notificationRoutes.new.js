const express = require('express');
const router = express.Router();
const { 
    getNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
} = require('../controllers/NotificationController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected and require authentication
router.use(protect);

// Get all notifications for the logged-in user
router.route('/')
    .get(getNotifications);

// Mark a notification as read
router.route('/:id/read')
    .put(markAsRead);

// Mark all notifications as read
router.route('/read-all')
    .put(markAllAsRead);

// Delete a notification
router.route('/:id')
    .delete(deleteNotification);

module.exports = router;
