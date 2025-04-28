const User = require('../models/user');
const ActivityLog = require('../models/activityLog');
const { createNotification } = require('./notificationController');

exports.createUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) return res.status(400).json({ message: 'User already exists' });
  const user = await User.create({ name, email, password, role });

  // Create a notification using the centralized function
  await createNotification(
    user._id,
    'info',
    `Welcome to SimpliBank, ${name}! Your account has been created successfully.`
  );

  await ActivityLog.create({ user: req.user._id, action: 'Create User', metadata: { createdUser: user._id } });
  res.status(201).json(user);
};

exports.getUsers = async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
};

exports.getUserById = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

exports.deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  await user.deleteOne();
  await ActivityLog.create({ user: req.user._id, action: 'Delete User', metadata: { deletedUser: req.params.id } });
  res.json({ message: 'User removed' });
};

exports.getUserCountByDateRange = async (req, res) => {
  const { startDate, endDate } = req.query;
  const filter = {};

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.createdAt.$lte = new Date(endDate);
    }
  }

  try {
    const count = await User.countDocuments(filter);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getActiveUserCount = async (req, res) => {
  try {
    const activeUsers = await ActivityLog.aggregate([
      {
        $match: {
          action: 'Create Transaction'
        }
      },
      {
        $group: {
          _id: '$user'
        }
      },
      {
        $count: 'activeUserCount'
      }
    ]);
    const count = activeUsers.length > 0 ? activeUsers[0].activeUserCount : 0;
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
