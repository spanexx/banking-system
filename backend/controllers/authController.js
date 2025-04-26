const jwt = require('jsonwebtoken');
const User = require('../models/user');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).populate('accounts'); // Populate the accounts field
  if (user && (await user.matchPassword(password))) {
    res.json({
      user: { // Include the user object
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.role === 'admin',
        accounts: user.accounts, // Include the accounts array
      },
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' },);
  }
};
