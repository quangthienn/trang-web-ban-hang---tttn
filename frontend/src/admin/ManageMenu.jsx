import React, { useState, useEffect } from 'react';

function ManageMenu() {
  const [menuList, setMenuList] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Hải Sản');
  const [image, setImage] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Lấy danh sách thực đơn từ Backend
  const fetchMenu = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/menu');
      const data = await res.json();
      setMenuList(data);
    } catch (error) {
      console.error('Lỗi lấy menu:', error);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  // 2. Hàm Thêm Món
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !price) return alert('Vui lòng điền đủ Tên và Giá!');

    const newDish = {
      name: name.trim(),
      price: Number(price),
      category,
      image: image.trim() || 'https://via.placeholder.com/150',
      desc: desc.trim()
    };

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDish)
      });

      if (res.ok) {
        alert('🎉 Thêm món mới thành công!');
        setName(''); setPrice(''); setImage(''); setDesc('');
        fetchMenu(); // Tải lại menu mới
      }
    } catch (error) {
      alert('❌ Lỗi kết nối Backend!');
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ 3. HÀM XÓA MÓN ĂN (Sửa đoạn này)
  const handleDeleteMenuItem = async (id) => {
    if (!id) {
      alert('❌ Không tìm thấy ID món ăn!');
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn xóa món này khỏi Database?')) return;

    try {
      const res = await fetch(`http://localhost:5000/api/menu/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        alert('🗑️ Đã xóa món ăn thành công!');
        // Lọc món đã xóa ra khỏi State ngay lập tức
        setMenuList(prev => prev.filter(item => (item._id || item.id) !== id));
      } else {
        alert('❌ Không thể xóa món ăn từ Server!');
      }
    } catch (error) {
      console.error('Lỗi khi xóa:', error);
      alert('❌ Lỗi kết nối Server!');
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      {/* FORM THÊM MÓN */}
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', marginBottom: '30px' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Thêm Món Ăn Mới</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="text" placeholder="Tên món" value={name} onChange={e => setName(e.target.value)} required style={{ flex: 1, padding: '8px' }} />
            <input type="number" placeholder="Giá tiền" value={price} onChange={e => setPrice(e.target.value)} required style={{ flex: 1, padding: '8px' }} />
            <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '8px' }}>
              <option value="Món Chính">Món Chính</option>
              <option value="Hải Sản">Hải Sản</option>
              <option value="Khai Vị">Khai Vị</option>
              <option value="Tráng Miệng">Tráng Miệng</option>
            </select>
          </div>
          <input type="url" placeholder="Link ảnh (https://...)" value={image} onChange={e => setImage(e.target.value)} style={{ padding: '8px' }} />
          <textarea placeholder="Mô tả..." value={desc} onChange={e => setDesc(e.target.value)} style={{ padding: '8px' }} />
          <button type="submit" disabled={loading} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? 'Đang lưu...' : 'Thêm Món Vào Menu'}
          </button>
        </form>
      </div>

      {/* DANH SÁCH MÓN */}
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Danh Sách Món Ăn Hiện Tại ({menuList.length})</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
              <th style={{ padding: '10px' }}>Hình Ảnh</th>
              <th style={{ padding: '10px' }}>Tên Món</th>
              <th style={{ padding: '10px' }}>Danh Mục</th>
              <th style={{ padding: '10px' }}>Giá</th>
              <th style={{ padding: '10px' }}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {menuList.map((item) => {
              // Lấy ID chính xác của MongoDB là _id
              const itemId = item._id || item.id;

              return (
                <tr key={itemId} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>
                    <img src={item.image} alt={item.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                  </td>
                  <td style={{ padding: '10px' }}><strong>{item.name}</strong></td>
                  <td style={{ padding: '10px' }}>{item.category}</td>
                  <td style={{ padding: '10px' }}>{Number(item.price).toLocaleString('vi-VN')} đ</td>
                  <td style={{ padding: '10px' }}>
                    <button
                      onClick={() => handleDeleteMenuItem(itemId)}
                      style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Xóa Món
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ManageMenu;