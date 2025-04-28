const RequestCard = require('../models/requestCard');
const User = require('../models/user');
const Account = require('../models/account');
const { createNotification } = require('./notificationController');
const { requestNewCard } = require('./cardController');

// @desc    Request a new card
// @route   POST /api/card-requests
// @access  Private
exports.createCardRequest = async (req, res) => {
  const { accountId, cardType } = req.body;
  const userId = req.user.id; // Assuming user ID is available in req.user

  try {
    // Check if the account belongs to the user
    const account = await Account.findOne({ _id: accountId, user: userId });
    if (!account) {
      return res.status(404).json({ message: 'Account not found or does not belong to the user' });
    }

    const request = new RequestCard({
      user: userId,
      account: accountId,
      cardType
    });

    await request.save();

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all pending card requests (Admin)
// @route   GET /api/card-requests/pending
// @access  Private/Admin
exports.getPendingCardRequests = async (req, res) => {
  try {
    const pendingRequests = await RequestCard.find({ status: 'pending' })
      .populate('user', 'name email') // Populate user details
      .populate('account', 'accountNumber accountType'); // Populate account details

    res.json(pendingRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update card request status (Admin)
// @route   PUT /api/card-requests/:id
// @access  Private/Admin
exports.updateCardRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const request = await RequestCard.findById(id).populate('user');

    if (!request) {
      return res.status(404).json({ message: 'Card request not found' });
    }

    request.status = status;
    await request.save();

    let notificationMessage = `Your card request for a ${request.cardType} card has been ${status}.`;
    let notificationType = status === 'approved' ? 'success' : 'info';

    if (status === 'approved') {
      // If approved, call the existing requestNewCard method with skipResponse
      const account = await Account.findById(request.account).populate('user');
      if (!account) {
        return res.status(404).json({ message: 'Account not found for the card request' });
      }

      try {
        const newCard = await requestNewCard({ 
          body: { 
            accountNumber: account.accountNumber, 
            IBAN: account.IBAN, 
            cardType: request.cardType 
          }
        }, res, true); // Add skipResponse=true parameter
        
        // Include the new card information in the response
        return res.status(200).json({ 
          message: 'Card request status updated successfully',
          card: newCard
        });
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }
    } else if (status === 'cancelled') {
      notificationType = 'error';
    }

    // Create notification for non-approved statuses
    await createNotification(
      request.user._id,
      notificationType,
      notificationMessage
    );

    res.status(200).json({ message: 'Card request status updated successfully' });

  } catch (error) {
    console.error('Error updating card request status:', error);
    res.status(500).json({ message: error.message });
  }
};