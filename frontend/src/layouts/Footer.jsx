import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <h3>Nhà Hàng Sang Trọng L’Amour</h3>
        <p>📍 Địa chỉ: 123 Đường Ẩm Thực, Quận 1, TP. Hồ Chí Minh</p>
        <p>📞 Hotline: 1900 xxxx | ✉️ Email: contact@lamour.com</p>
        <div className="footer-rights">
          &copy; 2026 L’Amour Restaurant. All rights reserved. | <a href="/admin" className="admin-link">Quản trị</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;