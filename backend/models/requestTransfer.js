const mongoose = require('mongoose');
const crypto = require('crypto');

const requestTransferSchema = new mongoose.Schema({
  fromAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  toAccount: { type: String, required: true }, // Can be account number or IBAN
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  description: { type: String },
  swiftCode: { type: String, default: 'SPLYBN688' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  code: { type: String, required: true },
  codeExpires: { type: Date, required: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bankName: { type: String },
  accountHolderName: { type: String }
}, { timestamps: true });

// Generate verification code before save if new
requestTransferSchema.pre('validate', function(next) {
  if (this.isNew) {
    // Generate a 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();
    this.code = code;
    
    // Set expiration to 10 minutes from now
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 10);
    this.codeExpires = expiryTime;
  }
  next();
});

// Validate IBAN or account number format
requestTransferSchema.path('toAccount').validate(function(value) {
  // Basic IBAN format check (simplified)
  const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,}$/;
  // Basic account number check (simplified)
  const accountRegex = /^[0-9]{8,}$/;
  
  return ibanRegex.test(value) || accountRegex.test(value);
}, 'Invalid IBAN or account number format');

module.exports = mongoose.model('TransferRequest', requestTransferSchema);