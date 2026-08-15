import React, { useState, useEffect } from 'react';

const API_URL = 'https://trang-web-ban-hang-tttn.onrender.com';

function WaiterInterface() {
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]); // 👈 Thêm state lưu đơn đặt bàn

  const [selectedTable, setSelectedTable] = useState(null);
  const [existingOrder, setExistingOrder] = useState(null); // Món cũ đã gọi
  const [newCart, setNewCart] = useState([]); // Món MỚI chọn ở lượt này
  const [loading, setLoading] = useState(false);

  // 1️⃣ Tải dữ liệu từ Backend (Lấy thêm API Reservations)
  const fetchData = async () => {
    try {
      const [resTables, resMenu, resOrders, resReservations] = await Promise.all([
        fetch(`${API_URL}/api/tables`).then((r) => r.json()).catch(() => []),
        fetch(`${API_URL}/api/products`).then((r) => r.json()).catch(async () => {
          return fetch(`${API_URL}/api/menu`).then((r) => r.json()).catch(() => []);
        }),
        fetch(`${API_URL}/api/orders`).then((r) => r.json()).catch(() => []),
        fetch(`${API_URL}/api/reservations`).then((r) => r.json()).catch(() => []) // 👈 Gọi thêm API Đặt bàn
      ]);

      const safeTables = Array.isArray(resTables) ? resTables : resTables.tables || resTables.data || [];
      const safeMenu = Array.isArray(resMenu) ? resMenu : resMenu.products || resMenu.menu || resMenu.data || [];
      const safeOrders = Array.isArray(resOrders) ? resOrders : resOrders.orders || resOrders.data || [];
      const safeReservations = Array.isArray(resReservations) ? resReservations : resReservations.reservations || resReservations.data || [];

      setTables(safeTables);
      setMenuItems(safeMenu);
      setOrders(safeOrders.filter((o) => o.status !== 'PAID' && o.status !== 'CANCELLED'));
      setReservations(safeReservations.filter((r) => r.status === 'APPROVED')); // 👈 Chỉ lấy các đơn ĐÃ DUYỆT
    } catch (err) {
      console.error('❌ Lỗi tải dữ liệu:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 4000);
    return () => clearInterval(timer);
  }, []);

  // 🟡 Bổ sung logic tính toán chuẩn 3 trạng thái bàn: OCCUPIED (Đỏ) | RESERVED (Vàng) | AVAILABLE (Xanh)
  const getTableStatus = (table) => {
    if (!table) return 'AVAILABLE';

    // 1. Kiểm tra bàn đang có khách ngồi (Có order chưa thanh toán) -> MÀU ĐỎ
    const hasActiveOrder = orders.some(
      (o) => (o.tableCode === table.code || o.tableName === table.name) && o.status !== 'PAID'
    );
    if (table.status === 'OCCUPIED' || hasActiveOrder) return 'OCCUPIED';

    // 2. Kiểm tra bàn có đơn ĐẶT BÀN đã được DUYỆT -> MÀU VÀNG
    const isReserved = reservations.some(
      (r) => r.tableId === table._id || r.tableName === table.name || r.tableName === table.code
    );
    if (table.status === 'RESERVED' || table.status === 'BOOKED' || isReserved) return 'RESERVED';

    // 3. Mặc định -> MÀU XANH
    return 'AVAILABLE';
  };

  // 2️⃣ Mở Popup chọn món cho bàn
  const handleSelectTable = (table) => {
    setSelectedTable(table);
    setNewCart([]); // Reset giỏ món MỚI

    // Tìm order hiện tại của bàn này (nếu có)
    const currentActiveOrder = orders.find(
      (o) => (o.tableCode === table.code || o.tableName === table.name) && o.status !== 'PAID'
    );
    setExistingOrder(currentActiveOrder || null);
  };

  // 3️⃣ Thêm món MỚI vào giỏ
  const handleAddToCart = (product) => {
    const prodId = product._id || product.id;
    setNewCart((prev) => {
      const exist = prev.find((i) => i.menuItemId === prodId);
      if (exist) {
        return prev.map((i) =>
          i.menuItemId === prodId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          menuItemId: prodId,
          name: product.name,
          price: product.price || 0,
          quantity: 1
        }
      ];
    });
  };

  // Tăng/Giảm số lượng món MỚI
  const handleUpdateQty = (prodId, delta) => {
    setNewCart((prev) => {
      return prev
        .map((item) => {
          if (item.menuItemId === prodId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const newCartTotal = newCart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // 4️⃣ GỬI ORDER XUỐNG BẾP
  const handleSubmitOrder = async () => {
    if (newCart.length === 0) {
      alert('⚠️ Vui lòng chọn ít nhất 1 món mới trước khi gửi!');
      return;
    }

    setLoading(true);

    try {
      if (existingOrder) {
        // TRƯỜNG HỢP 1: BÀN ĐÃ CÓ KHÁCH -> Chỉ gửi các món MỚI chọn
        const res = await fetch(`${API_URL}/api/orders/${existingOrder._id}/add-items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newItems: newCart })
        });

        if (res.ok) {
          alert(`🎉 Đã gửi gọi THÊM món thành công cho ${selectedTable.name}!`);
          setSelectedTable(null);
          await fetchData();
        } else {
          alert('❌ Lỗi khi gửi thêm món!');
        }
      } else {
        // TRƯỜNG HỢP 2: BÀN TRỐNG / ĐẶT TRƯỚC -> Tạo Order MỚI & Chuyển Bàn sang OCCUPIED (Đỏ)
        const orderData = {
          tableId: selectedTable._id,
          tableCode: selectedTable.code || selectedTable.name,
          tableName: selectedTable.name,
          items: newCart,
          totalAmount: newCartTotal,
          status: 'PENDING'
        };

        const resOrder = await fetch(`${API_URL}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });

        const tableId = selectedTable._id || selectedTable.id;
        await fetch(`${API_URL}/api/tables/${tableId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'OCCUPIED' })
        });

        if (resOrder.ok) {
          alert(`🎉 Đã mở bàn & gửi Order cho ${selectedTable.name}!`);
          setSelectedTable(null);
          await fetchData();
        } else {
          alert('❌ Lỗi tạo đơn hàng mới!');
        }
      }
    } catch (err) {
      console.error('Lỗi gửi order:', err);
      alert('❌ Lỗi kết nối khi gửi order!');
    } finally {
      setLoading(false);
    }
  };

  // 5️⃣ TRẢ BÀN TRỐNG
  const handleReleaseTable = async () => {
    if (!window.confirm(`Xác nhận giải phóng ${selectedTable.name} về BÀN TRỐNG?`)) return;

    setLoading(true);
    try {
      const tableId = selectedTable._id || selectedTable.id;
      await fetch(`${API_URL}/api/tables/${tableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'AVAILABLE' })
      });

      alert('🟢 Bàn đã chuyển về BÀN TRỐNG!');
      setSelectedTable(null);
      await fetchData();
    } catch (err) {
      alert('❌ Lỗi khi trả bàn!');
    } finally {
      setLoading(false);
    }
  };

  const safeTables = Array.isArray(tables) ? tables : [];
  const safeMenu = Array.isArray(menuItems) ? menuItems : [];
  const totalTables = safeTables.length;

  // Đếm số lượng theo 3 trạng thái
  const occupiedCount = safeTables.filter((t) => getTableStatus(t) === 'OCCUPIED').length;
  const reservedCount = safeTables.filter((t) => getTableStatus(t) === 'RESERVED').length;
  const availableCount = totalTables - occupiedCount - reservedCount;

  return (
    <div style={{ padding: '20px', backgroundColor: '#111827', minHeight: '90vh', color: '#fff', fontFamily: 'sans-serif' }}>
      {/* BANNER THỐNG KÊ 3 MÀU */}
      <div style={{ background: '#1f2937', padding: '16px 20px', borderRadius: '12px', marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#38bdf8' }}>🛎️ MÀN HÌNH PHỤC VỤ (ORDER MÓN)</h2>
        <div style={{ display: 'flex', gap: '20px', fontSize: '15px', fontWeight: 'bold', flexWrap: 'wrap' }}>
          <span style={{ color: '#9ca3af' }}>📊 Tổng số: {totalTables} bàn</span>
          <span style={{ color: '#10b981' }}>🟢 Bàn trống: {availableCount}</span>
          <span style={{ color: '#facc15' }}>🟨 Đã đặt trước: {reservedCount}</span>
          <span style={{ color: '#ef4444' }}>🔴 Đang có khách: {occupiedCount}</span>
        </div>
      </div>

      {/* DANH SÁCH BÀN */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '16px' }}>
        {safeTables.map((table) => {
          const status = getTableStatus(table);

          // Cấu hình Màu sắc & Nhãn
          let cardBg = '#064e3b';
          let borderClr = '#10b981';
          let badgeBg = '#10b981';
          let badgeText = '🟢 BÀN TRỐNG';
          let btnBg = '#3b82f6';
          let btnText = '📝 Mở Bàn Gọi Món';

          if (status === 'OCCUPIED') {
            cardBg = '#7f1d1d';
            borderClr = '#ef4444';
            badgeBg = '#ef4444';
            badgeText = '🔴 CÓ KHÁCH';
            btnBg = '#ef4444';
            btnText = '➕ Gọi Thêm Món';
          } else if (status === 'RESERVED') {
            cardBg = '#713f12';
            borderClr = '#facc15';
            badgeBg = '#eab308';
            badgeText = '🟨 ĐÃ ĐẶT TRƯỚC';
            btnBg = '#ca8a04';
            btnText = '📝 Nhận Bàn Gọi Món';
          }

          return (
            <div
              key={table._id || table.code || Math.random()}
              onClick={() => handleSelectTable(table)}
              style={{
                background: cardBg,
                border: `2px solid ${borderClr}`,
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
              }}
            >
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{table.name || table.code}</h3>
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  backgroundColor: badgeBg,
                  color: '#fff',
                  marginBottom: '10px'
                }}
              >
                {badgeText}
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
                  backgroundColor: btnBg,
                  color: '#fff'
                }}
              >
                {btnText}
              </button>
            </div>
          );
        })}
      </div>

      {/* POPUP CHỌN MÓN GỬI BẾP */}
      {selectedTable && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1f2937', width: '92%', maxWidth: '1000px', height: '85vh', borderRadius: '12px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', overflow: 'hidden' }}>
            
            {/* CỘT TRÁI: DANH SÁCH MENU MÓN */}
            <div style={{ padding: '20px', overflowY: 'auto', borderRight: '1px solid #374151' }}>
              <h3 style={{ marginTop: 0, color: '#fbbf24' }}>🍽️ Danh Sách Thực Đơn</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                {safeMenu.map((item) => (
                  <div
                    key={item._id || item.id || Math.random()}
                    onClick={() => handleAddToCart(item)}
                    style={{ background: '#374151', padding: '12px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', border: '1px solid #4b5563' }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '14px' }}>{item.name}</div>
                    <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '13px' }}>{(item.price || 0).toLocaleString('vi-VN')}đ</div>
                  </div>
                ))}
              </div>
            </div>

            {/* CỘT PHẢI: CHI TIẾT ĐƠN HÀNG */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#111827' }}>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                
                {/* TIÊU ĐỀ POPUP */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #374151', paddingBottom: '10px' }}>
                  <h3 style={{ margin: 0, color: '#38bdf8' }}>📌 {selectedTable.name}</h3>
                  <button onClick={() => setSelectedTable(null)} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '22px', cursor: 'pointer' }}>✕</button>
                </div>

                {/* THÔNG BÁO DÀNH CHO BÀN ĐẶT TRƯỚC */}
                {getTableStatus(selectedTable) === 'RESERVED' && !existingOrder && (
                  <div style={{ marginTop: '12px', background: '#713f12', color: '#facc15', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', border: '1px solid #ca8a04' }}>
                    ⚠️ Bàn này đã được duyệt đặt trước. Bấm "GỬI XUỐNG BẾP" sẽ nhận bàn cho khách!
                  </div>
                )}

                {/* 1. HIỂN THỊ MÓN ĐÃ GỬI BẾP TRƯỚC ĐÓ */}
                {existingOrder && existingOrder.items && existingOrder.items.length > 0 && (
                  <div style={{ marginTop: '15px', background: '#1f2937', padding: '10px', borderRadius: '8px', border: '1px solid #374151' }}>
                    <div style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 'bold', marginBottom: '8px' }}>
                      📋 Món cũ đã gửi bếp ({existingOrder.items.length} món):
                    </div>
                    {existingOrder.items.map((oldItem, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>
                        <span>• {oldItem.name}</span>
                        <span style={{ fontWeight: 'bold', color: '#10b981' }}>x{oldItem.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. HIỂN THỊ CÁC MÓN MỚI ĐANG CHỌN THÊM */}
                <div style={{ marginTop: '15px' }}>
                  <div style={{ fontSize: '13px', color: '#10b981', fontWeight: 'bold', marginBottom: '8px' }}>
                    ➕ Món MỚI chọn gọi lượt này:
                  </div>
                  {newCart.length === 0 ? (
                    <p style={{ color: '#6b7280', fontSize: '13px', fontStyle: 'italic', textAlign: 'center', marginTop: '20px' }}>
                      Bấm chọn thực đơn bên trái để thêm món...
                    </p>
                  ) : (
                    newCart.map((item) => (
                      <div key={item.menuItemId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', background: '#1f2937', padding: '8px 12px', borderRadius: '6px' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{item.name}</div>
                          <div style={{ fontSize: '12px', color: '#10b981' }}>{(item.price || 0).toLocaleString('vi-VN')}đ</div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button onClick={() => handleUpdateQty(item.menuItemId, -1)} style={{ background: '#ef4444', color: '#fff', border: 'none', width: '26px', height: '26px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                          <span style={{ fontWeight: 'bold', width: '18px', textAlign: 'center' }}>{item.quantity}</span>
                          <button onClick={() => handleUpdateQty(item.menuItemId, 1)} style={{ background: '#10b981', color: '#fff', border: 'none', width: '26px', height: '26px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>

              {/* NÚT THAO TÁC */}
              <div style={{ borderTop: '1px solid #374151', paddingTop: '12px', marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '16px', fontWeight: 'bold' }}>
                  <span>Tiền món mới:</span>
                  <span style={{ color: '#fbbf24' }}>{newCartTotal.toLocaleString('vi-VN')} đ</span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  {getTableStatus(selectedTable) !== 'AVAILABLE' && (
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
                    disabled={loading || newCart.length === 0}
                    style={{
                      flex: 2,
                      padding: '12px',
                      background: newCart.length > 0 ? '#10b981' : '#374151',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      cursor: newCart.length > 0 ? 'pointer' : 'not-allowed',
                      fontSize: '15px'
                    }}
                  >
                    {loading ? '⏳ Đang gửi...' : '🚀 GỬI XUỐNG BẾP'}
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