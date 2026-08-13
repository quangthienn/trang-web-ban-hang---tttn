import React, { useState, useEffect } from 'react';

function WaiterInterface() {
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  
  const [selectedTable, setSelectedTable] = useState(null);
  const [cart, setCart] = useState([]); 
  const [loading, setLoading] = useState(false);

  // Tải dữ liệu từ Backend
  const fetchData = async () => {
    try {
      const [resTables, resMenu, resOrders] = await Promise.all([
        fetch('http://localhost:5000/api/tables').then(r => r.json()),
        fetch('http://localhost:5000/api/menu').then(r => r.json()),
        fetch('http://localhost:5000/api/orders').then(r => r.json())
      ]);

      setTables(resTables);
      setMenuItems(resMenu);
      setOrders(resOrders.filter(o => o.status !== 'PAID' && o.status !== 'CANCELLED'));
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 3000); 
    return () => clearInterval(timer);
  }, []);

  // Kiểm tra bàn đang có khách hay trống (Đỏ nếu status = OCCUPIED HOẶC đang có Order chưa thanh toán)
  const checkIsOccupied = (table) => {
    const hasActiveOrder = orders.some(
      o => (o.tableCode === table.code || o.tableName === table.name) && o.status !== 'PAID'
    );
    return table.status === 'OCCUPIED' || hasActiveOrder;
  };

  const totalTables = tables.length;
  const occupiedCount = tables.filter(t => checkIsOccupied(t)).length;
  const availableCount = totalTables - occupiedCount;

  // Mở Popup chọn món
  const handleSelectTable = (table) => {
    setSelectedTable(table);
    const existingOrder = orders.find(
      o => (o.tableCode === table.code || o.tableName === table.name) && o.status !== 'PAID'
    );
    if (existingOrder) {
      setCart(existingOrder.items || []);
    } else {
      setCart([]); 
    }
  };

  // Thêm món vào giỏ
  const handleAddToCart = (item) => {
    setCart(prev => {
      const exist = prev.find(i => i.menuItemId === item._id || i.name === item.name);
      if (exist) {
        return prev.map(i =>
          (i.menuItemId === item._id || i.name === item.name)
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { menuItemId: item._id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  // Tăng/Giảm số lượng
  const handleUpdateQty = (idx, delta) => {
    setCart(prev => {
      const updated = [...prev];
      updated[idx].quantity += delta;
      if (updated[idx].quantity <= 0) {
        updated.splice(idx, 1);
      }
      return updated;
    });
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // 🚀 GỬI ORDER VÀ LƯU VÀO DATABASE
  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      alert('⚠️ Vui lòng chọn ít nhất 1 món!');
      return;
    }

    setLoading(true);

    try {
      // 1. Lưu Order & Đổi Bàn ở Backend
      const orderData = {
        tableId: selectedTable._id, // 👈 TRUYỀN TRỰC TIẾP ID BÀN
        tableCode: selectedTable.code || selectedTable.name,
        tableName: selectedTable.name,
        items: cart,
        totalAmount,
        status: 'PENDING'
      };

      const res = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      // 2. Ép cập nhật trạng thái Bàn qua API Bàn
      await fetch(`http://localhost:5000/api/tables/${selectedTable._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'OCCUPIED' })
      });

      if (res.ok) {
        alert(`🎉 Đã lưu Order thành công! ${selectedTable.name} đã khóa màu ĐỎ.`);
        setSelectedTable(null);
        await fetchData(); // Tải lại dữ liệu chuẩn từ Database
      }
    } catch (err) {
      alert('❌ Lỗi khi gửi Order!');
    } finally {
      setLoading(false);
    }
  };

  // 🚪 TRẢ BÀN
  const handleReleaseTable = async () => {
    if (!window.confirm(`Xác nhận trả ${selectedTable.name} về BÀN TRỐNG?`)) return;

    setLoading(true);
    try {
      await fetch(`http://localhost:5000/api/tables/${selectedTable._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'AVAILABLE' })
      });

      alert('🟢 Bàn đã được trả về BÀN TRỐNG!');
      setSelectedTable(null);
      await fetchData();
    } catch (err) {
      alert('❌ Lỗi khi trả bàn!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#111827', minHeight: '90vh', color: '#fff', fontFamily: 'sans-serif' }}>
      
      {/* BANNER THỐNG KÊ */}
      <div style={{ background: '#1f2937', padding: '16px 20px', borderRadius: '12px', marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#fbbf24' }}>🛎️ Sơ Đồ Bàn / Quản Lý Order</h2>
        
        <div style={{ display: 'flex', gap: '20px', fontSize: '15px', fontWeight: 'bold' }}>
          <span style={{ color: '#9ca3af' }}>📊 Tổng số: {totalTables} bàn</span>
          <span style={{ color: '#10b981' }}>🟢 Bàn trống: {availableCount}</span>
          <span style={{ color: '#ef4444' }}>🔴 Đang có khách: {occupiedCount}</span>
        </div>

        {availableCount <= 2 && availableCount > 0 && (
          <div style={{ marginTop: '12px', background: '#f59e0b', color: '#000', padding: '10px 15px', borderRadius: '8px', fontWeight: 'bold' }}>
            ⚠️ CHÚ Ý: Nhà hàng chỉ còn {availableCount} bàn trống!
          </div>
        )}
      </div>

      {/* DANH SÁCH 10 BÀN */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
        {tables.map((table) => {
          const isOccupied = checkIsOccupied(table);

          return (
            <div
              key={table._id}
              onClick={() => handleSelectTable(table)}
              style={{
                background: isOccupied ? '#7f1d1d' : '#064e3b',
                border: `2px solid ${isOccupied ? '#ef4444' : '#10b981'}`,
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
              }}
            >
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{table.name}</h3>
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  backgroundColor: isOccupied ? '#ef4444' : '#10b981',
                  color: '#fff',
                  marginBottom: '10px'
                }}
              >
                {isOccupied ? '🔴 ĐANG CÓ KHÁCH' : '🟢 BÀN TRỐNG'}
              </span>

              <button
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  backgroundColor: isOccupied ? '#ef4444' : '#f59e0b',
                  color: '#fff'
                }}
              >
                {isOccupied ? '✏️ Xem / Sửa Order' : '📝 TÍCH CHỌN MÓN'}
              </button>
            </div>
          );
        })}
      </div>

      {/* POPUP CHỌN MÓN */}
      {selectedTable && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1f2937', width: '90%', maxWidth: '900px', height: '80vh', borderRadius: '12px', display: 'grid', gridTemplateColumns: '1.5fr 1fr', overflow: 'hidden' }}>
            
            {/* CỘT MENU */}
            <div style={{ padding: '20px', overflowY: 'auto', borderRight: '1px solid #374151' }}>
              <h3 style={{ marginTop: 0, color: '#fbbf24' }}>🍽️ Danh Sách Món Ăn</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                {menuItems.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => handleAddToCart(item)}
                    style={{ background: '#374151', padding: '12px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', border: '1px solid #4b5563' }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '14px' }}>{item.name}</div>
                    <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '13px' }}>{item.price?.toLocaleString()}đ</div>
                  </div>
                ))}
              </div>
            </div>

            {/* CỘT GIỎ HÀNG */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#111827' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #374151', paddingBottom: '10px' }}>
                  <h3 style={{ margin: 0, color: '#10b981' }}>📌 Order: {selectedTable.name}</h3>
                  <button onClick={() => setSelectedTable(null)} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '22px', cursor: 'pointer' }}>✕</button>
                </div>

                <div style={{ marginTop: '15px', maxHeight: '350px', overflowY: 'auto' }}>
                  {cart.length === 0 ? (
                    <p style={{ color: '#9ca3af', textAlign: 'center', marginTop: '40px' }}>👈 Bấm chọn món bên trái để thêm vào order!</p>
                  ) : (
                    cart.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', background: '#1f2937', padding: '8px 12px', borderRadius: '6px' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{item.name}</div>
                          <div style={{ fontSize: '12px', color: '#9ca3af' }}>{item.price?.toLocaleString()}đ</div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button onClick={() => handleUpdateQty(idx, -1)} style={{ background: '#ef4444', color: '#fff', border: 'none', width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer' }}>-</button>
                          <span style={{ fontWeight: 'bold' }}>{item.quantity}</span>
                          <button onClick={() => handleAddToCart(item)} style={{ background: '#10b981', color: '#fff', border: 'none', width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* NÚT BẤM HÀNH ĐỘNG */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid #374151', fontSize: '18px', fontWeight: 'bold' }}>
                  <span>Tổng tiền:</span>
                  <span style={{ color: '#fbbf24' }}>{totalAmount.toLocaleString()} đ</span>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  {checkIsOccupied(selectedTable) && (
                    <button
                      onClick={handleReleaseTable}
                      disabled={loading}
                      style={{ flex: 1, padding: '12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      🚪 Trả Bàn Trống
                    </button>
                  )}

                  <button
                    onClick={handleSubmitOrder}
                    disabled={loading}
                    style={{ flex: 2, padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}
                  >
                    {loading ? '⏳ Đang lưu...' : '🚀 XÁC NHẬN GỬI ORDER'}
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default WaiterInterface;