const express = require('express');
const router = express.Router();
const fileUpload = require('express-fileupload');
const path = require('path');
const {
  createSupportMessage,
  getSupportMessages,
  getSupportMessageById,
  updateSupportMessage,
  deleteSupportMessage,
  deleteManySupportMessages,
  createGuestSupportMessage,
} = require('../controllers/supportMessageController');
const { admin } = require('../middleware/adminMiddleware'); // Assuming you have auth and admin middleware
const { protect } = require('../middleware/authMiddleware'); // Assuming you have auth and admin middleware

// Configure file upload middleware
router.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  createParentPath: true,
  abortOnLimit: true
}));

// Guest route for account opening requests - no auth required
router.post('/guest', createGuestSupportMessage);

// Public route for creating a support message
router.route('/').post(protect, createSupportMessage);

// Admin private routes
router.route('/')
  .get(protect, admin, getSupportMessages) // Get all messages
  .delete(protect, admin, deleteManySupportMessages); // Delete multiple messages

router.route('/:id')
  .get(protect, admin, getSupportMessageById) // Get single message by ID
  .put(protect, admin, updateSupportMessage) // Update message by ID
  .delete(protect, admin, deleteSupportMessage); // Delete single message by ID

// Route to serve uploaded files
router.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename);
  res.sendFile(filePath);
});

module.exports = router;