const express = require('express');
const router = express.Router();
const Table = require('../models/Table');

// 1. Lấy danh sách tất cả các bàn
router.get('/', async (req, res) => {
  try {
    const tables = await Table.find().sort({ code: 1 });
    res.json(tables);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy danh sách bàn' });
  }
});

// 2. Cập nhật trạng thái bàn (Đổi giữa 'AVAILABLE' và 'OCCUPIED')
router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body; // status có thể là 'AVAILABLE' hoặc 'OCCUPIED'
    const updatedTable = await Table.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(updatedTable);
  } catch (error) {
    res.status(400).json({ message: 'Lỗi cập nhật trạng thái bàn' });
  }
});

module.exports = router;