import React, { useState } from 'react'; // 👈 1. Thêm useState
import WaiterInterface from './WaiterInterface';
import KitchenInterface from './KitchenInterface';
import CashierInterface from './CashierInterface';
import ChangePasswordModal from '../components/ChangePasswordModal'; // 👈 2. Import Modal vào đây

function StaffLayout({ currentUser, onLogout }) {
  // 👈 3. State quản lý Bật/Tắt bảng Đổi mật khẩu
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  return (
    <div style={{ backgroundColor: '#111827', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif' }}>
      {/* Header Staff */}
      <div style={{ background: '#1f2937', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
        <span>👤 <strong>{currentUser?.name}</strong> | Vai trò: <strong style={{ color: '#10b981' }}>{currentUser?.role}</strong></span>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* 🔑 4. NÚT ĐỔI MẬT KHẨU MỚI BỔ SUNG */}
          <button 
            onClick={() => setShowPasswordModal(true)} 
            style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            🔑 Đổi mật khẩu
          </button>

          {/* 🚪 NÚT ĐĂNG XUẤT */}
          <button 
            onClick={onLogout} 
            style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Điều hướng theo vai trò */}
      {currentUser?.role === 'WAITER' && <WaiterInterface />}
      {currentUser?.role === 'KITCHEN' && <KitchenInterface />}
      {currentUser?.role === 'CASHIER' && <CashierInterface />}

      {/* 🔑 5. BẢNG BẬT LÊN KHI NHÂN VIÊN BẤM NÚT ĐỔI MẬT KHẨU */}
      {showPasswordModal && (
        <ChangePasswordModal 
          currentUser={currentUser} 
          onClose={() => setShowPasswordModal(false)} 
        />
      )}
    </div>
  );
}

export default StaffLayout;