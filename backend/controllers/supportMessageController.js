const supportMessageService = require('../services/supportMessageService');
const path = require('path');
const SupportMessage = require('../models/supportMessage'); // Fixed case sensitivity

// @desc    Create a new support message
// @route   POST /api/support
// @access  Public
const createSupportMessage = async (req, res) => {
  try {
    console.log('Received support message request');
    
    // Validate required fields
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        details: {
          name: !name ? 'Name is required' : null,
          email: !email ? 'Email is required' : null,
          subject: !subject ? 'Subject is required' : null,
          message: !message ? 'Message is required' : null
        }
      });
    }

    // Handle image data
    if (req.body.image && req.body.image.length > 10485760) { // 10MB limit
      return res.status(400).json({ message: 'Image size should be less than 10MB' });
    }

    // Create the support message
    const createdMessage = await supportMessageService.createMessage({
      ...req.body,
      status: 'open' // Ensure status is set to open for new messages
    });

    console.log('Support message created successfully');
    res.status(201).json(createdMessage);
  } catch (error) {
    console.error('Error creating support message:', error);
    res.status(500).json({ 
      message: 'Error creating support message', 
      error: error.message,
      details: error.errors // Include mongoose validation errors if any
    });
  }
};

// @desc    Get all support messages
// @route   GET /api/support
// @access  Private (Admin)
const getSupportMessages = async (req, res) => {
  try {
    const messages = await supportMessageService.getAllMessages();
    res.json(messages);
  } catch (error) {
    console.error('Error getting support messages:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single support message by ID
// @route   GET /api/support/:id
// @access  Private (Admin)
const getSupportMessageById = async (req, res) => {
  try {
    const message = await supportMessageService.getMessageById(req.params.id);
    if (message) {
      res.json(message);
    } else {
      res.status(404).json({ message: 'Support message not found' });
    }
  } catch (error) {
    console.error('Error getting support message:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a support message
// @route   PUT /api/support/:id
// @access  Private (Admin)
const updateSupportMessage = async (req, res) => {
  try {
    const updatedMessage = await supportMessageService.updateMessage(req.params.id, req.body);
    if (updatedMessage) {
      res.json(updatedMessage);
    } else {
      res.status(404).json({ message: 'Support message not found' });
    }
  } catch (error) {
    console.error('Error updating support message:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a support message
// @route   DELETE /api/support/:id
// @access  Private (Admin)
const deleteSupportMessage = async (req, res) => {
  try {
    const message = await supportMessageService.deleteMessage(req.params.id);
    if (message) {
      res.json({ message: 'Support message removed' });
    } else {
      res.status(404).json({ message: 'Support message not found' });
    }
  } catch (error) {
    console.error('Error deleting support message:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete multiple support messages
// @route   DELETE /api/support
// @access  Private (Admin)
const deleteManySupportMessages = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of message IDs to delete' });
    }

    const result = await supportMessageService.deleteManyMessages(ids);
    if (result.deletedCount > 0) {
      res.json({ message: `${result.deletedCount} support messages removed` });
    } else {
      res.status(404).json({ message: 'No support messages found with the provided IDs' });
    }
  } catch (error) {
    console.error('Error deleting multiple support messages:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a guest support message
// @route   POST /api/support/guest
// @access  Public
const createGuestSupportMessage = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      dob,
      password,
      accountType,
      message,
      subject,
      messageType
    } = req.body;

    // Basic validation
    if (!name || !email || !phone || !address || !dob || !password || !accountType) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    let imageUrl = null;
    if (req.files && req.files.image) {
      const file = req.files.image;
      const uploadPath = path.join(__dirname, '../uploads/', file.name);
      await file.mv(uploadPath);
      imageUrl = `/uploads/${file.name}`;
    }

    // Create the support message for account opening request
    const supportMessage = await SupportMessage.create({
      name,
      email,
      subject,
      message,
      status: 'open',
      messageType,
      metadata: {
        phone,
        address,
        dob,
        accountType,
        identificationDocument: imageUrl
      }
    });

    res.status(201).json(supportMessage);
  } catch (error) {
    console.error('Error in createGuestSupportMessage:', error);
    res.status(500).json({ message: 'Error creating support message' });
  }
};

module.exports = {
  createSupportMessage,
  getSupportMessages,
  getSupportMessageById,
  updateSupportMessage,
  deleteSupportMessage,
  deleteManySupportMessages,
  createGuestSupportMessage,
};