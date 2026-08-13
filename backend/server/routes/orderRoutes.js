const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Table = require('../models/Table');

// 1. Lấy tất cả Order
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy order' });
  }
});

// 2. Tạo Order mới & BẮT BUỘC ĐỔI BÀN SANG "OCCUPIED" BẰNG MỌI CÁCH
router.post('/', async (req, res) => {
  try {
    const { tableId, tableCode, tableName, items, totalAmount } = req.body;

    const newOrder = new Order({
      tableCode: tableCode || tableName,
      tableName,
      items,
      totalAmount,
      status: 'PENDING'
    });
    const savedOrder = await newOrder.save();

    // Tìm và cập nhật bàn bằng ID hoặc Tên/Mã Bàn
    if (tableId) {
      await Table.findByIdAndUpdate(tableId, { status: 'OCCUPIED' });
    } else {
      await Table.findOneAndUpdate(
        { $or: [{ code: tableCode }, { name: tableName }] },
        { status: 'OCCUPIED' }
      );
    }

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Lỗi lưu order:', error);
    res.status(400).json({ message: 'Lỗi tạo order', error: error.message });
  }
});

// 3. Cập nhật Order (Thanh toán / Hủy) -> Trả Bàn về AVAILABLE
router.patch('/:id', async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (['PAID', 'CANCELLED'].includes(req.body.status)) {
      await Table.findOneAndUpdate(
        { $or: [{ code: updatedOrder.tableCode }, { name: updatedOrder.tableName }] },
        { status: 'AVAILABLE' }
      );
    }

    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: 'Lỗi cập nhật order' });
  }
});

module.exports = router;