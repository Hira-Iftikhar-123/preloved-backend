const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || '*'
    : 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not defined');
  console.error('Please set MONGODB_URI in your Railway environment variables');
  process.exit(1);
}

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  // Don't exit the process, let Railway handle the health check
});

// Import API routes
const createUserRoute = require('./api/CreateUser.js');
const dataHandler = require('./api/data.js');
const adminRoutes = require('./api/adminRoutes.js');
const supportHandler = require('./api/support.js');

// API routes
app.use('/api/createuser', createUserRoute);
app.use('/api/displaydata', (req, res) => dataHandler(req, res));
app.use('/api/orderdata', (req, res) => dataHandler(req, res));
app.use('/api/recommendationdata', (req, res) => dataHandler(req, res));
app.use('/api/dressdata', (req, res) => dataHandler(req, res));
app.use('/api/admin', adminRoutes);
app.use('/api/support/tickets', (req, res) => supportHandler(req, res));
app.use('/api/support/ticket', (req, res) => supportHandler(req, res));
app.use('/api/support/chat', (req, res) => supportHandler(req, res));
app.use('/api/support/chatRoom', (req, res) => supportHandler(req, res));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Preloved API is running!',
    status: 'active',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: [
      '/api/createuser',
      '/api/displaydata', 
      '/api/orderdata',
      '/api/recommendationdata',
      '/api/dressdata',
      '/api/support/tickets',
      '/api/support/ticket',
      '/api/support/chat',
      '/api/support/chatRoom'
    ]
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Preloved Backend API',
    status: 'running',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS origin: ${process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}`);
  console.log(`Health check endpoint: http://0.0.0.0:${PORT}/api/health`);
});
