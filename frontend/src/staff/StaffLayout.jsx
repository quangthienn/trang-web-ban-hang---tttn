import React from 'react';
import WaiterInterface from './WaiterInterface';
import KitchenInterface from './KitchenInterface';
import CashierInterface from './CashierInterface'; // Import file mới tạo

function StaffLayout({ currentUser, onLogout }) {
  return (
    <div style={{ backgroundColor: '#111827', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif' }}>
      {/* Header Staff */}
      <div style={{ background: '#1f2937', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>👤 {currentUser.name} | Vai trò: <strong style={{ color: '#10b981' }}>{currentUser.role}</strong></span>
        <button onClick={onLogout} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
          Đăng xuất
        </button>
      </div>

      {/* Điều hướng theo vai trò */}
      {currentUser.role === 'WAITER' && <WaiterInterface />}
      {currentUser.role === 'KITCHEN' && <KitchenInterface />}
      {currentUser.role === 'CASHIER' && <CashierInterface />}
    </div>
  );
}

export default StaffLayout;