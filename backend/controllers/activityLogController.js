const ActivityLog = require('../models/activityLog');

exports.getActivityLogs = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const logs = await ActivityLog.find({ user: req.user._id }).sort('-date');
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
