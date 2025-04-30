require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const accountRoutes = require('./routes/accountRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');
const transferRequestRoutes = require('./routes/transferRequestRoutes');
const supportMessageRoutes = require('./routes/supportMessageRoutes');
const cardRoutes = require('./routes/cardRoutes');
const requestCardRoutes = require('./routes/requestCardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const User = require('./models/user');

const app = express();
const server = http.createServer(app);

// CORS configuration
const corsOptions = {
  origin: ["https://banking.spanexx.com", "http://localhost:4200", "https://banking-api-cdtx.onrender.com"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Authorization", "Content-Type", "Origin", "Accept"],
  exposedHeaders: ["Content-Length", "X-Requested-With"],
  optionsSuccessStatus: 200,
  preflightContinue: false,
  maxAge: 86400 // 24 hours
};

// Apply CORS middleware before other middleware
app.use(cors(corsOptions));

// Apply other middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin" }
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Socket.IO setup with security
const io = new Server(server, {
  cors: corsOptions,
  path: '/socket.io',
  serveClient: false,
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  }
});

// Create notifications namespace
const notificationsNamespace = io.of('/notifications');

// WebSocket connection handling for notifications
notificationsNamespace.on('connection', (socket) => {
  console.log('Client connected to notifications namespace');
  
  socket.on('authenticate', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} authenticated and joined room`);
    }
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  socket.on('disconnect', (reason) => {
    console.log('Client disconnected, reason:', reason);
  });
});

// Make io instance accessible to the rest of the app
app.set('io', io);

// Body parser configuration
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/transfer-requests', transferRequestRoutes);
app.use('/api/support', supportMessageRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/card-requests', requestCardRoutes);
app.use('/api/notifications', notificationRoutes);

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

// Handle client-side routing - must be after API routes and before error handlers
app.get('*', (req, res) => {
  // Don't redirect API calls
  if (!req.url.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, 'frontend/dist/frontend/browser/index.html'));
  }
});

// Start server
const PORT = process.env.PORT || 3000;
connectWithRetry().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
});
