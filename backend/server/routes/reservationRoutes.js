const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const Table = require('../models/Table'); // 👈 Bổ sung import Table model

// 🛠️ Hàm phụ: Tự động đổi màu/trạng thái Bàn trong Database
async function syncTableStatus(reservation, status) {
  if (!reservation) return;

  const targetCode = reservation.tableCode;
  const targetTableId = reservation.table;

  let newTableStatus = null;
  if (status === 'CONFIRMED') newTableStatus = 'RESERVED';  // Duyệt -> Đổi bàn sang RESERVED (Vàng)
  if (status === 'CANCELLED') newTableStatus = 'AVAILABLE'; // Hủy   -> Trả bàn sang AVAILABLE (Xanh)

  if (newTableStatus) {
    if (targetTableId) {
      await Table.findByIdAndUpdate(targetTableId, { status: newTableStatus });
    } else if (targetCode) {
      await Table.findOneAndUpdate(
        { $or: [{ code: targetCode }, { name: targetCode }] },
        { status: newTableStatus }
      );
    }
  }
}

// 1️⃣ Lấy danh sách tất cả lịch đặt bàn (Sắp xếp mới nhất lên đầu)
router.get('/', async (req, res) => {
  try {
    const list = await Reservation.find()
      .populate('table')
      .sort({ createdAt: -1 });
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
    const { customerName, phone, bookingTime, tableCode, adults, children, guestCount } = req.body;

    // Validate các thông tin bắt buộc theo Schema
    if (!customerName || !phone || !bookingTime) {
      return res.status(400).json({ 
        message: 'Thiếu thông tin bắt buộc: Họ tên, Số điện thoại hoặc Thời gian đặt!' 
      });
    }

    const numAdults = parseInt(adults) || 1;
    const numChildren = parseInt(children) || 0;
    const totalGuests = parseInt(guestCount) || (numAdults + numChildren);

    // Tìm id của Bàn dựa trên tableCode (nếu có)
    let tableId = req.body.table;
    if (!tableId && tableCode) {
      const tableObj = await Table.findOne({
        $or: [{ code: tableCode }, { name: tableCode }]
      });
      if (tableObj) tableId = tableObj._id;
    }

    // Tạo đơn đặt bàn mới với đủ người lớn/trẻ em
    const newBooking = new Reservation({
      ...req.body,
      adults: numAdults,
      children: numChildren,
      guestCount: totalGuests,
      table: tableId || null,
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

// 3️⃣ Cập nhật trạng thái (PATCH)
router.patch('/:id', async (req, res) => {
  try {
    const updated = await Reservation.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: false }
    );
    
    if (!updated) {
      return res.status(404).json({ message: 'Không tìm thấy đơn đặt bàn này!' });
    }

    // 🟢 Tự động đồng bộ trạng thái Bàn trong DB
    if (req.body.status) {
      await syncTableStatus(updated, req.body.status);
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

// 3️⃣b Route PUT (Phòng trường hợp Frontend gửi method PUT)
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

    // 🟢 Tự động đồng bộ trạng thái Bàn trong DB
    if (req.body.status) {
      await syncTableStatus(updated, req.body.status);
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