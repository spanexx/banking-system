const express = require('express');
const router = express.Router();
const { createRequest, verifyTransferRequest, getTransferRequests, manageTransferRequest, deleteTransferRequest } = require('../controllers/transferRequestController');
const { protect } = require('../middleware/authMiddleware');
const {admin} = require('../middleware/adminMiddleware');

router.use(protect); // Protect all routes below this middleware

router.post('/', createRequest);
router.post('/verify', verifyTransferRequest); // Verification endpoint
router.get('/verify/:requestId', verifyTransferRequest); // GET endpoint for verification

// Admin routes - apply adminProtect middleware
router.put('/:id/manage', admin, manageTransferRequest);
router.delete('/:id', admin, deleteTransferRequest);
router.get('/', admin, getTransferRequests);

module.exports = router;