const SupportMessage = require('../models/supportMessage');

// Create a new support message
const createMessage = async (messageData) => {
  const supportMessage = new SupportMessage(messageData);
  const createdMessage = await supportMessage.save();
  return createdMessage;
};

// Get all support messages
const getAllMessages = async () => {
  const messages = await SupportMessage.find({});
  return messages;
};

// Get a single support message by ID
const getMessageById = async (id) => {
  const message = await SupportMessage.findById(id);
  return message;
};

// Update a support message by ID
const updateMessage = async (id, updateData) => {
  const message = await SupportMessage.findById(id);

  if (message) {
    message.status = updateData.status || message.status;
    // Add other fields that can be updated if necessary

    const updatedMessage = await message.save();
    return updatedMessage;
  } else {
    return null; // Or throw an error
  }
};

// Delete a support message by ID
const deleteMessage = async (id) => {
  const message = await SupportMessage.findByIdAndDelete(id);
  return message;
};

// Delete multiple support messages by IDs
const deleteManyMessages = async (ids) => {
  const result = await SupportMessage.deleteMany({ _id: { $in: ids } });
  return result;
};

module.exports = {
  createMessage,
  getAllMessages,
  getMessageById,
  updateMessage,
  deleteMessage,
  deleteManyMessages,
};