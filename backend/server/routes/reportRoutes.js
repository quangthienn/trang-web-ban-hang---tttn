const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// API lấy thống kê doanh thu cho Admin
router.get('/stats', async (req, res) => {
  try {
    // Chỉ lấy những đơn hàng đã thanh toán (PAID)
    const paidOrders = await Order.find({ paymentStatus: 'PAID' });

    // Tính tổng doanh thu
    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    // Đếm tổng số đơn hàng
    const totalOrders = paidOrders.length;

    res.json({
      success: true,
      totalRevenue,
      totalOrders,
      message: 'Lấy dữ liệu thống kê thành công'
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy thống kê', error: error.message });
  }
});

module.exports = router;