const Account = require('../models/account');
const ActivityLog = require('../models/activityLog');
const User = require('../models/user');
const Transaction = require('../models/transaction'); // Assuming you have a Transaction model
const { createNotification } = require('./notificationController');

exports.createAccount = async (req, res) => {
  const { userId, type, initialDeposit, bankName, accountHolderName } = req.body;

  try {
    // Create account with optional fields
    const account = await Account.create({ 
      user: userId, 
      type, 
      balance: initialDeposit || 0,
      bankName: bankName || 'SimpliBank',
      accountHolderName: accountHolderName || undefined
    });

    // Find the user and update their accounts array
    const user = await User.findById(userId);
    if (user) {
      // If no accountHolderName was provided, use the user's name
      if (!accountHolderName) {
        account.accountHolderName = user.name;
        await account.save();
      }
      user.accounts.push(account._id);
      await user.save();
    }

    await ActivityLog.create({ 
      user: req.user._id, 
      action: 'Create Account', 
      metadata: { 
        account: account._id,
        bankName: account.bankName,
        accountHolderName: account.accountHolderName
      } 
    });

    // Create a notification using the centralized function
    await createNotification(
      userId,
      'success',
      `A new ${type} account has been created for you.`
    );

    res.status(201).json(account);
  } catch (error) {
    res.status(500).json({
      message: 'Error creating account',
      error: error.message
    });
  }
};

exports.getAccounts = async (req, res) => {
  const accounts = await Account.find({ user: req.user._id });

  res.json(accounts);
};

exports.getAccountById = async (req, res) => {
  const account = await Account.findById(req.params.id);

  if (!account) {
    return res.status(404).json({ message: 'Account not found' });
  }

  if (account.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to access this account' });
  }

  res.json(account);
}



// New method to get all accounts
exports.getAccountsByUserId = async (req, res) => {
  const { userId } = req.params; // Assuming userId is passed as a URL parameter

  try {
    const accounts = await Account.find({ user: userId });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCurrentlyActiveAccountCount = async (req, res) => {
  try {
    const activeCount = await Account.countDocuments({ isActive: true });
    res.json({ count: activeCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllAccounts = async (req, res) => {
  const accounts = await Account.find(); // Fetch all accounts
  res.json(accounts);
};

exports.getAccountCountByDateRange = async (req, res) => {
  const { startDate, endDate } = req.query;
  const filter = {};

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.createdAt.$lte = new Date(endDate);
    }
  }

  try {
    const count = await Account.countDocuments(filter);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get balance change percentage for an account
exports.getBalanceChange = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('User ID:', userId);
    
    // Get current date and previous month's date
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get user's accounts
    const accounts = await Account.find({ user: userId });
    const accountIds = accounts.map(account => account._id);

    // Get transactions for the current and previous month
    const currentMonthTransactions = await Transaction.find({
      $or: [
        { fromAccount: { $in: accountIds } },
        { accountId: { $in: accountIds } }
      ],
      date: { $gte: currentMonth }
    });

    const previousMonthTransactions = await Transaction.find({
      $or: [
        { fromAccount: { $in: accountIds } },
        { accountId: { $in: accountIds } }
      ],
      date: { 
        $gte: previousMonth,
        $lte: previousMonthEnd
      }
    });

    // Calculate total balances
    const currentBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
    
    // Calculate previous month's end balance
    let previousBalance = currentBalance;
    
    // Apply all current month's transactions in reverse to get previous month's balance
    currentMonthTransactions.forEach(transaction => {
      if (transaction.type === 'deposit') {
        previousBalance -= transaction.amount;
      } else if (transaction.type === 'withdrawal' || transaction.type === 'transfer') {
        previousBalance += transaction.amount;
      }
    });

    // Calculate percentage change
    const percentageChange = previousBalance === 0 ? 
      100 : // If previous balance was 0, treat it as 100% increase
      ((currentBalance - previousBalance) / Math.abs(previousBalance)) * 100;

    res.json({ percentageChange: Number(percentageChange.toFixed(2)) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
