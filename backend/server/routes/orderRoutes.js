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

// 2. Tạo Order mới & ĐỔI BÀN SANG "OCCUPIED"
router.post('/', async (req, res) => {
  try {
    const { tableId, tableCode, tableName, items, totalAmount } = req.body;

    // Gán mặc định isSentToKitchen = false cho các món trong đơn hàng mới
    const formattedItems = items.map(item => ({
      ...item,
      isSentToKitchen: false
    }));

    const newOrder = new Order({
      tableId,
      tableCode: tableCode || tableName,
      tableName,
      items: formattedItems,
      totalAmount,
      status: 'PENDING',
      paymentStatus: 'UNPAID'
    });
    const savedOrder = await newOrder.save();

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

// ==========================================
// 3. TẠO MÃ VIETQR CHUYỂN KHOẢN (MB BANK)
// ==========================================
router.post('/:id/create-qr', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });

    // Thông tin tài khoản MB Bank
    const BANK_ID = 'MB';                    
    const ACCOUNT_NO = '0352239768';        
    const ACCOUNT_NAME = 'NGUYEN QUANG THIEN'; 
    const memo = `TT ban ${order.tableName} ${order._id.toString().slice(-4)}`;

    // Tạo URL mã VietQR tự động
    const qrImageUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?amount=${order.totalAmount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

    res.json({
      success: true,
      qrImageUrl,
      memo,
      totalAmount: order.totalAmount
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi tạo mã QR thanh toán', error: error.message });
  }
});

// ==========================================
// 4. XÁC NHẬN THANH TOÁN (TIỀN MẶT HOẶC CHUYỂN KHOẢN)
// ==========================================
router.post('/:id/pay', async (req, res) => {
  try {
    const { paymentMethod } = req.body; // 'CASH' hoặc 'BANK_TRANSFER'

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status: 'PAID',
        paymentStatus: 'PAID',
        paymentMethod: paymentMethod || 'CASH',
        paidAt: new Date()
      },
      { new: true }
    );

    if (!updatedOrder) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    if (updatedOrder.tableId) {
      await Table.findByIdAndUpdate(updatedOrder.tableId, { status: 'AVAILABLE' });
    } else {
      await Table.findOneAndUpdate(
        { $or: [{ code: updatedOrder.tableCode }, { name: updatedOrder.tableName }] },
        { status: 'AVAILABLE' }
      );
    }

    res.json({
      message: 'Thanh toán thành công, bàn đã giải phóng!',
      order: updatedOrder
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi xử lý thanh toán', error: error.message });
  }
});

// ==========================================
// 5. GỌI THÊM MÓN (TRÁNH LẶP MÓN CHO BẾP)
// ==========================================
router.post('/:id/add-items', async (req, res) => {
  try {
    const { newItems } = req.body; 
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
    }

    // Đánh dấu các món mới thêm có cờ isSentToKitchen = false để nhà bếp biết mà nấu
    const formattedNewItems = newItems.map(item => ({
      ...item,
      isSentToKitchen: false 
    }));

    // Gộp món mới vào mảng items hiện tại
    order.items.push(...formattedNewItems);

    // Tính lại tổng tiền hóa đơn
    order.totalAmount = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const updatedOrder = await order.save();

    res.json({
      success: true,
      message: 'Thêm món thành công!',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Lỗi thêm món:', error);
    res.status(500).json({ message: 'Lỗi server khi thêm món', error: error.message });
  }
});

// 6. Cập nhật Order chung (Sửa món/Hủy đơn)
router.patch('/:id', async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (['PAID', 'CANCELLED'].includes(req.body.status)) {
      if (updatedOrder.tableId) {
        await Table.findByIdAndUpdate(updatedOrder.tableId, { status: 'AVAILABLE' });
      } else {
        await Table.findOneAndUpdate(
          { $or: [{ code: updatedOrder.tableCode }, { name: updatedOrder.tableName }] },
          { status: 'AVAILABLE' }
        );
      }
    }

    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: 'Lỗi cập nhật order' });
  }
});

module.exports = router;