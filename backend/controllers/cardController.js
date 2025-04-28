const Card = require('../models/card');
const Account = require('../models/account');
const Transaction = require('../models/transaction');
const CardTransaction = require('../models/cardTransaction');
const { createNotification } = require('./notificationController');

// Get all cards associated with a specific account
exports.getCardsByAccountId = async (req, res) => {
  try {
    const accountId = req.params.accountId;
    const cards = await Card.find({ account: accountId }).populate('transactionHistory');
    res.status(200).json(cards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Request a new card for a user/account
exports.requestNewCard = async (req, res, skipResponse = false) => {
  try {
    const { accountNumber, IBAN, cardType } = req.body;

    // Basic validation
    if ((!accountNumber && !IBAN) || !cardType) {
      if (!skipResponse) {
        return res.status(400).json({ message: 'Either Account Number or IBAN, and card type are required.' });
      }
      throw new Error('Either Account Number or IBAN, and card type are required.');
    }

    // Find the account by account number or IBAN
    let account;
    if (accountNumber) {
      account = await Account.findOne({ accountNumber }).populate('user');
    } else if (IBAN) {
      account = await Account.findOne({ IBAN }).populate('user');
    }

    if (!account) {
      if (!skipResponse) {
        return res.status(404).json({ message: 'Account not found with the provided Account Number or IBAN.' });
      }
      throw new Error('Account not found with the provided Account Number or IBAN.');
    }

    // Generate unique card number and CVV (simplified for now)
    const generateRandomNumber = (length) => {
      let result = '';
      const characters = '0123456789';
      for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return result;
    };
    const cardNumber = '4' + generateRandomNumber(15);
    const cvv = generateRandomNumber(3);

    // Calculate expiry date (e.g., 3 years from now)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 3);

    const newCard = new Card({
      account: account._id,
      cardNumber,
      cardType,
      expiryDate,
      cvv,
    });

    await newCard.save();

    account.cards.push(newCard._id);
    await account.save();

    // Create a notification for the user whose card was created
    await createNotification(
      account.user._id,
      'success',
      `Your new ${cardType} card has been requested successfully.`
    );

    if (!skipResponse) {
      res.status(201).json(newCard);
    }
    
    return newCard;
  } catch (error) {
    console.error('Error in requestNewCard:', error);
    if (!skipResponse) {
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
    throw error;
  }
};

// Freeze or unfreeze a specific card
exports.toggleFreezeCard = async (req, res) => {
  try {
    const cardId = req.params.cardId;
    const { isFrozen } = req.body;

    if (typeof isFrozen !== 'boolean') {
      return res.status(400).json({ message: 'isFrozen must be a boolean value.' });
    }

    const card = await Card.findById(cardId).populate({
      path: 'account',
      populate: { path: 'user' }
    });

    if (!card) {
      return res.status(404).json({ message: 'Card not found.' });
    }

    card.isFrozen = isFrozen;
    await card.save();

    // Create a notification for the user whose card was frozen/unfrozen
    await createNotification(
      card.account.user._id,
      isFrozen ? 'warning' : 'success',
      `Your card (${card.cardNumber.slice(-4)}) has been ${isFrozen ? 'frozen' : 'unfrozen'}.`
    );

    res.status(200).json(card);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update card settings (e.g., limits)
exports.updateCardSettings = async (req, res) => {
  try {
    const cardId = req.params.cardId;
    const { dailyLimit } = req.body; // Add other settings as needed

    const card = await Card.findByIdAndUpdate(cardId, { dailyLimit }, { new: true });

    if (!card) {
      return res.status(404).json({ message: 'Card not found.' });
    }

    res.status(200).json(card);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get transaction history for a specific card
exports.getCardTransactions = async (req, res) => {
  try {
    const cardId = req.params.cardId;
    // Assuming transactions have a reference to the card used
    const transactions = await CardTransaction.find({ card: cardId }).populate('card'); 
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get available credit for a credit card (if applicable)
exports.getAvailableCredit = async (req, res) => {
  try {
    const cardId = req.params.cardId;
    const card = await Card.findById(cardId).populate('transactionHistory');

    if (!card) {
      return res.status(404).json({ message: 'Card not found.' });
    }

    if (card.cardType !== 'Credit') {
      return res.status(400).json({ message: 'Available credit is only applicable to credit cards.' });
    }

    if (card.creditLimit === null || card.creditLimit === undefined) {
       return res.status(400).json({ message: 'Credit limit not set for this card.' });
    }

    // Calculate outstanding balance from transactions
    let outstandingBalance = 0;
    if (card.transactionHistory && card.transactionHistory.length > 0) {
      outstandingBalance = card.transactionHistory.reduce((sum, transaction) => {
        // Assuming transaction has 'type' (e.g., 'debit', 'credit') and 'amount' fields
        if (transaction.type === 'debit') {
          return sum + transaction.amount;
        }
        return sum;
      }, 0);
    }

    const availableCredit = card.creditLimit - outstandingBalance;

    res.status(200).json({ availableCredit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get credit limit for a credit card (if applicable)
exports.getCreditLimit = async (req, res) => {
  try {
    const cardId = req.params.cardId;
    const card = await Card.findById(cardId);

    if (!card) {
      return res.status(404).json({ message: 'Card not found.' });
    }

    if (card.cardType !== 'Credit') {
      return res.status(400).json({ message: 'Credit limit is only applicable to credit cards.' });
    }

    if (card.creditLimit === null || card.creditLimit === undefined) {
       return res.status(400).json({ message: 'Credit limit not set for this card.' });
    }

    res.status(200).json({ creditLimit: card.creditLimit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};