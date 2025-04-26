const mongoose = require('mongoose');

const supportMessageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[0-9]{10}$/, 'Please fill a valid phone number (10 digits)']
  },
  address: {
    type: String,
    trim: true
  },
  dob: {
    type: Date
  },
  password: {
    type: String,
    trim: true,
    minlength: [8, 'Password should be at least 8 characters long']
  },
  accountType: {
    type: String,
    enum: ['savings', 'checking', 'business'],
    trim: true
  },
  image: {
    type: String,  // Store base64 image data
    validate: {
      validator: function(v) {
        // Basic validation for base64 image data
        if (!v) return true; // Allow empty
        return v.startsWith('data:image');
      },
      message: 'Invalid image format'
    }
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  metadata: { // Added metadata field
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    dob: { type: Date },
    accountType: { type: String, enum: ['savings', 'checking', 'business'], trim: true },
    identificationDocument: { type: String } // Store image URL/path
  },
  message: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['support', 'account-request'],
    default: 'support'
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'closed'],
    default: 'open'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
supportMessageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const SupportMessage = mongoose.model('SupportMessage', supportMessageSchema);

module.exports = SupportMessage;