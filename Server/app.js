require('colors');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const express = require('express');
const connectDB = require('./src/config/connectDB');

// Load environment variables from .env file
dotenv.config();

// Create Express app
const app = express();

// --- Middleware --
const allowedOrigins = process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',') : [];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cache', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  optionsSuccessStatus: 204
};

// Enable CORS with the specified options
app.use(cors(corsOptions));

// API Documentation Route
app.get('/api', (req, res) => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  const apiDocs = {
    message: 'Legal Manager API',
    version: '1.0.0',
    endpoints: {
      healthCheck: `${baseUrl}/api/health`,
      auth: {
        login: `${baseUrl}/api/auth/login`,
        register: `${baseUrl}/api/auth/register`,
        forgotPassword: `${baseUrl}/api/auth/forgotpassword`,
        resetPassword: `${baseUrl}/api/auth/resetpassword`,
        verifyToken: `${baseUrl}/api/auth/verify-token`,
        me: `${baseUrl}/api/auth/me`
      },
      clients: `${baseUrl}/api/clients`,
      documents: `${baseUrl}/api/documents`,
      cases: `${baseUrl}/api/cases`,
      appointments: `${baseUrl}/api/appointments`,
      tasks: `${baseUrl}/api/tasks`,
      users: `${baseUrl}/api/users`,
      notifications: `${baseUrl}/api/notifications`,
      ai: `${baseUrl}/api/ai`
    }
  };
  res.json(apiDocs);
});

app.use(express.json({
  limit: '10mb',
  strict: true
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Handle preflight requests
app.options('*', cors(corsOptions));

// --- Routes ---
const authRoutes = require('./src/routes/authRoutes');
const clientRoutes = require('./src/routes/clientRoutes');
const documentRoutes = require('./src/routes/documentRoutes');
const caseRoutes = require('./src/routes/caseRoutes');
const appointmentRoutes = require('./src/routes/appointmentRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const userRoutes = require('./src/routes/userRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const aiRoutes = require('./src/routes/aiRoutes');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);

// Health check route
app.listen(5000, '0.0.0.0', () => {
  console.log("Server running on port 5000");
});
// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Backend is running' });
});



// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack.red);
  res.status(500).json({ message: 'Server Error' });
});

// Serve static files from React in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build/index.html'));
  });
}

// Connect to DB & start server
(async () => {
  await connectDB();

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`.yellow.bold);
    console.log(`Running in ${process.env.NODE_ENV || 'development'} mode`.cyan);
  });
})();