import React from 'react';

const MenuCard = ({ item }) => {
  return (
    <div className="menu-card">
      <div className="menu-img" style={{ backgroundImage: `url(${item.image})` }}>
        <span className="menu-tag">{item.category}</span>
      </div>
      <div className="menu-info">
        <div className="menu-title-row">
          <h3>{item.name}</h3>
          <span className="price">{item.price}</span>
        </div>
        <p>{item.desc}</p>
        
        {/* Khách chỉ xem menu, không bấm đặt ở đây nữa */}
      </div>
    </div>
  );
};

export default MenuCard;