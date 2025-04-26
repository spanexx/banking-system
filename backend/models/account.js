const mongoose = require('mongoose');
const Transaction = require('./transaction');

const accountSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['savings', 'checking', 'investment'], required: true },
  balance: { type: Number, default: 0 },
  accountNumber: { type: String, unique: true },
  IBAN: { type: String, unique: true },
  swiftCode: { type: String, default: 'SPLYBN688', immutable: true },
  isActive: { type: Boolean, default: true },
  cards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }],
  bankName: { type: String, default: 'SimpliBank' }, // Default to our bank name
  accountHolderName: { type: String }, // Optional field for external accounts
}, { timestamps: true });

// Generate account number and IBAN before saving
accountSchema.pre('save', function(next) {
  if (this.isNew) {
    // Simple generation logic (can be made more sophisticated)
    const generateRandomNumber = (length) => {
      let result = '';
      const characters = '0123456789';
      for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return result;
    };

    let prefix;
    switch (this.type) {
      case 'savings':
        prefix = '11';
        break;
      case 'checking':
        prefix = '54';
        break;
      case 'investment':
        prefix = '38';
        break;
      default:
        prefix = ''; // Or handle error appropriately
    }
    this.accountNumber = prefix + generateRandomNumber(10 - prefix.length); // Generate a 10-digit account number with prefix
    this.IBAN = 'LT' + generateRandomNumber(18); // Generate a simple IBAN (LT + 18 digits)
  }
  next();
});

module.exports = mongoose.model('Account', accountSchema);
