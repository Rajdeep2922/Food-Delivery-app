const Order = require('../models/Order');
const Product = require('../models/Product');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Valid forward status transitions
const STATUS_TRANSITIONS = {
  PLACED: 'CONFIRMED',
  CONFIRMED: 'PREPARING',
  PREPARING: 'OUT_FOR_DELIVERY',
  OUT_FOR_DELIVERY: 'DELIVERED',
};

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private (user)
const createOrder = async (req, res, next) => {
  try {
    const { items, deliveryAddress, phone, paymentMethod, couponCode } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must have at least one item' });
    }
    if (!deliveryAddress || !phone) {
      return res.status(400).json({ success: false, message: 'Delivery address and phone are required' });
    }
    if (!['COD', 'STRIPE'].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Payment method must be COD or STRIPE' });
    }

    // CRITICAL: Fetch prices from DB — never trust frontend prices
    const productIds = items.map((i) => i.product);
    const dbProducts = await Product.find({ _id: { $in: productIds } });

    if (dbProducts.length !== productIds.length) {
      return res.status(400).json({ success: false, message: 'One or more products not found' });
    }

    const productMap = {};
    dbProducts.forEach((p) => {
      productMap[p._id.toString()] = p;
    });

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const dbProduct = productMap[item.product.toString()];
      if (!dbProduct) {
        return res.status(400).json({ success: false, message: `Product ${item.product} not found` });
      }
      if (!dbProduct.isAvailable) {
        return res.status(400).json({ success: false, message: `${dbProduct.name} is currently unavailable` });
      }
      if (!item.quantity || item.quantity < 1) {
        return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
      }

      const lineTotal = dbProduct.price * item.quantity;
      totalAmount += lineTotal;

      orderItems.push({
        product: dbProduct._id,
        name: dbProduct.name,
        price: dbProduct.price, // Server-computed price
        quantity: item.quantity,
      });
    }

    // Compute delivery fee and validate coupon discount server-side
    const deliveryFee = totalAmount >= 499 ? 0 : 49;
    let discountAmount = 0;
    let validCoupon = '';

    if (couponCode && typeof couponCode === 'string') {
      const code = couponCode.toUpperCase().trim();
      if (code === 'FORKLANE') {
        discountAmount = deliveryFee > 0 ? deliveryFee : 49;
        validCoupon = 'FORKLANE';
      } else if (code === 'FEAST50') {
        discountAmount = Math.min(Math.round(totalAmount * 0.5), 150);
        validCoupon = 'FEAST50';
      } else if (code === 'WELCOME20' || code === 'WEEKEND20') {
        discountAmount = Math.round(totalAmount * 0.2);
        validCoupon = code;
      } else if ((code === 'SWEET10' || code === 'SWEET100') && totalAmount >= 299) {
        discountAmount = Math.min(100, totalAmount);
        validCoupon = code;
      }
    }

    const finalTotal = Math.max(0, totalAmount + deliveryFee - discountAmount);

    // For Stripe: create a PaymentIntent
    let stripePaymentIntentId = '';
    let clientSecret = null;

    if (paymentMethod === 'STRIPE') {
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ success: false, message: 'Stripe is not configured on this server' });
      }
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(finalTotal * 100), // in paise/cents
        currency: 'inr',
        metadata: { userId: req.user._id.toString() },
      });
      stripePaymentIntentId = paymentIntent.id;
      clientSecret = paymentIntent.client_secret;
    }

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalAmount: finalTotal,
      deliveryAddress,
      phone,
      paymentMethod,
      paymentStatus: 'PENDING',
      orderStatus: 'PLACED',
      stripePaymentIntentId,
      couponCode: validCoupon,
      discountAmount,
      deliveryFee,
    });

    const response = {
      success: true,
      message: 'Order placed successfully',
      order,
    };
    if (clientSecret) response.clientSecret = clientSecret;

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in user's orders
// @route   GET /api/orders/my
// @access  Private (user)
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product', 'name image category')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm Stripe payment (verify server-side)
// @route   PUT /api/orders/:id/confirm-payment
// @access  Private (order owner)
const confirmPayment = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Only the order owner can confirm payment
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (order.paymentMethod !== 'STRIPE') {
      return res.status(400).json({ success: false, message: 'This order is not a Stripe order' });
    }

    if (order.paymentStatus === 'PAID') {
      return res.json({ success: true, message: 'Payment already confirmed', order });
    }

    // Verify with Stripe — never trust the frontend
    const paymentIntent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      order.paymentStatus = 'PAID';
      await order.save();
      return res.json({ success: true, message: 'Payment confirmed', order });
    } else {
      order.paymentStatus = 'FAILED';
      await order.save();
      return res.status(400).json({ success: false, message: `Payment not completed. Status: ${paymentIntent.status}` });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (admin)
// @route   GET /api/orders
// @access  Admin
const getAllOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.orderStatus = status;

    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('items.product', 'name image')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Advance order status (admin)
// @route   PUT /api/orders/:id/status
// @access  Admin
const advanceOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.orderStatus === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Cannot advance a cancelled order' });
    }
    if (order.orderStatus === 'DELIVERED') {
      return res.status(400).json({ success: false, message: 'Order already delivered' });
    }

    const nextStatus = STATUS_TRANSITIONS[order.orderStatus];
    if (!nextStatus) {
      return res.status(400).json({ success: false, message: 'Cannot advance order status further' });
    }

    order.orderStatus = nextStatus;

    // For COD orders, mark payment as PAID on delivery
    if (nextStatus === 'DELIVERED' && order.paymentMethod === 'COD') {
      order.paymentStatus = 'PAID';
    }

    await order.save();
    res.json({ success: true, message: `Order status updated to ${nextStatus}`, order });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order (admin)
// @route   PUT /api/orders/:id/cancel
// @access  Admin
const cancelOrder = async (req, res, next) => {
  try {
    const { cancelReason } = req.body;

    if (!cancelReason || !cancelReason.trim()) {
      return res.status(400).json({ success: false, message: 'Cancellation reason is required' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.orderStatus === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Order is already cancelled' });
    }
    if (order.orderStatus === 'DELIVERED') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a delivered order' });
    }

    order.orderStatus = 'CANCELLED';
    order.cancelReason = cancelReason.trim();

    // Attempt Stripe refund for paid Stripe orders
    let refundResult = null;
    if (order.paymentMethod === 'STRIPE' && order.paymentStatus === 'PAID' && order.stripePaymentIntentId) {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: order.stripePaymentIntentId,
        });
        refundResult = { success: true, refundId: refund.id };
        order.paymentStatus = 'FAILED'; // Mark as refunded/failed
      } catch (stripeError) {
        refundResult = { success: false, error: stripeError.message };
      }
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled',
      order,
      ...(refundResult && { refund: refundResult }),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order by ID (for customer order details)
// @route   GET /api/orders/:id
// @access  Private (owner or admin)
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name image category');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Allow order owner or admin
    const isOwner = order.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  confirmPayment,
  getAllOrders,
  advanceOrderStatus,
  cancelOrder,
  getOrderById,
};
