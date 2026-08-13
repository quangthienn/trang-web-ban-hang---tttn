import React, { useState, useEffect } from 'react';

// 🌐 Khai báo link Backend Render Online tại đây:
const API_URL = 'https://trang-web-ban-hang-tttn.onrender.com';

function ManageStaff() {
  const [staffList, setStaffList] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('WAITER'); // Mặc định là Phục vụ

  // 1. Tải danh sách nhân viên từ Backend
  const fetchStaff = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users`);
      const data = await res.json();
      setStaffList(data);
    } catch (error) {
      console.error('Lỗi tải danh sách nhân viên:', error);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // 2. Admin thêm nhân viên mới và phân công Bộ phận
  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!username || !password || !name) return alert('Vui lòng điền đầy đủ thông tin!');

    const newStaff = { username, password, name, role };

    try {
      const res = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStaff)
      });

      if (res.ok) {
        alert(`🎉 Đã thêm và phân công nhân viên ${name} vào bộ phận ${getRoleName(role)}!`);
        setUsername('');
        setPassword('');
        setName('');
        fetchStaff();
      } else {
        alert('❌ Tên đăng nhập/Mã nhân viên đã tồn tại!');
      }
    } catch (error) {
      alert('❌ Lỗi kết nối Server!');
    }
  };

  // 3. Xóa nhân viên
  const handleDeleteStaff = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa nhân viên này?')) return;
    try {
      await fetch(`${API_URL}/api/users/${id}`, { method: 'DELETE' });
      fetchStaff();
    } catch (error) {
      console.error('Lỗi xóa nhân viên:', error);
      alert('❌ Lỗi kết nối Server!');
    }
  };

  // Chuyển đổi mã Role sang tiếng Việt
  const getRoleName = (r) => {
    switch (r) {
      case 'ADMIN': return '👑 Quản Lý Trưởng';
      case 'WAITER': return '🛎️ Phục Vụ / Gọi Món';
      case 'KITCHEN': return '👨‍🍳 Nhân Viên Bếp';
      case 'CASHIER': return '💵 Thu Ngân';
      default: return r;
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', color: '#1f2937' }}>
      {/* FORM PHÂN CÔNG NHÂN VIÊN */}
      <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0 }}>👥 Phân Công & Tạo Tài Khoản Nhân Viên</h3>
        <form onSubmit={handleAddStaff} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <input
            type="text"
            placeholder="Mã/Tên đăng nhập (VD: nv_phucvu01)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            required
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            required
          />
          <input
            type="text"
            placeholder="Họ và Tên nhân viên"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            required
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontWeight: 'bold' }}
          >
            <option value="WAITER">🛎️ Bộ Phận: Phục Vụ</option>
            <option value="KITCHEN">👨‍🍳 Bộ Phận: Bếp</option>
            <option value="CASHIER">💵 Bộ Phận: Thu Ngân</option>
            <option value="ADMIN">👑 Bộ Phận: Admin Quản Lý</option>
          </select>
          <button
            type="submit"
            style={{ gridColumn: 'span 2', padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            ➕ LƯU & PHÂN CÔNG TÀI KHOẢN
          </button>
        </form>
      </div>

      {/* BẢNG DANH SÁCH NHÂN VIÊN */}
      <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0 }}>📋 Danh Sách Nhân Viên Hiện Tại</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
              <th style={{ padding: '10px' }}>Mã / Username</th>
              <th style={{ padding: '10px' }}>Họ Tên</th>
              <th style={{ padding: '10px' }}>Bộ Phận Đảm Nhận</th>
              <th style={{ padding: '10px' }}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {staffList.map((user) => (
              <tr key={user._id || user.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}><code>{user.username}</code></td>
                <td style={{ padding: '10px' }}><strong>{user.name}</strong></td>
                <td style={{ padding: '10px' }}>
                  <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 8px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}>
                    {getRoleName(user.role)}
                  </span>
                </td>
                <td style={{ padding: '10px' }}>
                  <button
                    onClick={() => handleDeleteStaff(user._id || user.id)}
                    style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ManageStaff;