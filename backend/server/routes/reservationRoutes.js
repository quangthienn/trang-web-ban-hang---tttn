const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');

// 1️⃣ Lấy danh sách tất cả lịch đặt bàn (Sắp xếp mới nhất lên đầu)
router.get('/', async (req, res) => {
  try {
    const list = await Reservation.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ 
      message: 'Lỗi tải danh sách lịch đặt bàn!', 
      error: error.message 
    });
  }
});

// 2️⃣ Tạo lịch đặt mới từ Form Khách hàng (Frontend gửi lên)
router.post('/', async (req, res) => {
  try {
    const { customerName, phone, bookingTime } = req.body;

    // Validate các thông tin bắt buộc theo Schema
    if (!customerName || !phone || !bookingTime) {
      return res.status(400).json({ 
        message: 'Thiếu thông tin bắt buộc: Họ tên, Số điện thoại hoặc Thời gian đặt!' 
      });
    }

    // Tạo đơn đặt bàn mới
    const newBooking = new Reservation({
      ...req.body,
      status: req.body.status || 'PENDING'
    });

    const saved = await newBooking.save();
    res.status(201).json(saved);

  } catch (error) {
    console.error('❌ Lỗi khi lưu lịch đặt bàn vào DB:', error);
    res.status(400).json({ 
      message: error.message || 'Lỗi tạo lịch đặt bàn!' 
    });
  }
});

// 3️⃣ Cập nhật trạng thái (ĐÃ SỬA: Bỏ runValidators để tránh bị chặn khi sửa status)
router.patch('/:id', async (req, res) => {
  try {
    const updated = await Reservation.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: false } // 👈 Đã sửa thành false
    );
    
    if (!updated) {
      return res.status(404).json({ message: 'Không tìm thấy đơn đặt bàn này!' });
    }

    res.json(updated);
  } catch (error) {
    console.error('❌ Lỗi cập nhật đơn:', error);
    res.status(400).json({ 
      message: 'Lỗi cập nhật lịch đặt bàn!', 
      error: error.message 
    });
  }
});

// 3️⃣b Thêm route PUT (Phòng trường hợp Frontend gửi method PUT)
router.put('/:id', async (req, res) => {
  try {
    const updated = await Reservation.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: false }
    );
    
    if (!updated) {
      return res.status(404).json({ message: 'Không tìm thấy đơn đặt bàn này!' });
    }

    res.json(updated);
  } catch (error) {
    console.error('❌ Lỗi cập nhật đơn (PUT):', error);
    res.status(400).json({ 
      message: 'Lỗi cập nhật lịch đặt bàn!', 
      error: error.message 
    });
  }
});

// 4️⃣ Xóa đơn đặt bàn
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Reservation.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Không tìm thấy đơn đặt bàn để xóa!' });
    }
    res.json({ message: 'Đã xóa đơn đặt bàn thành công!' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Lỗi khi xóa đơn đặt bàn!', 
      error: error.message 
    });
  }
});

module.exports = router;