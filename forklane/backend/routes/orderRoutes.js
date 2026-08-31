const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  confirmPayment,
  getAllOrders,
  advanceOrderStatus,
  cancelOrder,
  getOrderById,
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');

// User routes
router.post('/', protect, createOrder);
router.get('/my', protect, getMyOrders);
router.put('/:id/confirm-payment', protect, confirmPayment);
router.get('/:id', protect, getOrderById);

// Admin routes
router.get('/', protect, isAdmin, getAllOrders);
router.put('/:id/status', protect, isAdmin, advanceOrderStatus);
router.put('/:id/cancel', protect, isAdmin, cancelOrder);

module.exports = router;
