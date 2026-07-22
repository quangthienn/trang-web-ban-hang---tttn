// src/admin/AdminLayout.jsx
import React, { useState } from 'react';
import ManageStaff from './ManageStaff';

const AdminLayout = ({ 
  currentUser, 
  accounts, 
  onUpdateAccounts, 
  onExitAdmin, 
  menuList, 
  onAddMenu, 
  onDeleteMenu 
}) => {
  // State quản lý Tab đang chọn: 'menu' hoặc 'staff'
  const [activeTab, setActiveTab] = useState('menu');

  // State cho Form Thêm Món
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Món Chính');
  const [desc, setDesc] = useState('');
  const [image, setImage] = useState('');

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!name || !price) return alert("Vui lòng điền tên và giá món!");
    
    onAddMenu({
      id: Date.now(),
      name,
      price: price.includes('đ') ? price : `${price}đ`,
      category,
      desc,
      image: image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600"
    });

    setName('');
    setPrice('');
    setDesc('');
    setImage('');
    alert("Thêm món vào thực đơn thành công!");
  };

  return (
    <div className="admin-wrapper">
      {/* 1. THANH MENU BÊN TRÁI (SIDEBAR) */}
      <div className="admin-sidebar">
        <div className="admin-logo">
          L’Amour <span>Admin</span>
        </div>

        <div style={{ marginBottom: '20px', fontSize: '13px', color: '#94a3b8' }}>
          👋 Xin chào, <strong>{currentUser?.name || 'Admin'}</strong>
        </div>

        <ul className="sidebar-menu">
          <li 
            className={activeTab === 'menu' ? 'active' : ''} 
            onClick={() => setActiveTab('menu')}
          >
            🍽️ Quản lý Menu
          </li>
          <li 
            className={activeTab === 'staff' ? 'active' : ''} 
            onClick={() => setActiveTab('staff')}
          >
            👥 Quản lý Nhân sự
          </li>
        </ul>

        <button className="btn-exit-admin" onClick={onExitAdmin}>
          🚪 Đăng xuất / Thoát
        </button>
      </div>

      {/* 2. NỘI DUNG CHÍNH (MAIN CONTENT) */}
      <div className="admin-main">
        {activeTab === 'menu' ? (
          /* --- TAB 1: QUẢN LÝ MENU --- */
          <div className="admin-content">
            <h2>🍽️ Quản Lý Thực Đơn (Menu)</h2>

            {/* FORM THÊM MÓN */}
            <div className="admin-form">
              <h3>➕ Thêm Món Ăn Mới</h3>
              <form onSubmit={handleFormSubmit}>
                <div className="form-grid">
                  <input 
                    type="text" 
                    placeholder="Tên món ăn" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                  />
                  <input 
                    type="text" 
                    placeholder="Giá (VD: 250.000đ)" 
                    value={price} 
                    onChange={(e) => setPrice(e.target.value)} 
                    required 
                  />
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="Món Chính">Món Chính</option>
                    <option value="Hải Sản">Hải Sản</option>
                    <option value="Tráng Miệng">Tráng Miệng</option>
                  </select>
                  <input 
                    type="text" 
                    placeholder="Link hình ảnh (URL)" 
                    value={image} 
                    onChange={(e) => setImage(e.target.value)} 
                  />
                </div>
                <textarea 
                  placeholder="Mô tả món ăn ngắn gọn..." 
                  rows="2"
                  value={desc} 
                  onChange={(e) => setDesc(e.target.value)} 
                ></textarea>
                <button type="submit" className="btn-add" style={{ marginTop: '10px' }}>
                  ➕ Thêm Vào Thực Đơn
                </button>
              </form>
            </div>

            {/* DANH SÁCH MÓN ĂN */}
            <h3>📋 Danh Sách Món Ăn ({menuList.length})</h3>
            <table className="admin-table" style={{ marginTop: '15px' }}>
              <thead>
                <tr>
                  <th>Ảnh</th>
                  <th>Tên Món</th>
                  <th>Danh Mục</th>
                  <th>Giá Bán</th>
                  <th>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {menuList.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <img src={item.image} alt={item.name} className="table-img" />
                    </td>
                    <td><strong>{item.name}</strong></td>
                    <td><span className="badge">{item.category}</span></td>
                    <td><strong style={{ color: '#c59d5f' }}>{item.price}</strong></td>
                    <td>
                      <button className="btn-delete" onClick={() => onDeleteMenu(item.id)}>
                        🗑️ Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* --- TAB 2: QUẢN LÝ NHÂN SỰ --- */
          <ManageStaff 
            accounts={accounts} 
            onUpdateAccounts={onUpdateAccounts} 
            currentUser={currentUser} 
          />
        )}
      </div>
    </div>
  );
};

export default AdminLayout;