import React, { useState } from 'react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="logo">
        <a href="/">L’Amour <span>Restaurant</span></a>
      </div>
      
      <ul className={`nav-links ${isOpen ? 'active' : ''}`}>
        <li><a href="#home" onClick={() => setIsOpen(false)}>Trang Chủ</a></li>
        <li><a href="#menu" onClick={() => setIsOpen(false)}>Thực Đơn</a></li>
        <li><a href="#booking" onClick={() => setIsOpen(false)}>Đặt Bàn</a></li>
      </ul>

      <div className="nav-actions">
        <a href="#booking" className="btn-gold nav-btn-pc">Đặt Bàn Ngay</a>
      </div>

      <div className="hamburger" onClick={() => setIsOpen(!isOpen)}>
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </div>
    </nav>
  );
};

export default Navbar;