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
const { admin } = require('./middleware/adminMiddleware');

const app = express();
const server = http.createServer(app);

// Trust proxy - Add this before any middleware
app.set('trust proxy', 1);

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

// Rate limiting with proxy configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  trustProxy: true // Trust the X-Forwarded-For header
});

// Apply CORS middleware before other middleware
app.use(cors(corsOptions));

// Apply other middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin" }
}));
app.use(compression());

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

// API Info endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Banking System API',
    frontendUrl: 'https://banking.spanexx.com',
    adminUrl: 'https://spanexx.com',
    version: '1.0.0',
    description: 'A comprehensive banking system API with real-time notifications',
    status: 'online',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      authentication: {
        base: '/api/auth',
        routes: [
          'POST /api/auth/register - Register a new user',
          'POST /api/auth/login - Login user',
          'POST /api/auth/refresh - Refresh authentication token',
          'POST /api/auth/logout - Logout user'
        ]
      },
      users: {
        base: '/api/users',
        routes: [
          'GET /api/users/profile - Get user profile',
          'PUT /api/users/profile - Update user profile',
          'GET /api/users - Get all users (admin only)',
          'DELETE /api/users/:id - Delete user (admin only)'
        ]
      },
      accounts: {
        base: '/api/accounts',
        routes: [
          'GET /api/accounts - Get user accounts',
          'POST /api/accounts - Create new account',
          'GET /api/accounts/:id - Get specific account',
          'PUT /api/accounts/:id - Update account'
        ]
      },
      transactions: {
        base: '/api/transactions',
        routes: [
          'GET /api/transactions - Get transactions',
          'POST /api/transactions - Create transaction',
          'GET /api/transactions/:id - Get specific transaction',
          'PUT /api/transactions/:id/status - Update transaction status'
        ]
      },
      transferRequests: {
        base: '/api/transfer-requests',
        routes: [
          'GET /api/transfer-requests - Get transfer requests',
          'POST /api/transfer-requests - Create transfer request',
          'PUT /api/transfer-requests/:id - Update transfer request'
        ]
      },
      cards: {
        base: '/api/cards',
        routes: [
          'GET /api/cards - Get user cards',
          'POST /api/cards - Create new card',
          'PUT /api/cards/:id - Update card',
          'DELETE /api/cards/:id - Delete card'
        ]
      },
      cardRequests: {
        base: '/api/card-requests',
        routes: [
          'GET /api/card-requests - Get card requests',
          'POST /api/card-requests - Create card request',
          'PUT /api/card-requests/:id - Update card request status'
        ]
      },
      support: {
        base: '/api/support',
        routes: [
          'GET /api/support - Get support messages',
          'POST /api/support - Create support message',
          'PUT /api/support/:id - Update support message'
        ]
      },
      notifications: {
        base: '/api/notifications',
        routes: [
          'GET /api/notifications - Get user notifications',
          'PUT /api/notifications/:id/read - Mark notification as read',
          'DELETE /api/notifications/:id - Delete notification'
        ]
      },
      activityLogs: {
        base: '/api/activity-logs',
        routes: [
          'GET /api/activity-logs - Get activity logs'
        ]
      }
    },
    features: [
      'JWT Authentication',
      'Role-based Access Control',
      'Real-time Notifications via WebSocket',
      'Rate Limiting',
      'CORS Security',
      'File Upload Support',
      'MongoDB Integration',
      'Activity Logging'
    ],
    websocket: {
      path: '/socket.io',
      namespaces: [
        '/notifications - Real-time notifications'
      ]
    },
    rateLimit: {
      windowMs: '15 minutes',
      maxRequests: 100,
      message: 'Rate limit exceeded'
    },
    cors: {
      allowedOrigins: corsOptions.origin,
      allowedMethods: corsOptions.methods
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version
  });
});

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
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});


// Database connection with retry mechanism
const connectWithRetry = async () => {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
      });
      console.log('MongoDB connected successfully');
      
      // Check/create admin user after successful connection
      const adminUser = await User.findOne({ role: 'admin' });
      if (!adminUser && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
        await User.create({
          name: 'Super Admin',
          email: process.env.ADMIN_EMAIL,
          password: process.env.ADMIN_PASSWORD,
          role: 'admin'
        });
        console.log('Admin user created successfully');
      }
      
      break;
    } catch (error) {
      retries += 1;
      console.error(`MongoDB connection attempt ${retries} failed:`, error.message);
      if (retries === maxRetries) {
        console.error('Max retries reached. Could not connect to MongoDB');
        process.exit(1);
      }
      // Wait for 5 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

// Start server
const PORT = process.env.PORT || 5000;
connectWithRetry().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
});
