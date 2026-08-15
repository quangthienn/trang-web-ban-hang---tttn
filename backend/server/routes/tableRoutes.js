const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Table = require('../models/Table');

// 1. Lấy tất cả danh sách bàn
router.get('/', async (req, res) => {
  try {
    const tables = await Table.find().sort({ name: 1 });
    res.json(tables);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy danh sách bàn', error: error.message });
  }
});

// 2. Thêm bàn mới
router.post('/', async (req, res) => {
  try {
    const { name, code } = req.body;
    const newTable = new Table({
      name,
      code: code || name,
      status: 'AVAILABLE'
    });
    const savedTable = await newTable.save();
    res.status(201).json(savedTable);
  } catch (error) {
    res.status(400).json({ message: 'Lỗi tạo bàn mới', error: error.message });
  }
});

// =========================================================================
// 3. CẬP NHẬT TRẠNG THÁI BÀN (BỔ SUNG CHO REACT GỌI PATCH /api/tables/:id)
// =========================================================================
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reservationDetails } = req.body;

    // Kiểm tra xem ID truyền lên là ObjectId hay là Tên/Mã bàn
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId 
      ? { _id: id } 
      : { $or: [{ code: id }, { name: id }] };

    const updateData = {};
    if (status) {
      updateData.status = String(status).toUpperCase(); // Chuyển 'reserved' -> 'RESERVED'
    }
    if (reservationDetails) {
      updateData.reservationDetails = reservationDetails;
    }

    const updatedTable = await Table.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true }
    );

    if (!updatedTable) {
      return res.status(404).json({ message: 'Không tìm thấy bàn' });
    }

    res.json(updatedTable);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi cập nhật bàn', error: error.message });
  }
});

// ==========================================
// 4. ĐẶT BÀN TRƯỚC (GIỮ BÀN - TRẠNG THÁI RESERVED)
// ==========================================
router.post('/:id/reserve', async (req, res) => {
  try {
    const { customerName, customerPhone, reservationTime } = req.body;

    const updatedTable = await Table.findByIdAndUpdate(
      req.params.id,
      {
        status: 'RESERVED',
        reservationDetails: {
          customerName,
          customerPhone,
          reservationTime: reservationTime ? new Date(reservationTime) : null
        }
      },
      { new: true }
    );

    if (!updatedTable) {
      return res.status(404).json({ message: 'Không tìm thấy bàn cần đặt' });
    }

    res.json({
      success: true,
      message: 'Đặt bàn và giữ chỗ thành công!',
      table: updatedTable
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi đặt bàn', error: error.message });
  }
});

// ==========================================
// 5. HỦY GIỮ BÀN HOẶC TRẢ BÀN VỀ TRỐNG (AVAILABLE)
// ==========================================
router.patch('/:id/release', async (req, res) => {
  try {
    const updatedTable = await Table.findByIdAndUpdate(
      req.params.id,
      {
        status: 'AVAILABLE',
        reservationDetails: {
          customerName: '',
          customerPhone: '',
          reservationTime: null
        }
      },
      { new: true }
    );

    if (!updatedTable) {
      return res.status(404).json({ message: 'Không tìm thấy bàn' });
    }

    res.json({
      success: true,
      message: 'Đã giải phóng bàn về trạng thái trống!',
      table: updatedTable
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi giải phóng bàn', error: error.message });
  }
});

// 6. Cập nhật thông tin bàn chung
router.put('/:id', async (req, res) => {
  try {
    const updatedTable = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedTable);
  } catch (error) {
    res.status(400).json({ message: 'Lỗi cập nhật bàn', error: error.message });
  }
});

// 7. Xóa bàn
router.delete('/:id', async (req, res) => {
  try {
    await Table.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa bàn thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi xóa bàn', error: error.message });
  }
});

module.exports = router;