const express = require('express');
const router = express.Router();
const { createRequest, verifyRequest, getTransferRequests, manageTransferRequest, deleteTransferRequest } = require('../controllers/transferRequestController');
const { protect } = require('../middleware/authMiddleware');
const {admin} = require('../middleware/adminMiddleware');




router.use(protect); // Protect all routes below this middleware

router.post('/', createRequest);
router.post('/verify', verifyRequest);

// Admin routes - apply adminProtect middleware
router.put('/:id/manage', admin, manageTransferRequest); // Route for managing transfer requests (approve/reject)
router.delete('/:id', admin, deleteTransferRequest); // Route for deleting transfer requests
router.get('/', admin, getTransferRequests); // Route for getting transfer requests


module.exports = router;