const Task = require('../models/Task');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (requires authentication)
exports.createTask = async (req, res) => {
  try {
    const { title, description, case: caseId, client, dueDate, priority, status, assignedTo } = req.body;

    // Basic validation for required fields
    if (!title || !dueDate) {
      return res.status(400).json({ message: 'Title and due date are required for a task.' });
    }

    // Convert string date to Date object
    const due = new Date(dueDate);
    if (isNaN(due.getTime())) { // Check if date is valid
      return res.status(400).json({ message: 'Invalid due date format.' });
    }

    // Create a new task instance
    const newTask = new Task({
      user: req.user._id, // Authenticated user's ID (the creator)
      title,
      description,
      case: caseId, // Use 'caseId' for consistency with frontend naming, maps to 'case' field in model
      client,
      dueDate: due,
      priority,
      status,
      assignedTo: assignedTo || req.user._id, // Default to creator if not explicitly assigned
    });

    // Save the new task to the database
    const savedTask = await newTask.save();

    res.status(201).json({
      message: 'Task created successfully',
      task: savedTask
    });

  } catch (error) {
    console.error('Error creating task:', error);
    if (error.name === 'ValidationError') {
      // Mongoose validation errors
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error during task creation.' });
  }
};

// @desc    Get all tasks for the authenticated user
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    // Find all tasks associated with the authenticated user's ID (as creator OR assignee)
    // For now, we'll fetch tasks where the user is the creator. You might expand this
    // to include tasks assigned to the user, if applicable.
    const tasks = await Task.find({ user: req.user._id })
      .populate('case', 'caseName caseNumber') // Populate case details
      .populate('client', 'firstName lastName') // Populate client details
      .populate('assignedTo', 'firstName lastName username') // Populate assignee details
      .sort({ dueDate: 1, priority: -1 }); // Sort by due date ascending, then priority descending

    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error while fetching tasks.' });
  }
};

// @desc    Get a single task by ID
// @route   GET /api/tasks/:id
// @access  Private
exports.getTaskById = async (req, res) => {
  try {
    // Find a task by ID and ensure it belongs to the authenticated user (as creator or assignee)
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id }) // Primary check for creator
      .populate('case', 'caseName caseNumber')
      .populate('client', 'firstName lastName')
      .populate('assignedTo', 'firstName lastName username');

    if (!task) {
      // If not found by user as creator, check if user is the assignee
      const assignedTask = await Task.findOne({ _id: req.params.id, assignedTo: req.user._id })
        .populate('case', 'caseName caseNumber')
        .populate('client', 'firstName lastName')
        .populate('assignedTo', 'firstName lastName username');

      if (!assignedTask) {
        return res.status(404).json({ message: 'Task not found or you do not have access.' });
      }
      return res.status(200).json(assignedTask);
    }

    res.status(200).json(task);
  } catch (error) {
    console.error('Error fetching task by ID:', error);
    res.status(500).json({ message: 'Server error while fetching task.' });
  }
};

// @desc    Update a task's information
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    // Find the task by ID and ensure it belongs to the authenticated user (as creator)
    // Consider adding `assignedTo: req.user._id` here if assignees can also update.
    let task = await Task.findOne({ _id: req.params.id, user: req.user._id });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or you are not the creator.' });
    }

    const { title, description, case: caseId, client, dueDate, priority, status, assignedTo, completedAt } = req.body;

    // Convert string date to Date object if it's being updated
    const updatedDueDate = dueDate ? new Date(dueDate) : task.dueDate;
    if (dueDate && isNaN(updatedDueDate.getTime())) {
      return res.status(400).json({ message: 'Invalid due date format.' });
    }

    // Update fields if provided in the request body
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (caseId !== undefined) task.case = caseId || null;
    if (client !== undefined) task.client = client || null;
    if (dueDate !== undefined) task.dueDate = updatedDueDate;
    if (priority !== undefined) task.priority = priority;
    if (status !== undefined) task.status = status;
    if (assignedTo !== undefined) task.assignedTo = assignedTo || null; // Allow null to unassign
    if (status === 'completed' && !task.completedAt) {
      task.completedAt = new Date(); // Set completedAt if task is marked complete and not already set
    } else if (status !== 'completed' && task.completedAt) {
      task.completedAt = undefined; // Clear completedAt if status changes from completed
    }
    if (completedAt !== undefined) task.completedAt = completedAt; // Allow explicit override

    const updatedTask = await task.save();

    res.status(200).json({
      message: 'Task updated successfully',
      task: updatedTask
    });

  } catch (error) {
    console.error('Error updating task:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error during task update.' });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
  try {
    // Only the creator can delete the task
    const deletedTask = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!deletedTask) {
      return res.status(404).json({ message: 'Task not found or you are not authorized to delete it.' });
    }

    res.status(200).json({ message: 'Task deleted successfully.' });

  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Server error during task deletion.' });
  }
};
