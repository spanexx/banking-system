const express = require('express');
const router = express.Router();
const { createCardRequest, getPendingCardRequests, updateCardRequestStatus } = require('../controllers/requestCardController');
const { protect } = require('../middleware/authMiddleware');
const {admin} = require('../middleware/adminMiddleware');

// @desc    Request a new card
// @route   POST /api/card-requests
// @access  Private
router.post('/', protect, createCardRequest);

// @desc    Get all pending card requests (Admin)
// @route   GET /api/card-requests/pending
// @access  Private/Admin
router.get('/pending', protect, admin, getPendingCardRequests);

// @desc    Update card request status (Admin)
// @route   PUT /api/card-requests/:id
// @access  Private/Admin
router.put('/:id', protect, admin, updateCardRequestStatus);

module.exports = router;