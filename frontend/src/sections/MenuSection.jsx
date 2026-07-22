import React, { useState } from 'react';
import MenuCard from '../components/Menu/MenuCard';

const initialMenuData = [
  { id: 1, name: "Sườn Cừu Nướng Thảo Mộc", price: "450.000đ", category: "Món Chính", desc: "Sườn cừu tươi nướng kèm sốt vang đỏ và khoai tây nghiền mịn.", image: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600" },
  { id: 2, name: "Salad Cá Hồi Áp Chảo", price: "280.000đ", category: "Hải Sản", desc: "Cá hồi áp chảo, rau mầm hữu cơ cùng sốt chanh dây thanh mát.", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600" },
  { id: 3, name: "Pizza Hải Sản Hoàng Gia", price: "320.000đ", category: "Hải Sản", desc: "Tôm, mực, nghêu kết hợp lớp phô mai Mozzarella béo ngậy.", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=600" },
  { id: 4, name: "Bánh Kem Dâu Tây Pháp", price: "120.000đ", category: "Tráng Miệng", desc: "Bánh mousse dâu tây mềm mịn ngọt ngào chuẩn phong cách Pháp.", image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=600" }
];

const MenuSection = ({ menuList = initialMenuData }) => {
  const [activeCategory, setActiveCategory] = useState("Tất Cả");

  const filteredMenu = activeCategory === "Tất Cả" 
    ? menuList 
    : menuList.filter(item => item.category === activeCategory);

  return (
    <section id="menu" className="menu-section">
      <div className="title-area">
        <h2>Thực Đơn Nổi Bật</h2>
        <p>Thưởng thức những hương vị tinh hoa độc bản tại L’Amour</p>
      </div>

      <div className="filter-buttons">
        {["Tất Cả", "Món Chính", "Hải Sản", "Tráng Miệng"].map((cat) => (
          <button 
            key={cat} 
            className={`btn-filter ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      
      <div className="menu-grid">
        {filteredMenu.map(item => (
          <MenuCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
};

export default MenuSection;