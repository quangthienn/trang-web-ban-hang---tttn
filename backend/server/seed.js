// server/seed.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Menu = require('./models/Menu');
const Table = require('./models/Table');
const User = require('./models/User');

dotenv.config();

// 1. Dữ liệu thực đơn mẫu
const defaultMenu = [
  { name: "Sườn Cừu Nướng Thảo Mộc", price: 450000, category: "Món Chính", desc: "Sườn cừu tươi nướng kèm sốt vang đỏ và khoai tây nghiền mịn.", image: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600" },
  { name: "Salad Cá Hồi Áp Chảo", price: 280000, category: "Hải Sản", desc: "Cá hồi áp chảo, rau mầm hữu cơ cùng sốt chanh dây thanh mát.", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600" },
  { name: "Pizza Hải Sản Hoàng Gia", price: 320000, category: "Hải Sản", desc: "Tôm, mực, nghêu kết hợp lớp phô mai Mozzarella béo ngậy.", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=600" },
  { name: "Bánh Kem Dâu Tây Pháp", price: 120000, category: "Tráng Miệng", desc: "Bánh mousse dâu tây mềm mịn ngọt ngào chuẩn phong cách Pháp.", image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=600" }
];

// 2. Dữ liệu 10 bàn ăn thuộc các khu vực khác nhau
const defaultTables = [
  { code: "01", name: "Bàn 01 (Sảnh chính)", capacity: 2, status: "AVAILABLE" },
  { code: "02", name: "Bàn 02 (Sảnh chính)", capacity: 2, status: "AVAILABLE" },
  { code: "03", name: "Bàn 03 (Sảnh chính)", capacity: 4, status: "AVAILABLE" },
  { code: "04", name: "Bàn 04 (Sảnh chính)", capacity: 4, status: "AVAILABLE" },
  { code: "05", name: "Bàn 05 (Gần Cửa sổ)", capacity: 4, status: "AVAILABLE" },
  { code: "06", name: "Bàn 06 (Gần Cửa sổ)", capacity: 4, status: "AVAILABLE" },
  { code: "07", name: "Bàn 07 (Ban công)", capacity: 6, status: "AVAILABLE" },
  { code: "08", name: "Bàn 08 (Ban công)", capacity: 6, status: "AVAILABLE" },
  { code: "VIP01", name: "Bàn VIP 01 (Phòng Hoa Cúc)", capacity: 8, status: "AVAILABLE" },
  { code: "VIP02", name: "Bàn VIP 02 (Phòng Hoàng Gia)", capacity: 10, status: "AVAILABLE" }
];

// 3. Dữ liệu tài khoản Admin & Nhân viên
const defaultUsers = [
  { username: "admin", password: "123", name: "Nguyễn Quản Lý", role: "ADMIN" },
  { username: "order01", password: "123", name: "Trần Phục Vụ", role: "WAITER" },
  { username: "bep01", password: "123", name: "Lê Đầu Bếp", role: "KITCHEN" },
  { username: "thungan01", password: "123", name: "Phạm Thu Ngân", role: "CASHIER" }
];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔌 Đã kết nối MongoDB!');

    // Xóa dữ liệu cũ
    await Menu.deleteMany();
    await Table.deleteMany();
    await User.deleteMany();

    // Thêm dữ liệu mới
    await Menu.insertMany(defaultMenu);
    await Table.insertMany(defaultTables);
    await User.insertMany(defaultUsers);

    console.log('🎉 Đã nạp thành công 10 bàn, Thực đơn & Tài khoản mẫu!');
    process.exit();
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
};

seedData();