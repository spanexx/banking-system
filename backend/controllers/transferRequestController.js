const RequestTransfer = require('../models/requestTransfer');
const Transaction = require('../models/transaction');
const ActivityLog = require('../models/activityLog');
const { createNotification } = require('./notificationController');
const Account = require('../models/account');
const nodemailer = require('nodemailer');


// Configure mailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify transporter connection
transporter.verify(function(error, success) {
  if (error) {
    console.log('SMTP connection error:', error);
  } else {
    console.log('SMTP server is ready');
  }
});

// @desc    Create transfer request and send verification code
// @route   POST /api/transfer-requests
// @access  Private
exports.createRequest = async (req, res) => {
  try {
    const { fromAccountId, toAccount, amount, description, bankName, accountHolderName } = req.body;
    
    if (!fromAccountId || !toAccount || !amount) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        details: {
          fromAccountId: !fromAccountId ? 'From account is required' : null,
          toAccount: !toAccount ? 'To account is required' : null,
          amount: !amount ? 'Amount is required' : null
        }
      });
    }

    // Check if fromAccount exists and belongs to user
    const fromAccount = await Account.findOne({ 
      _id: fromAccountId,
      user: req.user._id 
    });

    if (!fromAccount) {
      return res.status(404).json({ message: 'Source account not found or unauthorized' });
    }

    // Check sufficient balance
    if (fromAccount.balance < amount) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }

    // Create pending request
    const transferRequest = await RequestTransfer.create({
      requestedBy: req.user._id,
      fromAccount: fromAccountId,
      toAccount: toAccount,
      amount,
      description,
      date: new Date(),
      swiftCode: fromAccount.swiftCode || 'SPLYBN688',
      bankName: bankName || 'SimpliBank',
      accountHolderName: accountHolderName || 'International Recipient'
    });

    console.log('Transfer request created:', transferRequest);

    try {
      // Send email with code
      const userEmail = req.user.email;
      console.log('Sending email to:', userEmail);
      
      await transporter.sendMail({
        from: {
          name: 'SimpliBank Transfers',
          address: process.env.SMTP_FROM
        },
        to: userEmail,
        subject: 'Your Transfer Verification Code',
        text: `Your verification code is ${transferRequest.code}. It expires in 10 minutes.`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #1565c0; color: white; padding: 20px; text-align: center; }
                .code { font-size: 32px; font-weight: bold; color: #1565c0; text-align: center; padding: 20px; }
                .details { background-color: #f5f5f5; padding: 20px; border-radius: 5px; }
                .warning { color: #d32f2f; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Transfer Verification Code</h1>
                </div>
                <p>Please use the following code to verify your transfer. This code will expire in 10 minutes.</p>
                <div class="code">${transferRequest.code}</div>
                <div class="details">
                  <h3>Transfer Details:</h3>
                  <ul>
                    <li>Amount: $${amount.toFixed(2)}</li>
                    <li>To Account: ${toAccount}</li>
                    <li>Description: ${description || 'N/A'}</li>
                  </ul>
                </div>
                <p class="warning">If you did not request this transfer, please contact our support team immediately.</p>
              </div>
            </body>
          </html>
        `
      });

      console.log('Verification email sent successfully');
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Continue with the process even if email fails
    }

    await ActivityLog.create({
      user: req.user._id,
      action: 'Requested Transfer',
      metadata: { transferRequest: transferRequest._id }
    });

    res.status(201).json({
      message: 'Transfer request created successfully',
      requestId: transferRequest._id,
      code: transferRequest.code // For testing only, remove in production
    });
  } catch (error) {
    console.error('Transfer request error:', error);
    res.status(500).json({ 
      message: 'Error creating transfer request', 
      error: error.message,
      details: error.errors // Include validation errors if any
    });
  }
};

// @desc    Verify transfer code and execute transaction
// @route   POST /api/transfer-requests/verify
// @access  Private
exports.verifyTransferRequest = async (req, res) => {
  const { code } = req.body;
  const transfer = await RequestTransfer.findOne({ 
    requestedBy: req.user._id, 
    status: 'pending',
    verificationCodeExpiry: { $gt: new Date() }
  });

  if (!transfer) {
    return res.status(404).json({ message: 'No pending transfer request found or verification code expired' });
  }
  
  if (transfer.code !== code) {
    return res.status(400).json({ message: 'Invalid verification code' });
  }

  try {
    // Execute the transaction using the static method
    const transaction = await Transaction.createTransaction({
      accountId: transfer.fromAccount,
      receiverIdentifier: transfer.toAccount,
      type: 'transfer',
      amount: transfer.amount,
      description: transfer.description,
      swiftCode: transfer.swiftCode,
      date: new Date(),
      userId: req.user._id,
      bankName: transfer.bankName || 'SimpliBank',
      receiverName: transfer.accountHolderName || 'International Recipient',
      requestTransferId: transfer._id
    });

    // Update transfer request status
    transfer.status = 'approved';
    await transfer.save();

    // Create a notification using the centralized function
    await createNotification(
      req.user._id,
      'success',
      `Your transfer request to ${transfer.toAccount} for ${transfer.amount} has been approved.`
    );

    await ActivityLog.create({
      user: req.user._id,
      action: 'Verified Transfer',
      metadata: { 
        transferRequest: transfer._id,
        transaction: transaction._id,
        isInternational: transaction._doc?.message ? true : false,
        bankName: transfer.bankName,
        receiverName: transfer.accountHolderName
      }
    });

    res.json({ 
      message: transaction._doc?.message || 'Transfer completed successfully',
      transaction,
      isInternational: !!transaction._doc?.message
    });

  } catch (error) {
    transfer.status = 'failed';
    await transfer.save();

    // Create a failure notification using the centralized function
    await createNotification(
      req.user._id,
      'error',
      `Your transfer request to ${transfer.toAccount} for ${transfer.amount} has failed.`
    );

    res.status(400).json({ message: error.message });
  }
};

// @desc    Get transfer requests for logged in user
// @route   GET /api/transfer-requests
// @access  Private
exports.getTransferRequests = async (req, res) => {
  try {
    const transferRequests = await RequestTransfer.find({}).sort({ date: -1 });
    res.json(transferRequests);
  } catch (error) {
    console.error('Error fetching transfer requests:', error);
    res.status(500).json({ message: 'Error fetching transfer requests', error: error.message });
  }
};

// @desc    Manage transfer request (approve/reject)
// @route   PUT /api/transfer-requests/:id/manage
// @access  Private/Admin
exports.manageTransferRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const transferRequest = await RequestTransfer.findById(id);
    if (!transferRequest) {
      return res.status(404).json({ message: 'Transfer request not found' });
    }

    if (status === 'approved') {
      const transaction = await Transaction.createTransaction({
        accountId: transferRequest.fromAccount,
        receiverIdentifier: transferRequest.toAccount,
        type: 'transfer',
        amount: transferRequest.amount,
        description: transferRequest.description,
        swiftCode: transferRequest.swiftCode,
        date: new Date(),
        userId: transferRequest.requestedBy,
        bankName: transferRequest.bankName || 'SimpliBank',
        receiverName: transferRequest.accountHolderName || 'International Recipient',
        requestTransferId: transferRequest._id
      });

      transferRequest.status = 'approved';
      await transferRequest.save();

      // Create an approval notification using the centralized function
      await createNotification(
        transferRequest.requestedBy,
        'success',
        `Your transfer request to ${transferRequest.toAccount} for ${transferRequest.amount} has been approved by an admin.`
      );

      await ActivityLog.create({
        user: req.user._id,
        action: 'Managed Transfer (Approved)',
        metadata: {
          transferRequest: transferRequest._id,
          transaction: transaction._id,
          isInternational: transaction._doc?.message ? true : false,
          bankName: transferRequest.bankName,
          receiverName: transferRequest.accountHolderName,
          managedBy: req.user._id
        }
      });

      res.json({
        message: transaction._doc?.message || 'Transfer request approved and transaction completed successfully',
        transaction,
        isInternational: !!transaction._doc?.message
      });
    } else if (status === 'rejected') {
      transferRequest.status = 'rejected';
      await transferRequest.save();

      // Create a rejection notification using the centralized function
      await createNotification(
        transferRequest.requestedBy,
        'error',
        `Your transfer request to ${transferRequest.toAccount} for ${transferRequest.amount} has been rejected by an admin.`
      );

      await ActivityLog.create({
        user: req.user._id,
        action: 'Managed Transfer (Rejected)',
        metadata: {
          transferRequest: transferRequest._id,
          managedBy: req.user._id
        }
      });

      res.json({
        message: 'Transfer request rejected successfully',
        transferRequest
      });
    } else {
      res.status(400).json({ message: 'Invalid status provided' });
    }
  } catch (error) {
    console.error('Error managing transfer request:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete transfer request
// @route   DELETE /api/transfer-requests/:id
// @access  Private/Admin
exports.deleteTransferRequest = async (req, res) => {
  try {
    const transferRequest = await RequestTransfer.findById(req.params.id);

    if (!transferRequest) {
      return res.status(404).json({ message: 'Transfer request not found' });
    }

    // Optional: Add checks if the request can be deleted based on its status
    // if (transferRequest.status !== 'pending' && transferRequest.status !== 'failed') {
    //   return res.status(400).json({ message: `Cannot delete transfer request with status ${transferRequest.status}` });
    // }

    await transferRequest.deleteOne();

    await ActivityLog.create({
      user: req.user._id, // Logged by the admin user
      action: 'Deleted Transfer Request',
      metadata: {
        transferRequest: transferRequest._id,
        deletedBy: req.user._id
      }
    });

    res.json({ message: 'Transfer request deleted successfully' });
  } catch (error) {
    console.error('Error deleting transfer request:', error);
    res.status(500).json({ message: 'Error deleting transfer request', error: error.message });
  }
};