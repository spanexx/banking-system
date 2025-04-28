const Notification = require('../models/notification');

// Fetch notifications for a specific user ID
exports.getNotificationsByUserId = async (userId) => {
  try {
    const notifications = await Notification.find({ userId }).sort({ time: -1 });
    return notifications;
  } catch (error) {
    console.error('Error fetching notifications by user ID from service:', error);
    throw error;
  }
};