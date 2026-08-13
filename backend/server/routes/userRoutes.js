const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 1. Lấy danh sách tất cả nhân viên (Bỏ qua password để bảo mật)
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('❌ Lỗi lấy danh sách nhân viên:', error);
    res.status(500).json({ message: 'Lỗi lấy danh sách nhân viên', error });
  }
});

// 2. Admin thêm nhân viên mới (Đã sửa lỗi Role & Bắt lỗi trùng Mã NV)
router.post('/', async (req, res) => {
  try {
    const { username, password, name, role } = req.body;

    if (!username || !password || !name || !role) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin!' });
    }

    const newUser = new User({ 
      username: username.trim(), 
      password: password.trim(), 
      name: name.trim(), 
      role: role.toUpperCase() // Ép về chữ HOA (ADMIN, WAITER, KITCHEN, CASHIER)
    });

    const savedUser = await newUser.save();
    console.log('✅ Đã lưu nhân viên mới:', savedUser.username);
    res.status(201).json(savedUser);
  } catch (error) {
    console.error('❌ Lỗi khi thêm nhân viên:', error.message);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Tên đăng nhập / Mã nhân viên này đã tồn tại!' });
    }
    res.status(400).json({ message: 'Lỗi thêm nhân viên', error: error.message });
  }
});

// 3. 🔐 API ĐĂNG NHẬP CHO TẤT CẢ NHÂN VIÊN
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });

    if (!user) {
      return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng!' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      role: user.role
    });
  } catch (error) {
    console.error('❌ Lỗi đăng nhập:', error);
    res.status(500).json({ message: 'Lỗi Server khi đăng nhập', error });
  }
});

// 4. 🔑 API ĐỔI MẬT KHẨU (Cho cả Admin & Nhân viên)
router.put('/change-password', async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;

    if (!userId || !oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin!' });
    }

    // 1. Tìm user theo ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản!' });
    }

    // 2. Kiểm tra mật khẩu cũ
    if (user.password !== oldPassword.trim()) {
      return res.status(400).json({ message: 'Mật khẩu cũ không chính xác!' });
    }

    // 3. Cập nhật mật khẩu mới
    user.password = newPassword.trim();
    await user.save();

    console.log(`✅ Đã đổi mật khẩu thành công cho tài khoản: ${user.username}`);
    res.json({ message: 'Đổi mật khẩu thành công!' });
  } catch (error) {
    console.error('❌ Lỗi đổi mật khẩu:', error);
    res.status(500).json({ message: 'Lỗi Server khi đổi mật khẩu', error: error.message });
  }
});

// 5. Admin xóa nhân viên
router.delete('/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa nhân viên!' });
  } catch (error) {
    console.error('❌ Lỗi xóa nhân viên:', error);
    res.status(500).json({ message: 'Lỗi xóa nhân viên', error });
  }
});

module.exports = router;