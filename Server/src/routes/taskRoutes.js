const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware'); // Assuming you have an auth middleware

// --- Task Routes ---

// POST /api/tasks - Create a new task
router.post('/', protect, taskController.createTask);

// GET /api/tasks - Get all tasks for the authenticated user
router.get('/', protect, taskController.getTasks);

// GET /api/tasks/:id - Get a single task by ID
router.get('/:id', protect, taskController.getTaskById);

// PUT /api/tasks/:id - Update a task's information
router.put('/:id', protect, taskController.updateTask);

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', protect, taskController.deleteTask);

module.exports = router;
