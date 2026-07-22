import React, { useState } from 'react';

const ManageMenu = ({ menuList, onAddMenu, onDeleteMenu }) => {
  const [newItem, setNewItem] = useState({
    name: '', price: '', category: 'Món Chính', desc: '', image: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) return alert("Vui lòng điền tên món và giá!");
    
    // Tạo link ảnh mặc định nếu không nhập
    const itemToAdd = {
      ...newItem,
      id: Date.now(),
      image: newItem.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600'
    };

    onAddMenu(itemToAdd);
    setNewItem({ name: '', price: '', category: 'Món Chính', desc: '', image: '' });
    alert("Thêm món ăn thành công!");
  };

  return (
    <div className="admin-content">
      <h2> Quản Lý Thực Đơn</h2>

      {/* Form thêm món */}
      <form className="admin-form" onSubmit={handleSubmit}>
        <h3>Thêm Món Ăn Mới</h3>
        <div className="form-grid">
          <input 
            type="text" placeholder="Tên món ăn" required 
            value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} 
          />
          <input 
            type="text" placeholder="Giá (ví dụ: 250.000đ)" required 
            value={newItem.price} onChange={(e) => setNewItem({...newItem, price: e.target.value})} 
          />
          <select value={newItem.category} onChange={(e) => setNewItem({...newItem, category: e.target.value})}>
            <option value="Món Chính">Món Chính</option>
            <option value="Hải Sản">Hải Sản</option>
            <option value="Tráng Miệng">Tráng Miệng</option>
          </select>
          <input 
            type="text" placeholder="Link ảnh món (URL)" 
            value={newItem.image} onChange={(e) => setNewItem({...newItem, image: e.target.value})} 
          />
        </div>
        <textarea 
          placeholder="Mô tả ngắn món ăn" rows="2" 
          value={newItem.desc} onChange={(e) => setNewItem({...newItem, desc: e.target.value})}
        ></textarea>
        <button type="submit" className="btn-add">Thêm Món Vào Menu</button>
      </form>

      {/* Bảng danh sách món ăn */}
      <h3>Danh Sách Món Ăn Hiện Tại ({menuList.length})</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Hình Ảnh</th>
            <th>Tên Món</th>
            <th>Danh Mục</th>
            <th>Giá Ban Đầu</th>
            <th>Hành Động</th>
          </tr>
        </thead>
        <tbody>
          {menuList.map(item => (
            <tr key={item.id}>
              <td><img src={item.image} alt={item.name} className="table-img" /></td>
              <td><strong>{item.name}</strong></td>
              <td><span className="badge">{item.category}</span></td>
              <td className="price-text">{item.price}</td>
              <td>
                <button className="btn-delete" onClick={() => onDeleteMenu(item.id)}>Xóa Món</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageMenu;