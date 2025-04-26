const express = require('express');
const router = express.Router();
const transactionStatusController = require('../controllers/transactionStatusController');

// PUT route to update transaction status by ID
router.put('/:transactionId/status', transactionStatusController.updateTransactionStatus);

module.exports = router;