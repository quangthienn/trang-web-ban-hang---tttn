// src/staff/StaffLayout.jsx
import React from 'react';

const StaffLayout = ({ currentUser, tables, onUpdateTableStatus, bookings, onLogout }) => {
  return (
    <div className="admin-wrapper">
      {/* Sidebar Nhân viên */}
      <div className="admin-sidebar" style={{ background: '#0f172a' }}>
        <div className="admin-logo">L’Amour Staff 📋</div>
        <div style={{ padding: '10px 0', fontSize: '13px', color: '#94a3b8' }}>
          Nhân viên: <strong>{currentUser?.name}</strong> (<code>{currentUser?.username}</code>)
        </div>
        <ul className="sidebar-menu">
          <li className="active">📌 Sơ Đồ Bàn & Đặt Bàn</li>
        </ul>
        <button className="btn-exit-admin" onClick={onLogout}>🚪 Đăng Xuất</button>
      </div>

      {/* Màn hình làm việc của Nhân viên */}
      <div className="admin-main">
        <h2>📌 Sơ Đồ Quản Lý Bàn Trực Quan</h2>
        <p style={{ color: '#64748b', marginBottom: '20px' }}>
          Theo dõi trạng thái từng bàn theo thời gian thực để phục vụ khách hàng tốt nhất.
        </p>

        {/* LƯỚI BÀN (GRID) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px', marginBottom: '35px' }}>
          {tables.map((t) => {
            let bgColor = '#10b981'; // 🟢 Trống
            let statusBadge = '🟢 Bàn Trống';
            
            if (t.status === 'RESERVED') {
              bgColor = '#f59e0b'; // 🟡 Đã đặt
              statusBadge = '🟡 Khách Đã Đặt';
            } else if (t.status === 'OCCUPIED') {
              bgColor = '#ef4444'; // 🔴 Đang ăn
              statusBadge = '🔴 Khách Đang Ăn';
            }

            return (
              <div 
                key={t.id} 
                style={{
                  background: '#fff',
                  borderTop: `6px solid ${bgColor}`,
                  borderRadius: '8px',
                  padding: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, color: '#1e293b' }}>{t.name}</h3>
                  <span style={{ fontSize: '11px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                    Sức chứa: {t.capacity}
                  </span>
                </div>

                <div style={{ fontSize: '13px', fontWeight: 'bold', color: bgColor, margin: '12px 0' }}>
                  {statusBadge}
                </div>

                {/* Các thao tác của Nhân viên */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {t.status !== 'AVAILABLE' && (
                    <button 
                      style={{ padding: '5px 8px', fontSize: '11px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      onClick={() => onUpdateTableStatus(t.id, 'AVAILABLE')}
                    >
                      ✓ Trả Bàn (Trống)
                    </button>
                  )}
                  {t.status !== 'OCCUPIED' && (
                    <button 
                      style={{ padding: '5px 8px', fontSize: '11px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      onClick={() => onUpdateTableStatus(t.id, 'OCCUPIED')}
                    >
                      ▶ Khách Ngồi Ăn
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* DANH SÁCH LƯỢT ĐẶT BÀN CỦA KHÁCH */}
        <h3>📋 Lượt Đặt Bàn Khách Gửi Qua Web ({bookings.length})</h3>
        <table className="admin-table" style={{ marginTop: '12px' }}>
          <thead>
            <tr>
              <th>Khách Hàng</th>
              <th>Số Điện Thoại</th>
              <th>Số Lượng</th>
              <th>Thời Gian Đến</th>
              <th>Bàn Tự Động Xếp</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
                  Chưa có lượt đặt bàn nào từ trang chủ.
                </td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr key={b.id}>
                  <td><strong>{b.name}</strong></td>
                  <td>{b.phone}</td>
                  <td>{b.guests} người</td>
                  <td>{b.time}</td>
                  <td><span className="badge">{b.tableName}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffLayout;