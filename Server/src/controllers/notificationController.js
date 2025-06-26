const Appointment = require('../models/Appointment');
const Task = require('../models/Task');
const Notification = require('../models/Notification');

// @desc    Get all active reminders for the authenticated user
// @route   GET /api/notifications/reminders
// @access  Private
exports.getReminders = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    // Define a timeframe for "due soon" (e.g., within the next 2 days)
    const twoDaysFromNow = new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000));

    // --- Fetch Upcoming Appointments ---
    // Criteria:
    // 1. Belongs to the authenticated user.
    // 2. Status is 'scheduled'.
    // 3. Start time is in the future (from now up to 2 days from now).
    // 4. reminderSent flag is false (meaning reminder not yet displayed/sent).
    const upcomingAppointments = await Appointment.find({
      user: userId,
      status: 'scheduled',
      startTime: { $gte: now, $lte: twoDaysFromNow },
      reminderSent: false,
    })
    .populate('client', 'firstName lastName') // Get client name
    .populate('case', 'caseName caseNumber')  // Get case name/number
    .sort({ startTime: 1 }); // Sort by closest upcoming appointment first

    // --- Fetch Overdue / Due-Soon Tasks ---
    // Criteria:
    // 1. Belongs to the authenticated user (as creator or assignedTo).
    // 2. Status is NOT 'completed' or 'cancelled'.
    // 3. Due date is in the past (overdue) or within the next 2 days (due soon).
    // 4. reminderSent flag is false.
    const relevantTasks = await Task.find({
      $or: [{ user: userId }, { assignedTo: userId }], // Either created by user OR assigned to user
      status: { $nin: ['completed', 'cancelled'] }, // Not completed or cancelled
      dueDate: { $lte: twoDaysFromNow }, // Due date is now or in the past, or within next 2 days
      reminderSent: false,
    })
    .populate('client', 'firstName lastName')
    .populate('case', 'caseName caseNumber')
    .sort({ dueDate: 1, priority: -1 }); // Sort by closest due date, then by priority (high first)


    // Format reminders for frontend display
    const reminders = [];

    upcomingAppointments.forEach(appt => {
      let clientName = appt.client ? `${appt.client.firstName} ${appt.client.lastName}` : 'an unlinked client';
      let caseRef = appt.case ? `for case ${appt.case.caseNumber}` : '';
      let timeString = appt.startTime.toLocaleString([], {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      reminders.push({
        id: appt._id,
        type: 'appointment',
        title: appt.title,
        message: `Upcoming: ${appt.title} with ${clientName} ${caseRef} at ${timeString}`,
        date: appt.startTime, // Use original date for sorting
        entityType: 'appointment',
        entityId: appt._id,
        status: appt.status,
      });
    });

    relevantTasks.forEach(task => {
      let taskMessage = '';
      let dateString = task.dueDate.toLocaleDateString([], {
        year: 'numeric', month: 'short', day: 'numeric'
      });

      if (task.dueDate < now) {
        taskMessage = `Overdue: ${task.title} (due on ${dateString})`;
      } else {
        taskMessage = `Due Soon: ${task.title} (due on ${dateString})`;
      }

      reminders.push({
        id: task._id,
        type: 'task',
        title: task.title,
        message: taskMessage,
        date: task.dueDate, // Use original date for sorting
        entityType: 'task',
        entityId: task._id,
        status: task.status,
      });
    });

    // Sort all reminders by date (earliest first)
    reminders.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json(reminders);

  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ message: 'Server error while fetching reminders.' });
  }
};

// @desc    Get all notifications for the authenticated user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error while fetching notifications' });
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error while updating notification' });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error while updating notifications' });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Server error while deleting notification' });
  }
};

// @desc    Mark a reminder as seen/processed
// @route   PUT /api/notifications/reminders/:entityType/:entityId/seen
// @access  Private
exports.markReminderAsSeen = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const userId = req.user._id;
    let updatedDoc = null;

    if (entityType === 'appointment') {
      updatedDoc = await Appointment.findOneAndUpdate(
        { _id: entityId, user: userId }, // Ensure user owns the appointment
        { $set: { reminderSent: true } },
        { new: true } // Return the updated document
      );
    } else if (entityType === 'task') {
      // User can be creator or assignee to mark task reminder as seen
      updatedDoc = await Task.findOneAndUpdate(
        { _id: entityId, $or: [{ user: userId }, { assignedTo: userId }] },
        { $set: { reminderSent: true } },
        { new: true }
      );
    } else {
      return res.status(400).json({ message: 'Invalid entity type for reminder.' });
    }

    if (!updatedDoc) {
      return res.status(404).json({ message: `${entityType} reminder not found or you are not authorized to mark it as seen.` });
    }

    res.status(200).json({ message: `${entityType} reminder marked as seen successfully.` });

  } catch (error) {
    console.error(`Error marking ${req.params.entityType} reminder as seen:`, error);
    res.status(500).json({ message: 'Server error while marking reminder as seen.' });
  }
};
