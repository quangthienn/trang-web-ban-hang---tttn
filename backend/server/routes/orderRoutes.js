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

    const newOrder = new Order({
      tableId, // Lưu thêm tableId để dễ truy vấn thanh toán sau này
      tableCode: tableCode || tableName,
      tableName,
      items,
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
// 3. THÊM MỚI: TẠO MÃ VIETQR CHUYỂN KHOẢN (THU NGÂN)
// ==========================================
router.post('/:id/create-qr', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });

    // Thông tin tài khoản nhà hàng L'Amour
    const BANK_ID = 'MB';          // Tên ngân hàng (MB, VCB, TCB, ICB...)
    const ACCOUNT_NO = '0999999999'; // Số tài khoản nhà hàng
    const ACCOUNT_NAME = 'NHA HANG LAMOUR';
    const memo = `LAMOUR ${order._id.toString().slice(-6).toUpperCase()}`;

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
// 4. THÊM MỚI: XÁC NHẬN THANH TOÁN (TIỀN MẶT HẶC CHUYỂN KHOẢN)
// ==========================================
router.post('/:id/pay', async (req, res) => {
  try {
    const { paymentMethod } = req.body; // 'CASH' (Tiền mặt) hoặc 'BANK_TRANSFER' (Chuyển khoản)

    // 1. Cập nhật Order thành PAID
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

    // 2. Trả bàn về trạng thái AVAILABLE
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

// 5. Cập nhật Order chung (Sửa món/Hủy đơn)
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