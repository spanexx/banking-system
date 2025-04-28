const Notification = require('../models/notification');
const notificationService = require('../services/notificationService'); // Import the service

// Helper function to emit notification via WebSocket
const emitNotification = async (notification) => {
  try {
    const io = global.app.get('io');
    if (io) {
      io.to(`user_${notification.userId}`).emit('new_notification', notification);
    }
  } catch (error) {
    console.error('Error emitting notification:', error);
  }
};

// Create a notification
exports.createNotification = async (userId, type, message) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      message,
      time: new Date(),
      read: false
    });

    // Emit the notification via WebSocket
    await emitNotification(notification);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Fetch notifications for the authenticated user
exports.getNotifications = async (req, res) => {
  try {
    // Assuming user ID is available in req.user.id after authentication middleware
    const notifications = await notificationService.getNotificationsByUserId(req.user.id);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Fetch notifications for a specific user ID via API endpoint
exports.getNotificationsForUser = async (req, res) => {
  try {
    const userId = req.params.userId; // Assuming userId is passed as a URL parameter
    // Optional: Add authorization check here if needed, e.g., check if req.user.id is an admin or the requested userId
    // if (req.user.id !== userId && !req.user.isAdmin) {
    //   return res.status(403).json({ message: 'Not authorized to access notifications for this user' });
    // }
    const notifications = await notificationService.getNotificationsByUserId(userId);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark a specific notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    // Ensure the notification belongs to the authenticated user
    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this notification' });
    }
    notification.read = true;
    await notification.save();
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark all notifications for the user as read
exports.markAllRead = async (req, res) => {
  try {
    // Assuming user ID is available in req.user.id after authentication middleware
    await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Fetch a specific notification by ID for the authenticated user
exports.getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    // Ensure the notification belongs to the authenticated user
    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this notification' });
    }
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a specific notification
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Ensure the notification belongs to the authenticated user
    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this notification' });
    }

    await notification.deleteOne();
    res.json({ message: 'Notification deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};