require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

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
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:4200"],
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Authorization"]
  }
});

// Make app globally accessible for Socket.IO
global.app = app;

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Authenticate user and join their room
  socket.on('authenticate', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} authenticated and joined their room`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Make io accessible to other modules
app.set('io', io);

app.use(bodyParser.json());

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

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server Error' });
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('MongoDB connected');
    // Check if admin user exists
    const adminUser = await User.findOne({ role: 'admin' });

    if (!adminUser) {
      console.log('Admin user not found, creating...');
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (!adminEmail || !adminPassword) {
        console.error('ADMIN_EMAIL or ADMIN_PASSWORD not set in .env');
      } else {
        const name = 'Super Admin'; // Default name for admin
        const user = await User.create({
          name,
          email: adminEmail,
          password: adminPassword,
          role: 'admin'
        });
        console.log(`Admin user created with email: ${user.email}`);
      }
    } else {
      console.log('Admin user already exists.');
    }

    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error(err));
