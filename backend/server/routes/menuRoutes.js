const express = require('express');
const router = express.Router();
const Menu = require('../models/Menu');

// 1. GET: Lấy tất cả món
router.get('/', async (req, res) => {
  try {
    const menuList = await Menu.find();
    res.json(menuList);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy danh sách món', error });
  }
});

// 2. POST: Thêm món mới
router.post('/', async (req, res) => {
  try {
    const newMenu = new Menu(req.body);
    const savedMenu = await newMenu.save();
    res.status(201).json(savedMenu);
  } catch (error) {
    res.status(400).json({ message: 'Lỗi thêm món mới', error });
  }
});

// 3. DELETE: Xóa món ăn theo ID (BẮT BUỘC CÓ DÒNG NÀY)
router.delete('/:id', async (req, res) => {
  try {
    const deletedDish = await Menu.findByIdAndDelete(req.params.id);
    if (!deletedDish) {
      return res.status(404).json({ message: 'Không tìm thấy món để xóa!' });
    }
    res.json({ message: 'Đã xóa món ăn thành công!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa món ăn', error });
  }
});

module.exports = router;