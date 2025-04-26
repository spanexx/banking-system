const Card = require('../models/card');
const Account = require('../models/account'); // Assuming you need to interact with Account model
const Transaction = require('../models/transaction'); // Assuming you need to interact with Transaction model
const CardTransaction = require('../models/cardTransaction');

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
exports.requestNewCard = async (req, res) => {
  try {
    const { accountNumber, IBAN, cardType } = req.body;

    // Basic validation
    if ((!accountNumber && !IBAN) || !cardType) {
      return res.status(400).json({ message: 'Either Account Number or IBAN, and card type are required.' });
    }

    // Find the account by account number or IBAN
    let account;
    if (accountNumber) {
      account = await Account.findOne({ accountNumber });
    } else if (IBAN) {
      account = await Account.findOne({ IBAN });
    }

    if (!account) {
      return res.status(404).json({ message: 'Account not found with the provided Account Number or IBAN.' });
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
    const cardNumber = '4' + generateRandomNumber(15); // Simple Visa-like number
    const cvv = generateRandomNumber(3); // Simple 3-digit CVV

    // Calculate expiry date (e.g., 3 years from now)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 3);

    const newCard = new Card({
      account: account._id,
      cardNumber,
      cardType,
      expiryDate,
      cvv, // In a real application, handle CVV securely (encryption, not storing, etc.)
    });

    await newCard.save();

    // Optionally, add the new card's ID to the associated account
    account.cards.push(newCard._id);
    await account.save();


    res.status(201).json(newCard);
  } catch (error) {
    console.error('Error in requestNewCard:', error); // Log the error on the backend
    res.status(500).json({ message: 'Internal Server Error', error: error.message }); // Include error message in response
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

    const card = await Card.findByIdAndUpdate(cardId, { isFrozen }, { new: true });

    if (!card) {
      return res.status(404).json({ message: 'Card not found.' });
    }

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
    console.log(transactions); 
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