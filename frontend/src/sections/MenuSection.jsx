import React, { useState, useEffect } from 'react';

function MenuSection() {
  const [menuItems, setMenuItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Tất Cả');
  const [loading, setLoading] = useState(true);

  // 🔄 Gọi API lấy danh sách món thực tế từ Database
  const fetchMenu = async () => {
    try {
      // ⚠️ Đảm bảo đúng URL API lấy danh sách món của Backend (VD: /api/menu hoặc /api/dishes)
      const res = await fetch('http://localhost:5000/api/menu'); 
      if (res.ok) {
        const data = await res.json();
        setMenuItems(data);
      }
    } catch (error) {
      console.error('❌ Lỗi tải danh sách thực đơn:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  // Lấy danh sách các Danh Mục (Category) động từ dữ liệu món ăn
  const categories = ['Tất Cả', ...new Set(menuItems.map((item) => item.category).filter(Boolean))];

  // Lọc món theo Danh Mục đang chọn
  const filteredItems = activeCategory === 'Tất Cả'
    ? menuItems
    : menuItems.filter((item) => item.category === activeCategory);

  return (
    <section id="menu" style={{ padding: '60px 20px', backgroundColor: '#f9fafb' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', marginBottom: '10px' }}>
          🍽️ THỰC ĐƠN NHÀ HÀNG
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '30px' }}>
          Thưởng thức những hương vị tinh hoa ẩm thực được chuẩn bị từ các siêu đầu bếp.
        </p>

        {/* 🏷️ BỘ LỌC DANH MỤC (Nhiều món / Món chính / Hải sản / Tráng miệng...) */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '40px' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                transition: 'all 0.2s',
                backgroundColor: activeCategory === cat ? '#eab308' : '#e5e7eb',
                color: activeCategory === cat ? '#fff' : '#374151'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 📦 DANH SÁCH MÓN ĂN */}
        {loading ? (
          <div style={{ padding: '40px', color: '#6b7280' }}>⏳ Đang tải thực đơn mới nhất...</div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: '40px', color: '#9ca3af' }}>Chưa có món ăn nào trong danh mục này.</div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '25px',
            textAlign: 'left'
          }}>
            {filteredItems.map((item) => (
              <div
                key={item._id || item.id}
                style={{
                  background: '#fff',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Ảnh món ăn */}
                <img
                  src={item.image || 'https://via.placeholder.com/300x200?text=No+Image'}
                  alt={item.name}
                  style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                />

                {/* Thông tin món */}
                <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#1f2937' }}>{item.name}</h3>
                    <span style={{ fontWeight: 'bold', color: '#d97706', fontSize: '16px' }}>
                      {Number(item.price).toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 15px 0', flexGrow: 1 }}>
                    {item.description || 'Món ăn thơm ngon, chuẩn vị nhà hàng.'}
                  </p>

                  <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '500' }}>
                    📁 {item.category || 'Món chung'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default MenuSection;