import React, { useState } from 'react';

const API_URL = 'https://trang-web-ban-hang-tttn.onrender.com';

function ChangePasswordModal({ currentUser, onClose }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    // Kiểm tra mật khẩu khớp nhau
    if (newPassword !== confirmPassword) {
      return setMsg({ type: 'error', text: 'Mật khẩu mới không trùng khớp!' });
    }

    if (newPassword.length < 6) {
      return setMsg({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự!' });
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/users/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser._id,
          oldPassword: oldPassword,
          newPassword: newPassword
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMsg({ type: 'success', text: '🎉 Đổi mật khẩu thành công!' });
        setTimeout(() => {
          onClose(); // Đóng modal sau 1.5s
        }, 1500);
      } else {
        setMsg({ type: 'error', text: data.message || 'Thất bại!' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: '❌ Lỗi kết nối máy chủ!' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: '#1f2937', color: '#fff', padding: '25px',
        borderRadius: '12px', width: '340px', boxShadow: '0 5px 20px rgba(0,0,0,0.5)'
      }}>
        <h3 style={{ marginTop: 0, color: '#fbbf24', textAlign: 'center' }}>🔑 ĐỔI MẬT KHẨU</h3>

        {msg.text && (
          <div style={{
            padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '15px', textAlign: 'center',
            background: msg.type === 'error' ? '#ef4444' : '#10b981', color: '#fff', fontWeight: 'bold'
          }}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#d1d5db' }}>Mật khẩu hiện tại:</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #374151', background: '#111827', color: '#fff', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#d1d5db' }}>Mật khẩu mới:</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #374151', background: '#111827', color: '#fff', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#d1d5db' }}>Nhập lại mật khẩu mới:</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #374151', background: '#111827', color: '#fff', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '10px', background: '#4b5563', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ flex: 1, padding: '10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {loading ? '⏳ Lưu...' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChangePasswordModal;