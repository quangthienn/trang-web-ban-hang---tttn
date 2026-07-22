// src/admin/ManageStaff.jsx
import React, { useState } from 'react';

const ManageStaff = ({ accounts, onUpdateAccounts, currentUser }) => {
  // 1. State Đổi mật khẩu Admin
  const [adminUser, setAdminUser] = useState(currentUser?.username || 'admin');
  const [adminPass, setAdminPass] = useState(currentUser?.password || '123456');
  const [adminMsg, setAdminMsg] = useState('');

  // 2. State Thêm Nhân Viên mới
  const [staffName, setStaffName] = useState('');
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffPosition, setStaffPosition] = useState('Phục vụ');

  // Xử lý đổi tài khoản/mật khẩu Admin
  const handleUpdateAdmin = (e) => {
    e.preventDefault();
    const updated = accounts.map((acc) => {
      if (acc.role === 'ADMIN') {
        return { ...acc, username: adminUser, password: adminPass };
      }
      return acc;
    });
    onUpdateAccounts(updated);
    setAdminMsg('✅ Đã cập nhật tài khoản Admin thành công!');
    setTimeout(() => setAdminMsg(''), 3000);
  };

  // Xử lý thêm Nhân viên
  const handleAddStaff = (e) => {
    e.preventDefault();
    // Kiểm tra trùng username
    if (accounts.some((acc) => acc.username === staffUsername.trim())) {
      alert('Tên tài khoản này đã tồn tại! Vui lòng chọn tên khác.');
      return;
    }

    const newStaff = {
      id: Date.now(),
      name: staffName,
      username: staffUsername.trim(),
      password: staffPassword,
      position: staffPosition,
      role: 'STAFF'
    };

    onUpdateAccounts([...accounts, newStaff]);
    alert(`Đã tạo tài khoản nhân viên [${staffUsername}] thành công!`);
    
    // Reset form
    setStaffName('');
    setStaffUsername('');
    setStaffPassword('');
  };

  // Xử lý xóa Nhân viên
  const handleDeleteStaff = (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn XÓA tài khoản nhân viên "${name}"?`)) {
      const filtered = accounts.filter((acc) => acc.id !== id);
      onUpdateAccounts(filtered);
    }
  };

  // Lọc danh sách chỉ lấy nhân viên (STAFF)
  const staffList = accounts.filter((acc) => acc.role === 'STAFF');

  return (
    <div className="admin-content">
      <h2>👥 Quản Lý Tài Khoản & Nhân Sự</h2>

      {/* KHU VỰC 1: ĐỔI TÀI KHOẢN ADMIN */}
      <div className="admin-form" style={{ borderLeft: '4px solid #c59d5f' }}>
        <h3>🔑 Đổi Tài Khoản & Mật Khẩu Admin (Của bạn)</h3>
        {adminMsg && <p style={{ color: '#10b981', fontWeight: 'bold', marginBottom: '10px' }}>{adminMsg}</p>}
        <form onSubmit={handleUpdateAdmin} className="form-grid">
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Tài khoản Admin mới</label>
            <input 
              type="text" 
              value={adminUser} 
              onChange={(e) => setAdminUser(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Mật khẩu Admin mới</label>
            <input 
              type="password" 
              value={adminPass} 
              onChange={(e) => setAdminPass(e.target.value)} 
              required 
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" className="btn-add" style={{ background: '#c59d5f', width: '100%' }}>
              💾 Lưu Thay Đổi Admin
            </button>
          </div>
        </form>
      </div>

      {/* KHU VỰC 2: THÊM TÀI KHOẢN NHÂN VIÊN */}
      <div className="admin-form" style={{ borderLeft: '4px solid #10b981' }}>
        <h3>➕ Tạo Tài Khoản Nhân Viên Mới</h3>
        <form onSubmit={handleAddStaff}>
          <div className="form-grid">
            <input 
              type="text" 
              placeholder="Tên nhân viên (VD: Nguyễn Văn A)" 
              value={staffName} 
              onChange={(e) => setStaffName(e.target.value)} 
              required 
            />
            <input 
              type="text" 
              placeholder="Tên đăng nhập (VD: nv_nam)" 
              value={staffUsername} 
              onChange={(e) => setStaffUsername(e.target.value)} 
              required 
            />
            <input 
              type="password" 
              placeholder="Mật khẩu" 
              value={staffPassword} 
              onChange={(e) => setStaffPassword(e.target.value)} 
              required 
            />
            <select value={staffPosition} onChange={(e) => setStaffPosition(e.target.value)}>
              <option value="Phục vụ">Phục vụ (Bồi bàn)</option>
              <option value="Thu ngân">Thu ngân</option>
              <option value="Bếp trưởng">Bộ phận Bếp</option>
            </select>
          </div>
          <button type="submit" className="btn-add" style={{ marginTop: '12px' }}>
            ➕ Tạo Tài Khoản Nhân Viên
          </button>
        </form>
      </div>

      {/* KHU VỰC 3: DANH SÁCH TÀI KHOẢN NHÂN VIÊN */}
      <h3>📋 Danh Sách Nhân Viên Hiện Có ({staffList.length})</h3>
      <table className="admin-table" style={{ marginTop: '15px' }}>
        <thead>
          <tr>
            <th>Tên Nhân Viên</th>
            <th>Tên Đăng Nhập</th>
            <th>Mật Khẩu</th>
            <th>Chức Vụ</th>
            <th>Hành Động</th>
          </tr>
        </thead>
        <tbody>
          {staffList.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                Chưa có tài khoản nhân viên nào. Hãy tạo ở form trên!
              </td>
            </tr>
          ) : (
            staffList.map((st) => (
              <tr key={st.id}>
                <td><strong>{st.name}</strong></td>
                <td><code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>{st.username}</code></td>
                <td><code>•••••• ({st.password})</code></td>
                <td><span className="badge-pos">{st.position}</span></td>
                <td>
                  <button 
                    className="btn-delete" 
                    onClick={() => handleDeleteStaff(st.id, st.name)}
                  >
                    🗑️ Xóa Tài Khoản
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ManageStaff;