const RequestCard = require('../models/requestCard');
const Card = require('../models/card'); // Assuming you have a Card model
const Account = require('../models/account'); // Assuming you have an Account model
const User = require('../models/user'); // Assuming you have a User model
const { requestNewCard } = require('./cardController'); // Import the existing method

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
  const { id } = req.params;
  const { status } = req.body;

  try {
    const request = await RequestCard.findById(id);

    if (!request) {
      return res.status(404).json({ message: 'Card request not found' });
    }

    request.status = status;
    await request.save();

    // If approved, call the existing requestNewCard method
    if (status === 'approved') {
      // Fetch account details to get accountNumber and IBAN
      const account = await Account.findById(request.account);
      if (!account) {
        return res.status(404).json({ message: 'Account not found for the card request' });
      }

      // Call requestNewCard with the required parameters
      await requestNewCard({ body: { accountNumber: account.accountNumber, IBAN: account.IBAN, cardType: request.cardType }, user: { id: request.user } }, res);
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};