import React, { useState, useEffect } from 'react';

// 🌐 Khai báo link Backend Render Online
const API_URL = 'https://trang-web-ban-hang-tttn.onrender.com';

function CashierInterface() {
  const [activeTab, setActiveTab] = useState('TABLES'); // 'TABLES' hoặc 'BOOKINGS'
  
  // State Sơ đồ bàn & Order thêm món
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // State Quản lý Menu & Số lượng món đang chọn thêm
  const [menuItems, setMenuItems] = useState([]);
  const [orderQuantities, setOrderQuantities] = useState({});

  // State Quản lý Đặt bàn
  const [bookings, setBookings] = useState([]);

  // 1️⃣ Lấy danh sách Bàn từ Backend
  const fetchTables = async () => {
    try {
      const res = await fetch(`${API_URL}/api/tables`);
      if (res.ok) {
        const data = await res.json();
        setTables(data);
      }
    } catch (err) {
      console.error('❌ Lỗi tải danh sách bàn:', err);
    }
  };

  // 2️⃣ Lấy danh sách Menu từ Backend
  const fetchMenu = async () => {
    try {
      const res = await fetch(`${API_URL}/api/products`);
      if (res.ok) {
        const data = await res.json();
        setMenuItems(data);
      }
    } catch (err) {
      console.error('❌ Lỗi tải menu:', err);
    }
  };

  // 3️⃣ Lấy danh sách Đặt bàn từ Backend
  const fetchBookings = async () => {
    try {
      let res = await fetch(`${API_URL}/api/bookings`);
      if (!res.ok) {
        res = await fetch(`${API_URL}/api/reservations`);
      }
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (err) {
      console.error('❌ Lỗi tải danh sách đặt bàn:', err);
    }
  };

  useEffect(() => {
    fetchTables();
    fetchMenu();
    fetchBookings();

    const interval = setInterval(() => {
      fetchTables();
      fetchBookings();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // 4️⃣ Khi bấm vào bàn có khách -> Mở giao diện Xem món cũ & Order thêm
  const handleSelectTable = async (table) => {
    if (table.status === 'AVAILABLE') return;

    setSelectedTable(table);
    setLoadingOrder(true);
    setCurrentOrder(null);
    setOrderQuantities({});

    try {
      const res = await fetch(`${API_URL}/api/orders`);
      if (res.ok) {
        const orders = await res.json();
        const activeOrder = orders.find(
          (o) =>
            (o.tableCode === table.code || o.tableName === table.name) &&
            o.status !== 'PAID' &&
            o.status !== 'CANCELLED'
        );
        setCurrentOrder(activeOrder || null);
      }
    } catch (err) {
      alert('❌ Lỗi lấy thông tin hóa đơn!');
    } finally {
      setLoadingOrder(false);
    }
  };

  // Tăng/giảm số lượng món thêm
  const handleQuantityChange = (productId, delta) => {
    setOrderQuantities((prev) => {
      const current = prev[productId] || 0;
      const updated = current + delta;
      if (updated <= 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: updated };
    });
  };

  // 5️⃣ Gửi món thêm xuống bếp (Đã đồng bộ với Backend route /add-items)
  const handleAddItemsToOrder = async () => {
    if (!currentOrder) return;

    const itemsToAdd = Object.keys(orderQuantities).map((productId) => {
      const product = menuItems.find((p) => (p._id || p.id) === productId);
      return {
        menuItemId: productId,
        name: product ? product.name : 'Món ăn',
        price: product ? product.price : 0,
        quantity: orderQuantities[productId]
      };
    });

    if (itemsToAdd.length === 0) {
      alert('⚠️ Vui lòng chọn ít nhất một món để thêm!');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/orders/${currentOrder._id}/add-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newItems: itemsToAdd })
      });

      if (res.ok) {
        const updatedOrderData = await res.json();
        alert('✅ Đã thêm món thành công và gửi thông báo xuống bếp!');
        
        const freshOrder = updatedOrderData.order || updatedOrderData;
        setCurrentOrder(freshOrder);
        setOrderQuantities({});
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`❌ Lỗi thêm món: ${errData.message || 'Không thể cập nhật hóa đơn!'}`);
      }
    } catch (err) {
      console.error(err);
      alert('❌ Lỗi kết nối khi gửi món xuống bếp!');
    } finally {
      setSubmitting(false);
    }
  };

  // 6️⃣ Cập nhật Trạng thái Đặt bàn
  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      let res = await fetch(`${API_URL}/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.status === 404) {
        res = await fetch(`${API_URL}/api/reservations/${bookingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
      }

      if (res.ok) {
        alert('✅ Đã cập nhật trạng thái đơn đặt bàn!');
        fetchBookings();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`❌ Lỗi cập nhật: ${errData.message || 'Không thể cập nhật trạng thái!'}`);
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật đặt bàn:', err);
      alert('❌ Lỗi kết nối máy chủ!');
    }
  };

  const getBookingAlert = (item) => {
    if (item.status === 'CANCELLED' || item.status === 'COMPLETED') return null;

    let bookingDateObj = null;
    if (item.bookingTime) {
      bookingDateObj = new Date(item.bookingTime);
    } else if (item.date && item.time) {
      bookingDateObj = new Date(`${item.date}T${item.time}`);
    }

    if (!bookingDateObj || isNaN(bookingDateObj.getTime())) return null;

    const now = new Date();
    const diffMins = Math.floor((bookingDateObj - now) / 60000);

    if (diffMins < 0 && diffMins >= -60) {
      return { type: 'OVERDUE', text: `🔴 Đã đến giờ hẹn (${Math.abs(diffMins)} phút trước)!` };
    } else if (diffMins >= 0 && diffMins <= 30) {
      return { type: 'SOON', text: `⚡ Sắp tới giờ (${diffMins === 0 ? 'Ngay bây giờ' : `trong ${diffMins} phút nữa`})` };
    }

    return null;
  };

  const renderDateTime = (item) => {
    if (item.bookingTime) {
      const dateObj = new Date(item.bookingTime);
      if (!isNaN(dateObj.getTime())) {
        return (
          <>
            📅 {dateObj.toLocaleDateString('vi-VN')} <br />
            ⏰ <strong style={{ color: '#fbbf24' }}>
              {dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </strong>
          </>
        );
      }
    }
    if (item.date || item.time) {
      return (
        <>
          📅 {item.date || 'Chưa chọn ngày'} <br />
          ⏰ <strong style={{ color: '#fbbf24' }}>{item.time || 'Chưa chọn giờ'}</strong>
        </>
      );
    }
    return <span style={{ color: '#9ca3af' }}>Chưa rõ thời gian</span>;
  };

  const pendingCount = bookings.filter((b) => b.status === 'PENDING' || !b.status).length;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', color: '#fff' }}>
      {/* HEADER & TAB BANNER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ color: '#fbbf24', margin: 0 }}>💵 MÀN HÌNH QUẢN LÝ THU NGÂN</h2>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: '5px 0 0 0' }}>
            Quản lý sơ đồ bàn, gọi thêm món gửi bếp và đơn đặt bàn.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', background: '#1f2937', padding: '6px', borderRadius: '10px' }}>
          <button
            onClick={() => setActiveTab('TABLES')}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              background: activeTab === 'TABLES' ? '#10b981' : 'transparent',
              color: '#fff'
            }}
          >
            🪑 Sơ đồ bàn ({tables.filter((t) => t.status === 'OCCUPIED').length}/{tables.length})
          </button>

          <button
            onClick={() => setActiveTab('BOOKINGS')}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              position: 'relative',
              background: activeTab === 'BOOKINGS' ? '#3b82f6' : 'transparent',
              color: '#fff'
            }}
          >
            📅 Đơn Đặt Bàn
            {pendingCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '50%',
                  padding: '2px 7px',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}
              >
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <hr style={{ borderColor: '#374151', margin: '20px 0' }} />

      {/* ==================== TAB 1: SƠ ĐỒ BÀN ==================== */}
      {activeTab === 'TABLES' && (
        <div>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>
            Bấm vào bàn màu <strong>ĐỎ (có khách)</strong> để xem danh sách món đã đặt và chọn món thêm gửi bếp.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '15px',
              marginTop: '15px'
            }}
          >
            {tables.map((table) => {
              const isOccupied = table.status === 'OCCUPIED';
              return (
                <div
                  key={table._id || table.code}
                  onClick={() => handleSelectTable(table)}
                  style={{
                    background: isOccupied ? '#ef4444' : '#10b981',
                    borderRadius: '10px',
                    padding: '20px 10px',
                    textAlign: 'center',
                    cursor: isOccupied ? 'pointer' : 'default',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                    border: selectedTable?._id === table._id ? '3px solid #fbbf24' : 'none'
                  }}
                >
                  <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{table.name}</div>
                  <div style={{ fontSize: '12px', marginTop: '5px', fontWeight: '600' }}>
                    {isOccupied ? '🔴 CÓ KHÁCH' : '🟢 BÀN TRỐNG'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: ĐẶT BÀN ==================== */}
      {activeTab === 'BOOKINGS' && (
        <div>
          <h3 style={{ color: '#fbbf24', marginTop: 0 }}>📋 Danh sách khách hàng đặt bàn trước</h3>
          {bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: '#1f2937', borderRadius: '10px', color: '#9ca3af' }}>
              Chưa có lượt đặt bàn nào từ website.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1f2937', borderRadius: '10px', overflow: 'hidden' }}>
                <thead>
                  <tr style={{ background: '#374151', color: '#fbbf24', textAlign: 'left', fontSize: '14px' }}>
                    <th style={{ padding: '12px' }}>Khách hàng</th>
                    <th style={{ padding: '12px' }}>Số điện thoại</th>
                    <th style={{ padding: '12px' }}>Ngày & Giờ đặt</th>
                    <th style={{ padding: '12px' }}>Số lượng khách</th>
                    <th style={{ padding: '12px' }}>Ghi chú / Trạng thái</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((item) => {
                    const alertInfo = getBookingAlert(item);
                    return (
                      <tr key={item._id} style={{ borderBottom: '1px solid #374151', fontSize: '14px', background: alertInfo ? 'rgba(239, 68, 68, 0.1)' : 'transparent' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>
                          {item.customerName || item.fullName || 'Khách chưa để lại tên'}
                        </td>
                        <td style={{ padding: '12px', color: '#60a5fa' }}>{item.phone || 'Chưa có SĐT'}</td>
                        <td style={{ padding: '12px' }}>
                          {renderDateTime(item)}
                          {alertInfo && (
                            <div style={{ marginTop: '5px', fontSize: '11px', fontWeight: 'bold', color: alertInfo.type === 'OVERDUE' ? '#ef4444' : '#f59e0b', background: '#111827', padding: '3px 6px', borderRadius: '4px', display: 'inline-block' }}>
                              {alertInfo.text}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px' }}>
                          👥 {item.adults || item.guests || 1} người lớn
                          {item.children > 0 && `, ${item.children} trẻ em`}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ color: '#9ca3af', fontStyle: 'italic', maxWidth: '200px', marginBottom: '5px' }}>
                            {item.note || 'Không có ghi chú'}
                          </div>
                          <div>
                            {item.status === 'CONFIRMED' && <span style={{ color: '#10b981', fontWeight: 'bold' }}>✅ Đã xác nhận</span>}
                            {item.status === 'CANCELLED' && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>❌ Đã hủy</span>}
                            {(!item.status || item.status === 'PENDING') && <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>⏳ Mới / Chờ duyệt</span>}
                          </div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            {item.status !== 'CONFIRMED' && (
                              <button
                                onClick={() => handleUpdateBookingStatus(item._id, 'CONFIRMED')}
                                style={{ padding: '6px 10px', background: '#10b981', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                              >
                                Xác nhận
                              </button>
                            )}
                            {item.status !== 'CANCELLED' && (
                              <button
                                onClick={() => handleUpdateBookingStatus(item._id, 'CANCELLED')}
                                style={{ padding: '6px 10px', background: '#ef4444', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                              >
                                Hủy
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================== POPUP: BÊN TRÁI XEM MÓN CŨ, BÊN PHẢI MENU CHỌN THÊM ==================== */}
      {selectedTable && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <div
            style={{
              background: '#1f2937',
              width: '900px',
              maxWidth: '95vw',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '12px',
              padding: '25px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setSelectedTable(null)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'transparent',
                border: 'none',
                color: '#9ca3af',
                fontSize: '22px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>

            <h3 style={{ margin: '0 0 15px 0', color: '#fbbf24', textAlign: 'center' }}>
              🍽️ QUẢN LÝ GỌI THÊM MÓN - {selectedTable.name}
            </h3>

            {loadingOrder ? (
              <p style={{ textAlign: 'center', margin: '30px 0' }}>⏳ Đang tải thông tin món ăn...</p>
            ) : !currentOrder ? (
              <p style={{ textAlign: 'center', color: '#ef4444', margin: '30px 0' }}>
                Bàn này chưa có hóa đơn hoạt động!
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                
                {/* CỘT TRÁI: DANH SÁCH MÓN ĐÃ ĐẶT (ĐÃ GỬI BẾP) */}
                <div style={{ background: '#111827', padding: '15px', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ color: '#38bdf8', marginTop: 0, marginBottom: '10px' }}>📋 Các món khách đã đặt trước đó:</h4>
                  
                  <div style={{ flex: 1, maxHeight: '300px', overflowY: 'auto', marginBottom: '10px' }}>
                    <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #374151', color: '#9ca3af' }}>
                          <th style={{ textAlign: 'left', paddingBottom: '6px' }}>Tên món</th>
                          <th style={{ textAlign: 'center', paddingBottom: '6px' }}>SL</th>
                          <th style={{ textAlign: 'right', paddingBottom: '6px' }}>Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentOrder.items?.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #1f2937' }}>
                            <td style={{ padding: '8px 0' }}>{item.name}</td>
                            <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right' }}>{(item.price * item.quantity).toLocaleString('vi-VN')}đ</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', color: '#10b981', padding: '10px', background: '#374151', borderRadius: '6px' }}>
                    <span>TỔNG TIỀN HIỆN TẠI:</span>
                    <span>{currentOrder.totalAmount?.toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>

                {/* CỘT PHẢI: DANH SÁCH MENU ĐỂ CHỌN MÓN THÊM & GỬI BẾP */}
                <div style={{ background: '#111827', padding: '15px', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ color: '#fbbf24', marginTop: 0, marginBottom: '10px' }}>➕ Chọn món thêm gửi bếp</h4>
                  
                  <div style={{ flex: 1, maxHeight: '250px', overflowY: 'auto', marginBottom: '12px', paddingRight: '5px' }}>
                    {menuItems.length === 0 ? (
                      <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center' }}>Đang tải thực đơn...</p>
                    ) : (
                      menuItems.map((prod) => {
                        const prodId = prod._id || prod.id;
                        const qty = orderQuantities[prodId] || 0;
                        return (
                          <div key={prodId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #1f2937' }}>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{prod.name}</div>
                              <div style={{ fontSize: '12px', color: '#10b981' }}>{prod.price?.toLocaleString('vi-VN')}đ</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                onClick={() => handleQuantityChange(prodId, -1)}
                                style={{ width: '26px', height: '26px', background: '#374151', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                              >
                                -
                              </button>
                              <span style={{ fontSize: '13px', width: '22px', textAlign: 'center' }}>{qty}</span>
                              <button
                                onClick={() => handleQuantityChange(prodId, 1)}
                                style={{ width: '26px', height: '26px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <button
                    onClick={handleAddItemsToOrder}
                    disabled={submitting || Object.keys(orderQuantities).length === 0}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: Object.keys(orderQuantities).length > 0 ? '#10b981' : '#374151',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '15px',
                      fontWeight: 'bold',
                      cursor: Object.keys(orderQuantities).length > 0 ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {submitting ? '⏳ Đang gửi...' : '🚀 XÁC NHẬN GỬI MÓN THÊM XUỐNG BẾP'}
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CashierInterface;