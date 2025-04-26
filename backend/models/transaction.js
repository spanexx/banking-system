const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  toAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  type: { type: String, enum: ['deposit', 'withdrawal', 'transfer'], required: true },
  amount: { type: Number, required: true },
  IBAN: { type: String, required: true }, 
  accountNumber: { type: String, required: true },
  swiftCode: { type: String, default: 'SPLYBN688', immutable: true, required: true }, 
  transactionId: { type: String, unique: true, required: true },
  date: { type: Date, required: true },
  description: { type: String },
  fromAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bankName: { type: String },
  receiverName: { type: String },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Cancelled'], default: 'Confirmed', required: true },
  requestTransferId: { type: mongoose.Schema.Types.ObjectId, ref: 'RequestTransfer' },
  cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card' }
}, { timestamps: true });

// Generate transaction ID before saving
transactionSchema.pre('save', function(next) {
  if (this.isNew) {
    this.transactionId = generateRandomId(12); // Generate a 12-character transaction ID
  }
  next();
});

const generateRandomId = (length) => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Static method to create a transaction with all necessary validations and updates
transactionSchema.statics.createTransaction = async function({
  accountId,
  receiverIdentifier,
  type, // This type is now less critical for card transactions, will be set internally
  amount,
  swiftCode,
  date,
  description,
  userId,
  isAdmin = false,
  bankName,
  receiverName,
  requestTransferId,
  cardId // Use cardId to identify card transactions
}) {
  const Account = require('./account');
  const ActivityLog = require('./activityLog');
  const Card = require('./card'); // Require Card model here

  let fromAccount = null;
  let toAccount = null;
  let transactionType = type; // Use a local variable for transaction type
  let isCardTransaction = !!cardId; // Flag to identify card transactions

  // Find the source account
  if (accountId) {
    fromAccount = await Account.findById(accountId);
    if (!fromAccount && transactionType === 'transfer') {
      throw new Error('Source account not found');
    }
  } else if (isCardTransaction) {
    const card = await Card.findById(cardId).populate('account'); // Populate 'account'
    if (!card) {
      throw new Error('Card not found');
    }
    fromAccount = card.account; // Use card.account
    if (!fromAccount) {
      throw new Error('Account linked to card not found');
    }
    transactionType = 'withdrawal'; // Set type to withdrawal for card transactions
  }

  // Determine the destination account
  let isInternationalTransfer = false;
  if (isCardTransaction) {
    // For card transactions, create a temporary account for the merchant
    toAccount = {
      _id: new mongoose.Types.ObjectId(), // Generate temporary ID
      accountNumber: receiverIdentifier, // Use merchantDetails as account number
      IBAN: `MERCHANT${receiverIdentifier}`, // Create a simple IBAN for merchant
      swiftCode: 'MERCH001', // Generic merchant SWIFT code
      bankName: 'Merchant Account', // Generic bank name for merchant
      accountHolderName: receiverIdentifier, // Use merchantDetails as receiver name
      isTemporary: true
    };
  } else if (receiverIdentifier) {
    toAccount = await Account.findOne({
      $or: [{ accountNumber: receiverIdentifier }, { IBAN: receiverIdentifier }]
    });
    if (!toAccount && transactionType === 'transfer') {
      // This is an international transfer
      isInternationalTransfer = true;
      // Create a temporary account object for the international transfer
      toAccount = {
        _id: new mongoose.Types.ObjectId(), // Generate temporary ID
        accountNumber: receiverIdentifier,
        IBAN: receiverIdentifier.startsWith('IBAN') ? receiverIdentifier : `IBAN${receiverIdentifier}`,
        swiftCode: swiftCode || 'INTBAN001', // Default international SWIFT code
        bankName: swiftCode ? `International Bank (${swiftCode})` : 'International Bank',
        accountHolderName: description ? description.split(' to ')[1] : 'International Recipient', // Try to extract recipient name from description
        isTemporary: true
      };
    } else if (!toAccount && transactionType !== 'transfer') {
      throw new Error('Account not found');
    }
  } else if (accountId && (transactionType === 'deposit' || transactionType === 'withdrawal')) {
    toAccount = await Account.findById(accountId);
    if (!toAccount) {
      throw new Error('Account not found');
    }
  }

  if (!toAccount) {
    throw new Error('Destination account not specified');
  }

  // Perform balance updates based on transaction type
  if (transactionType === 'deposit') {
    if (!isInternationalTransfer && !isCardTransaction) {
      toAccount.balance += amount;
    }
  } else if (transactionType === 'withdrawal') {
    if (fromAccount.balance < amount) { // Check fromAccount balance for withdrawal
      throw new Error('Insufficient funds');
    }
    fromAccount.balance -= amount; // Decrease fromAccount balance for withdrawal
  } else if (transactionType === 'transfer') {
    if (!fromAccount) {
      throw new Error('Source account not specified for transfer');
    }
    if (!isInternationalTransfer && fromAccount._id.equals(toAccount._id)) {
      throw new Error('Cannot transfer money to the same account');
    }
    if (fromAccount.balance < amount) {
      throw new Error('Insufficient funds');
    }
    fromAccount.balance -= amount;
    if (!isInternationalTransfer) {
      toAccount.balance += amount;
      await toAccount.save();
    }
    await fromAccount.save();
  }

  // Save account changes for withdrawals and card transactions
  if (transactionType === 'withdrawal' && fromAccount && !fromAccount.isTemporary) {
      await fromAccount.save();
  }


  if (!isInternationalTransfer && !isCardTransaction && !toAccount.isTemporary) {
    await toAccount.save();
  }

  let transactionUserId = userId;

  // If user is admin and fromAccount is specified, use fromAccount's user ID
  if (isAdmin && fromAccount) {
    const fromAccountWithUser = await Account.findById(fromAccount._id).populate('user');
    if (fromAccountWithUser && fromAccountWithUser.user) {
      transactionUserId = fromAccountWithUser.user._id;
    }
  }

  // Create and save the transaction
  const transaction = new this({
    userId: transactionUserId,
    transactionId: generateRandomId(12),
    toAccount: toAccount._id,
    type: transactionType, // Use the determined transaction type
    amount,
    IBAN: toAccount.IBAN,
    accountNumber: toAccount.accountNumber,
    swiftCode: swiftCode || toAccount.swiftCode,
    date: date ? new Date(date) : new Date(),
    description: isInternationalTransfer ?
      `${description || ''} (International transfer - Processing time: 3-7 business days)` :
      description,
    fromAccount: fromAccount ? fromAccount._id : null,
    bankName: bankName || toAccount.bankName || (isInternationalTransfer ? 'International Bank' : 'SimpliBank'),
    receiverName: receiverName || toAccount.accountHolderName || (isInternationalTransfer ? 'International Recipient' : ''),
    status: isInternationalTransfer ? 'Pending' : 'Confirmed', // Card transactions are confirmed immediately
    requestTransferId,
    cardId: cardId || null
  });

  await transaction.save();

  // Update card's transaction history if it's a card transaction
  if (isCardTransaction && cardId) {
    const card = await Card.findById(cardId);
    if (card) {
      card.transactionHistory.push(transaction._id);
      await card.save();
    }
  }


  // Create activity log with international transfer note if applicable
  await ActivityLog.create({
    user: userId,
    action: isInternationalTransfer ? 'Create International Transaction' : (isCardTransaction ? 'Create Card Transaction' : 'Create Transaction'),
    metadata: {
      transaction: transaction._id,
      isInternational: isInternationalTransfer,
      isCardTransaction: isCardTransaction
    }
  });

  // If it's an international transfer, add a message to the response
  if (isInternationalTransfer) {
    transaction._doc.message = 'International transfer initiated. Processing time: 3-7 business days.';
  }

  return transaction;
};

module.exports = mongoose.model('Transaction', transactionSchema);

module.exports = mongoose.model('Transaction', transactionSchema);

