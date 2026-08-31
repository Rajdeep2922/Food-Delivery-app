const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Admin
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      productCount,
      userCount,
      totalOrders,
      inProgressOrders,
      deliveredOrders,
      cancelledOrders,
      revenueAgg,
    ] = await Promise.all([
      Product.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Order.countDocuments(),
      Order.countDocuments({
        orderStatus: { $in: ['PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'] },
      }),
      Order.countDocuments({ orderStatus: 'DELIVERED' }),
      Order.countDocuments({ orderStatus: 'CANCELLED' }),
      Order.aggregate([
        { $match: { orderStatus: 'DELIVERED', paymentStatus: 'PAID' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    const revenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    res.json({
      success: true,
      stats: {
        productCount,
        userCount,
        totalOrders,
        inProgressOrders,
        deliveredOrders,
        cancelledOrders,
        revenue,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
