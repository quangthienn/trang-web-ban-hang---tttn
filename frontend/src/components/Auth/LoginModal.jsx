// src/components/Auth/LoginModal.jsx
import React, { useState } from 'react';

const LoginModal = ({ accounts, onLoginSuccess, onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    // Tìm tài khoản khớp Username & Password trong danh sách
    const userFound = accounts.find(
      (acc) => acc.username.trim() === username.trim() && acc.password === password
    );

    if (userFound) {
      setError('');
      onLoginSuccess(userFound); // Trả về thông tin user tìm thấy (Admin hoặc Staff)
    } else {
      setError('Tài khoản hoặc mật khẩu không chính xác!');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose} title="Quay về trang chủ">&times;</button>
        <h2>🔒 Đăng Nhập Hệ Thống</h2>
        <p className="modal-sub">Dành cho Quản lý & Nhân viên L’Amour Restaurant</p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Tài khoản</label>
            <input 
              type="text" 
              placeholder="Nhập tên tài khoản..." 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <input 
              type="password" 
              placeholder="Nhập mật khẩu..." 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-login-submit">Đăng Nhập</button>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;