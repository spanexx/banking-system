const ActivityLog = require('../models/activityLog');

exports.getActivityLogs = async (req, res) => {
  const logs = await ActivityLog.find({ user: req.user._id }).sort('-date');
  res.json(logs);
};
