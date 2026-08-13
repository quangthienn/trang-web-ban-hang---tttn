import React, { useState } from 'react';
import AdminDashboard from './AdminDashboard';
import ManageStaff from './ManageStaff';
import ManageMenu from './ManageMenu';

function AdminLayout({ currentUser, onLogout }) {
  // Tab mặc định khi Admin đăng nhập vào là Trang Thống Kê
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'staff' | 'menu'

  return (
    <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* 👑 HEADER ADMIN */}
      <header
        style={{
          background: '#1f2937',
          color: '#fff',
          padding: '15px 25px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ margin: 0, color: '#fbbf24', fontSize: '20px' }}>👑 HỆ THỐNG QUẢN TRỊ</h2>
        </div>

        <div>
          <span style={{ marginRight: '15px', color: '#d1d5db', fontSize: '14px' }}>
            Xin chào, <strong>{currentUser?.name || 'Admin'}</strong>
          </span>
          <button
            onClick={onLogout}
            style={{
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '13px'
            }}
          >
            🚪 Đăng Xuất
          </button>
        </div>
      </header>

      {/* 📌 THANH MENU ĐIỀU HƯỚNG TAB */}
      <div
        style={{
          background: '#fff',
          padding: '0 25px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          gap: '10px'
        }}
      >
        <button
          onClick={() => setActiveTab('dashboard')}
          style={{
            padding: '14px 20px',
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === 'dashboard' ? '3px solid #3b82f6' : '3px solid transparent',
            color: activeTab === 'dashboard' ? '#3b82f6' : '#6b7280',
            fontWeight: 'bold',
            fontSize: '15px',
            cursor: 'pointer'
          }}
        >
          📊 Thống Kê Doanh Thu & Bàn
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          style={{
            padding: '14px 20px',
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === 'staff' ? '3px solid #3b82f6' : '3px solid transparent',
            color: activeTab === 'staff' ? '#3b82f6' : '#6b7280',
            fontWeight: 'bold',
            fontSize: '15px',
            cursor: 'pointer'
          }}
        >
          👥 Quản Lý Nhân Viên
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          style={{
            padding: '14px 20px',
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === 'menu' ? '3px solid #3b82f6' : '3px solid transparent',
            color: activeTab === 'menu' ? '#3b82f6' : '#6b7280',
            fontWeight: 'bold',
            fontSize: '15px',
            cursor: 'pointer'
          }}
        >
          🍔 Quản Lý Thực Đơn
        </button>
      </div>

      {/* 🖥️ NỘI DUNG HIỂN THỊ THEO TAB ĐƯỢC CHỌN */}
      <main style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'staff' && <ManageStaff />}
        {activeTab === 'menu' && <ManageMenu />}
      </main>
    </div>
  );
}

export default AdminLayout;