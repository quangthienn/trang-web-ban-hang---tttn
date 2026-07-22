import React, { useState, useEffect } from 'react';
import Navbar from './layouts/Navbar';
import Hero from './sections/Hero';
import MenuSection from './sections/MenuSection';
import BookingSection from './sections/BookingSection';
import Footer from './layouts/Footer';
import AdminLayout from './admin/AdminLayout';
import StaffLayout from './staff/StaffLayout';
import LoginModal from './components/Auth/LoginModal';
import './App.css';

// 1. Danh sách Bàn ban đầu
const defaultTables = [
  { id: 1, name: "Bàn 01 (Sảnh)", capacity: 2, status: 'AVAILABLE' },
  { id: 2, name: "Bàn 02 (Sảnh)", capacity: 2, status: 'AVAILABLE' },
  { id: 3, name: "Bàn 03 (Cửa sổ)", capacity: 4, status: 'AVAILABLE' },
  { id: 4, name: "Bàn 04 (Cửa sổ)", capacity: 4, status: 'AVAILABLE' },
  { id: 5, name: "Bàn VIP 05", capacity: 8, status: 'AVAILABLE' },
];

// 2. Tài khoản mặc định
const defaultAccounts = [
  { id: 1, username: 'admin', password: '123', name: 'Quản Lý Trưởng', role: 'ADMIN' },
  { id: 2, username: 'nv01', password: '123', name: 'Trần Văn Phục Vụ', position: 'Phục vụ', role: 'STAFF' }
];

// 3. Menu món ăn
const defaultMenu = [
  { id: 1, name: "Sườn Cừu Nướng Thảo Mộc", price: "450.000đ", category: "Món Chính", desc: "Sườn cừu tươi nướng kèm sốt vang đỏ và khoai tây nghiền mịn.", image: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600" },
  { id: 2, name: "Salad Cá Hồi Áp Chảo", price: "280.000đ", category: "Hải Sản", desc: "Cá hồi áp chảo, rau mầm hữu cơ cùng sốt chanh dây thanh mát.", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600" },
  { id: 3, name: "Pizza Hải Sản Hoàng Gia", price: "320.000đ", category: "Hải Sản", desc: "Tôm, mực, nghêu kết hợp lớp phô mai Mozzarella béo ngậy.", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=600" },
  { id: 4, name: "Bánh Kem Dâu Tây Pháp", price: "120.000đ", category: "Tráng Miệng", desc: "Bánh mousse dâu tây mềm mịn ngọt ngào chuẩn phong cách Pháp.", image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=600" }
];

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [currentUser, setCurrentUser] = useState(null);
  const [menuList, setMenuList] = useState(defaultMenu);
  
  // State Bàn & Lượt Đặt Bàn (Tự động đồng bộ localStorage)
  const [tables, setTables] = useState(() => {
    const saved = localStorage.getItem('lamour_tables');
    return saved ? JSON.parse(saved) : defaultTables;
  });

  const [bookings, setBookings] = useState(() => {
    const saved = localStorage.getItem('lamour_bookings');
    return saved ? JSON.parse(saved) : [];
  });

  const [accounts, setAccounts] = useState(() => {
    const saved = localStorage.getItem('lamour_accounts');
    return saved ? JSON.parse(saved) : defaultAccounts;
  });

  // Lưu tự động vào LocalStorage
  useEffect(() => {
    localStorage.setItem('lamour_tables', JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem('lamour_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('lamour_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    const handleLocationChange = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Khách bấm Đặt Bàn -> Tự động đổi trạng thái bàn sang RESERVED (Đã Đặt)
  const handleBookTable = (newBooking) => {
    setBookings([newBooking, ...bookings]);
    setTables(tables.map(t => t.id === newBooking.tableId ? { ...t, status: 'RESERVED' } : t));
  };

  // Nhân viên cập nhật trạng thái Bàn
  const handleUpdateTableStatus = (tableId, newStatus) => {
    setTables(tables.map(t => t.id === tableId ? { ...t, status: newStatus } : t));
  };

  const handleAddMenu = (newItem) => setMenuList([newItem, ...menuList]);
  const handleDeleteMenu = (id) => {
    if (window.confirm("Xóa món này khỏi thực đơn?")) {
      setMenuList(menuList.filter(item => item.id !== id));
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    navigateTo('/');
  };

  const isAdminRoute = currentPath === '/admin';

  // Nếu truy cập vào /admin
  if (isAdminRoute) {
    if (!currentUser) {
      return (
        <LoginModal 
          accounts={accounts}
          onLoginSuccess={(user) => setCurrentUser(user)} 
          onClose={() => navigateTo('/')} 
        />
      );
    }

    // Đăng nhập quyền ADMIN
    if (currentUser.role === 'ADMIN') {
      return (
        <AdminLayout 
          currentUser={currentUser}
          accounts={accounts}
          onUpdateAccounts={setAccounts}
          onExitAdmin={handleLogout} 
          menuList={menuList} 
          onAddMenu={handleAddMenu} 
          onDeleteMenu={handleDeleteMenu} 
        />
      );
    }

    // Đăng nhập quyền STAFF
    if (currentUser.role === 'STAFF') {
      return (
        <StaffLayout 
          currentUser={currentUser} 
          tables={tables}
          onUpdateTableStatus={handleUpdateTableStatus}
          bookings={bookings}
          onLogout={handleLogout} 
        />
      );
    }
  }

  // Giao diện Khách xem Web (Trang chủ /)
  return (
    <div className="app-container">
      <Navbar />
      <Hero />
      <MenuSection menuList={menuList} />
      <BookingSection tables={tables} onBookTable={handleBookTable} />
      <Footer />
    </div>
  );
}

export default App;