const mongoose = require('mongoose');

const requestCardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  cardType: { type: String, enum: ['debit', 'credit'], required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  requestDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('RequestCard', requestCardSchema);