import React, { useState, useEffect } from 'react';

// 🟢 BỔ SUNG 2 DÒNG NÀY ĐỂ ĂN LẠI GIAO DIỆN / TAILWIND CSS
import './index.css';
import './App.css';

// 🌐 Các phần trang chủ dành cho Khách
import Navbar from './layouts/Navbar';
import Footer from './layouts/Footer';
import Hero from './sections/Hero';
import MenuSection from './sections/MenuSection';
import BookingSection from './sections/BookingSection';

// 🔑 Giao diện Quản lý & Nhân viên
import AdminLayout from './admin/AdminLayout';
import StaffLayout from './staff/StaffLayout';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Lấy đường dẫn URL hiện tại
  const path = window.location.pathname;

  useEffect(() => {
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  // Xử lý Form Đăng nhập
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        })
      });

      const data = await res.json();

      if (res.ok) {
        sessionStorage.setItem('currentUser', JSON.stringify(data));
        setCurrentUser(data);
      } else {
        setErrorMsg(data.message || 'Tên đăng nhập hoặc mật khẩu không đúng!');
      }
    } catch (err) {
      setErrorMsg('❌ Lỗi kết nối tới Server Backend!');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý Đăng xuất
  const handleLogout = () => {
    sessionStorage.removeItem('currentUser');
    setCurrentUser(null);
    setUsername('');
    setPassword('');
  };

  // ========================================================
  // 🔑 KHI GÕ `/admin` HOẶC `/staff` TRÊN URL
  // ========================================================
  if (path === '/admin' || path === '/staff') {
    if (!currentUser) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827', color: '#fff', fontFamily: 'sans-serif' }}>
          <form onSubmit={handleLogin} style={{ background: '#1f2937', padding: '30px', borderRadius: '12px', width: '320px', boxShadow: '0 4px 15px rgba(0,0,0,0.4)' }}>
            <h2 style={{ textAlign: 'center', color: '#fbbf24', marginTop: 0 }}>🔑 ĐĂNG NHẬP HỆ THỐNG</h2>

            {errorMsg && (
              <div style={{ background: '#ef4444', color: '#fff', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '15px', textAlign: 'center', fontWeight: 'bold' }}>
                {errorMsg}
              </div>
            )}

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#d1d5db' }}>Tên đăng nhập / Mã NV:</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="VD: admin, waiter01..."
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #374151', background: '#111827', color: '#fff', boxSizing: 'border-box' }}
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#d1d5db' }}>Mật khẩu:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #374151', background: '#111827', color: '#fff', boxSizing: 'border-box' }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: loading ? '#6b7280' : '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '15px'
              }}
            >
              {loading ? '⏳ Đang xác thực...' : '🚀 ĐĂNG NHẬP'}
            </button>
          </form>
        </div>
      );
    }

    if (currentUser.role === 'ADMIN') {
      return <AdminLayout currentUser={currentUser} onLogout={handleLogout} />;
    }

    if (['WAITER', 'KITCHEN', 'CASHIER'].includes(currentUser.role)) {
      return <StaffLayout currentUser={currentUser} onLogout={handleLogout} />;
    }
  }

  // ========================================================
  // 🌐 TRANG CHỦ DÀNH CHO KHÁCH (Mặc định)
  // ========================================================
  return (
    <div className="app-container">
      <Navbar />
      <Hero />
      <MenuSection />
      <BookingSection />
      <Footer />
    </div>
  );
}

export default App;