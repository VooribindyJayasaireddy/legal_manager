// Main backend application file
require('colors');
const dotenv = require('dotenv');
const cors = require('cors'); // Import CORS
const path = require('path'); // For serving static files
const express = require('express');
const connectDB = require('./src/config/db');

// Load environment variables from .env file
dotenv.config();

// Create Express app
const app = express();

// --- Connect to MongoDB ---
connectDB();

// --- Middleware ---
// Enable CORS for all routes - IMPORTANT for frontend-backend communication
app.use(cors());

// Body parser for JSON data
app.use(express.json());

// Serve static files (like uploaded documents) from the 'uploads' directory
// This makes files at backend/uploads accessible via /uploads in your frontend
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Routes ---
// Import your routes
const authRoutes = require('./src/routes/authRoutes'); // User authentication routes
const clientRoutes = require('./src/routes/clientRoutes'); // Client management routes
const documentRoutes = require('./src/routes/documentRoutes'); // Document management routes
const caseRoutes = require('./src/routes/caseRoutes'); // Case management routes
const appointmentRoutes = require('./src/routes/appointmentRoutes'); // Appointment management routes
const taskRoutes = require('./src/routes/taskRoutes'); // Task management routes
const userRoutes = require('./src/routes/userRoutes'); // User management routes
const communicationRoutes = require('./src/routes/communicationRoutes'); // Communication management routes
const notificationRoutes = require('./src/routes/notificationRoutes'); // Notification management routes
const draftRoutes = require('./src/routes/DraftsRoutes'); // Draft management routes
const aiRoutes = require('./src/routes/aiRoutes'); // AI routes

// Use your routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/appointments', appointmentRoutes); // Appointment management routes
app.use('/api/tasks', taskRoutes); // Task management routes
app.use('/api/users', userRoutes); // User management routes
app.use('/api/communications', communicationRoutes); // Communication management routes
app.use('/api/notifications', notificationRoutes); // Notification management routes
app.use('/api/drafts', draftRoutes); // Draft management routes
app.use('/api/ai', aiRoutes); // AI routes

// Basic route for checking server status
app.get('/', (req, res) => {
  res.send('API is running...');
});

// --- Error Handling Middleware (Optional but recommended) ---
// This middleware catches errors from async routes
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// --- Start Server ---
const PORT = process.env.PORT || 5000; // Use port from .env or default to 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
