const express = require('express');
const router = express.Router();
const cardController = require('../controllers/cardController');
const { protect } = require('../middleware/authMiddleware'); 


router.use(protect); 
// GET /api/cards/:accountId - Get all cards associated with a specific account.
router.get('/:accountId', cardController.getCardsByAccountId);

// POST /api/cards/request - Request a new card for a user/account.
router.post('/request', cardController.requestNewCard);

// PUT /api/cards/:cardId/freeze - Freeze or unfreeze a specific card.
router.put('/:cardId/freeze', cardController.toggleFreezeCard);

// PUT /api/cards/:cardId/settings - Update card settings (e.g., limits).
router.put('/:cardId/settings', cardController.updateCardSettings);

// GET /api/cards/:cardId/transactions - Get transaction history for a specific card.
router.get('/:cardId/transactions', cardController.getCardTransactions);

// GET /api/cards/:cardId/available-credit - Get available credit for a credit card (if applicable).
router.get('/:cardId/available-credit', cardController.getAvailableCredit);

// GET /api/cards/:cardId/credit-limit - Get credit limit for a credit card (if applicable).
router.get('/:cardId/credit-limit', cardController.getCreditLimit);

module.exports = router;