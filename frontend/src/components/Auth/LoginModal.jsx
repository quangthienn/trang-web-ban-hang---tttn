import React, { useState } from 'react';

function LoginModal({ isOpen = true, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Nếu không ở trạng thái mở thì không hiển thị
  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        onLoginSuccess(data);
      } else {
        setError(data.message || 'Mật khẩu hoặc tài khoản không đúng!');
      }
    } catch (err) {
      setError('❌ Không thể kết nối tới Server!');
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Lớp nền tối bao phủ toàn màn hình (Overlay) */
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      fontFamily: 'sans-serif'
    }}>
      {/* Khung Modal đăng nhập */}
      <div style={{
        background: '#1f2937',
        padding: '30px',
        borderRadius: '12px',
        width: '340px',
        color: '#fff',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        position: 'relative'
      }}>
        {/* Nút X đóng Modal (nếu truyền prop onClose) */}
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '15px',
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              fontSize: '20px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        )}

        <h2 style={{ textAlign: 'center', color: '#fbbf24', marginTop: 0, marginBottom: '20px' }}>
          🔐 ĐĂNG NHẬP
        </h2>

        {error && (
          <div style={{ background: '#ef4444', color: '#fff', padding: '8px', borderRadius: '6px', marginBottom: '15px', fontSize: '13px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#d1d5db' }}>Tên đăng nhập:</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập username..."
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #374151',
                background: '#374151',
                color: '#fff',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#d1d5db' }}>Mật khẩu:</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập password..."
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #374151',
                background: '#374151',
                color: '#fff',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '15px'
            }}
          >
            {loading ? '⏳ Đang kiểm tra...' : 'ĐĂNG NHẬP'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginModal;