const admin = (req, res, next) => {
  // Assuming user information is attached to req.user by a preceding auth middleware
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

module.exports = { admin };