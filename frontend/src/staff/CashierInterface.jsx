import React, { useState, useEffect } from 'react';

const API_URL = 'https://trang-web-ban-hang-tttn.onrender.com';

function CashierInterface() {
  const [activeTab, setActiveTab] = useState('TABLES'); // 'TABLES' | 'BOOKINGS'

  // State Dữ liệu chính
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [bookings, setBookings] = useState([]);

  // State Thao tác Bàn & Hóa đơn
  const [selectedTable, setSelectedTable] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // State Order thêm món
  const [orderQuantities, setOrderQuantities] = useState({});

  // State Thanh toán
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // 'CASH' | 'TRANSFER' | 'CARD'
  const [cashReceived, setCashReceived] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // 1️⃣ Tải dữ liệu từ Backend (Có bọc an toàn tránh crash)
  const fetchData = async () => {
    try {
      const [resTables, resMenu, resBookings, resOrders] = await Promise.all([
        fetch(`${API_URL}/api/tables`).then((r) => r.json()).catch(() => []),
        fetch(`${API_URL}/api/products`).then((r) => r.json()).catch(async () => {
          return fetch(`${API_URL}/api/menu`).then((r) => r.json()).catch(() => []);
        }),
        fetch(`${API_URL}/api/bookings`).then((r) => r.json()).catch(async () => {
          return fetch(`${API_URL}/api/reservations`).then((r) => r.json()).catch(() => []);
        }),
        fetch(`${API_URL}/api/orders`).then((r) => r.json()).catch(() => [])
      ]);

      const safeTables = Array.isArray(resTables) ? resTables : resTables.tables || resTables.data || [];
      const safeMenu = Array.isArray(resMenu) ? resMenu : resMenu.products || resMenu.menu || resMenu.data || [];
      const safeBookings = Array.isArray(resBookings) ? resBookings : resBookings.bookings || resBookings.data || [];
      const safeOrders = Array.isArray(resOrders) ? resOrders : resOrders.orders || resOrders.data || [];

      // Cập nhật trạng thái bàn hiển thị chính xác theo order chưa thanh toán
      const activeOrders = safeOrders.filter((o) => o.status !== 'PAID' && o.status !== 'CANCELLED');
      const updatedTables = safeTables.map((tbl) => {
        const hasOrder = activeOrders.some(
          (o) => o.tableCode === tbl.code || o.tableName === tbl.name || o.tableId === tbl._id
        );
        return {
          ...tbl,
          status: hasOrder || tbl.status === 'OCCUPIED' ? 'OCCUPIED' : 'AVAILABLE'
        };
      });

      setTables(updatedTables);
      setMenuItems(safeMenu);
      setBookings(safeBookings);
    } catch (err) {
      console.error('❌ Lỗi tải dữ liệu Thu Ngân:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  // 2️⃣ Mở Bàn xem Hóa đơn
  const handleSelectTable = async (table) => {
    setSelectedTable(table);
    setLoadingOrder(true);
    setCurrentOrder(null);
    setOrderQuantities({});
    setCashReceived('');
    setPaymentMethod('CASH');

    try {
      const res = await fetch(`${API_URL}/api/orders`);
      if (res.ok) {
        const rawOrders = await res.json();
        const orders = Array.isArray(rawOrders) ? rawOrders : rawOrders.orders || [];
        const activeOrder = orders.find(
          (o) =>
            (o.tableCode === table.code || o.tableName === table.name || o.tableId === table._id) &&
            o.status !== 'PAID' &&
            o.status !== 'CANCELLED'
        );
        setCurrentOrder(activeOrder || null);
      }
    } catch (err) {
      alert('❌ Lỗi tải hóa đơn bàn này!');
    } finally {
      setLoadingOrder(false);
    }
  };

  // 3️⃣ Tăng/Giảm số lượng món gọi thêm
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

  // 4️⃣ Gửi món gọi thêm xuống bếp
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
      alert('⚠️ Vui lòng chọn ít nhất 1 món để thêm!');
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
        const updatedData = await res.json();
        alert('✅ Đã gọi thêm món thành công!');
        setCurrentOrder(updatedData.order || updatedData);
        setOrderQuantities({});
        await fetchData();
      } else {
        alert('❌ Lỗi gửi thêm món!');
      }
    } catch (err) {
      alert('❌ Lỗi kết nối khi gửi món!');
    } finally {
      setSubmitting(false);
    }
  };

  // 5️⃣ THANH TOÁN & GIẢI PHÓNG BÀN (TÍNH NĂNG CHÍNH CỦA THU NGÂN)
  const handleCheckout = async () => {
    if (!currentOrder) return;

    const total = currentOrder.totalAmount || 0;
    const numCash = parseFloat(cashReceived) || 0;

    if (paymentMethod === 'CASH' && numCash < total) {
      alert('⚠️ Số tiền khách đưa chưa đủ!');
      return;
    }

    if (!window.confirm(`Xác nhận thanh toán ${total.toLocaleString('vi-VN')}đ cho ${selectedTable.name}?`)) {
      return;
    }

    setIsProcessingPayment(true);
    try {
      // Cập nhật Order -> PAID
      let resOrder = await fetch(`${API_URL}/api/orders/${currentOrder._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID', paymentMethod })
      });

      if (!resOrder.ok) {
        resOrder = await fetch(`${API_URL}/api/orders/${currentOrder._id}/pay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentMethod })
        });
      }

      // Đổi trạng thái Bàn -> AVAILABLE
      const tableId = selectedTable._id || selectedTable.id;
      await fetch(`${API_URL}/api/tables/${tableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'AVAILABLE' })
      });

      alert(`🎉 Thanh toán thành công! Bàn ${selectedTable.name} đã trống.`);
      setSelectedTable(null);
      setCurrentOrder(null);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('❌ Lỗi khi xử lý thanh toán!');
    } finally {
      setIsProcessingPayment(false);
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
        alert('✅ Đã cập nhật đơn đặt bàn!');
        await fetchData();
      } else {
        alert('❌ Lỗi cập nhật đơn đặt bàn!');
      }
    } catch (err) {
      alert('❌ Lỗi máy chủ!');
    }
  };

  const pendingCount = bookings.filter((b) => b.status === 'PENDING' || !b.status).length;
  const totalAmount = currentOrder?.totalAmount || 0;
  const changeAmount = paymentMethod === 'CASH' ? (parseFloat(cashReceived) || 0) - totalAmount : 0;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', color: '#fff', backgroundColor: '#111827', minHeight: '90vh' }}>
      
      {/* HEADER & TABS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ color: '#fbbf24', margin: 0 }}>💵 MÀN HÌNH THU NGÂN & THANH TOÁN</h2>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: '5px 0 0 0' }}>
            Quản lý tính tiền, in hóa đơn, gọi thêm món và duyệt đơn đặt bàn.
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
              <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: '#fff', borderRadius: '50%', padding: '2px 7px', fontSize: '11px', fontWeight: 'bold' }}>
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <hr style={{ borderColor: '#374151', margin: '20px 0' }} />

      {/* TAB 1: SƠ ĐỒ BÀN */}
      {activeTab === 'TABLES' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
            {tables.map((table) => {
              const isOccupied = table.status === 'OCCUPIED';
              return (
                <div
                  key={table._id || table.code || Math.random()}
                  onClick={() => handleSelectTable(table)}
                  style={{
                    background: isOccupied ? '#7f1d1d' : '#064e3b',
                    borderRadius: '10px',
                    padding: '18px 10px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                    border: isOccupied ? '2px solid #ef4444' : '2px solid #10b981'
                  }}
                >
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{table.name || table.code}</div>
                  <div style={{ fontSize: '12px', marginTop: '6px', fontWeight: '600', color: isOccupied ? '#fca5a5' : '#6ee7b7' }}>
                    {isOccupied ? '🔴 ĐANG CÓ KHÁCH' : '🟢 BÀN TRỐNG'}
                  </div>
                  <button
                    style={{
                      marginTop: '10px',
                      width: '100%',
                      padding: '6px',
                      borderRadius: '4px',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      background: isOccupied ? '#ef4444' : '#374151',
                      color: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    {isOccupied ? '💳 Thanh Toán / Thêm Món' : '👁️ Xem Chi Tiết'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ĐƠN ĐẶT BÀN */}
      {activeTab === 'BOOKINGS' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1f2937', borderRadius: '10px' }}>
            <thead>
              <tr style={{ background: '#374151', color: '#fbbf24', textAlign: 'left', fontSize: '14px' }}>
                <th style={{ padding: '12px' }}>Khách hàng</th>
                <th style={{ padding: '12px' }}>Số điện thoại</th>
                <th style={{ padding: '12px' }}>Thời gian</th>
                <th style={{ padding: '12px' }}>Số lượng</th>
                <th style={{ padding: '12px' }}>Ghi chú / Trạng thái</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((item) => (
                <tr key={item._id} style={{ borderBottom: '1px solid #374151', fontSize: '14px' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.customerName || item.fullName || 'Khách Vô Danh'}</td>
                  <td style={{ padding: '12px', color: '#60a5fa' }}>{item.phone || 'N/A'}</td>
                  <td style={{ padding: '12px' }}>{item.date || item.bookingTime || 'N/A'} - {item.time || ''}</td>
                  <td style={{ padding: '12px' }}>👥 {item.adults || item.guests || 1} người</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ color: '#9ca3af', fontSize: '12px' }}>{item.note || 'Không ghi chú'}</div>
                    <strong style={{ color: item.status === 'CONFIRMED' ? '#10b981' : item.status === 'CANCELLED' ? '#ef4444' : '#f59e0b' }}>
                      {item.status || 'PENDING'}
                    </strong>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      {item.status !== 'CONFIRMED' && (
                        <button onClick={() => handleUpdateBookingStatus(item._id, 'CONFIRMED')} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                          Duyệt
                        </button>
                      )}
                      {item.status !== 'CANCELLED' && (
                        <button onClick={() => handleUpdateBookingStatus(item._id, 'CANCELLED')} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                          Hủy
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* POPUP XỬ LÝ THANH TOÁN & GỌI MÓN THÊM */}
      {selectedTable && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#1f2937', width: '1000px', maxWidth: '95vw', height: '88vh', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            
            <button onClick={() => setSelectedTable(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '24px', cursor: 'pointer' }}>✕</button>

            <h3 style={{ margin: '0 0 15px 0', color: '#fbbf24', textAlign: 'center' }}>
              💳 QUẢN LÝ TÍNH TIỀN & THÊM MÓN - {selectedTable.name}
            </h3>

            {loadingOrder ? (
              <p style={{ textAlign: 'center', margin: 'auto' }}>⏳ Đang tải hóa đơn...</p>
            ) : !currentOrder ? (
              <div style={{ textAlign: 'center', margin: 'auto' }}>
                <p style={{ color: '#9ca3af' }}>Bàn này hiện chưa có hóa đơn chưa thanh toán.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '15px', flex: 1, overflow: 'hidden' }}>
                
                {/* CỘT 1: CHI TIẾT HÓA ĐƠN HIỆN TẠI */}
                <div style={{ background: '#111827', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ color: '#38bdf8', marginTop: 0 }}>📋 Danh sách món đã gọi</h4>
                  <div style={{ flex: 1, overflowY: 'auto', borderBottom: '1px solid #374151', marginBottom: '10px' }}>
                    {currentOrder.items?.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                        <span>{item.name} x<strong>{item.quantity}</strong></span>
                        <span style={{ color: '#10b981', fontWeight: 'bold' }}>{(item.price * item.quantity).toLocaleString('vi-VN')}đ</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fbbf24', textAlign: 'right' }}>
                    TỔNG TIỀN: {totalAmount.toLocaleString('vi-VN')}đ
                  </div>
                </div>

                {/* CỘT 2: GỌI THÊM MÓN */}
                <div style={{ background: '#111827', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ color: '#10b981', marginTop: 0 }}>➕ Gọi thêm món</h4>
                  <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px' }}>
                    {menuItems.map((prod) => {
                      const prodId = prod._id || prod.id;
                      const qty = orderQuantities[prodId] || 0;
                      return (
                        <div key={prodId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', borderBottom: '1px solid #1f2937', paddingBottom: '4px' }}>
                          <span style={{ fontSize: '12px' }}>{prod.name}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button onClick={() => handleQuantityChange(prodId, -1)} style={{ background: '#374151', color: '#fff', border: 'none', width: '22px', height: '22px', borderRadius: '4px', cursor: 'pointer' }}>-</button>
                            <span style={{ fontSize: '12px', width: '16px', textAlign: 'center' }}>{qty}</span>
                            <button onClick={() => handleQuantityChange(prodId, 1)} style={{ background: '#3b82f6', color: '#fff', border: 'none', width: '22px', height: '22px', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={handleAddItemsToOrder}
                    disabled={submitting || Object.keys(orderQuantities).length === 0}
                    style={{ background: Object.keys(orderQuantities).length > 0 ? '#3b82f6' : '#374151', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    {submitting ? '⏳ Đang gửi...' : '🚀 Gửi món thêm'}
                  </button>
                </div>

                {/* CỘT 3: KHU VỰC THÁNH TOÁN */}
                <div style={{ background: '#111827', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ color: '#ef4444', marginTop: 0 }}>💰 Hình thức thanh toán</h4>
                    
                    {/* Chọn phương thức */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '15px' }}>
                      {['CASH', 'TRANSFER', 'CARD'].map((m) => (
                        <button
                          key={m}
                          onClick={() => setPaymentMethod(m)}
                          style={{
                            flex: 1,
                            padding: '8px 4px',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            background: paymentMethod === m ? '#10b981' : '#374151',
                            color: '#fff'
                          }}
                        >
                          {m === 'CASH' ? 'Tiền mặt' : m === 'TRANSFER' ? 'Chuyển khoản' : 'Thẻ'}
                        </button>
                      ))}
                    </div>

                    {/* Ô nhập tiền mặt & tính tiền thừa */}
                    {paymentMethod === 'CASH' && (
                      <div>
                        <label style={{ fontSize: '12px', color: '#9ca3af' }}>Tiền khách đưa (VNĐ):</label>
                        <input
                          type="number"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                          placeholder="Nhập số tiền..."
                          style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #374151', background: '#1f2937', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                        <div style={{ marginTop: '10px', fontSize: '13px', color: changeAmount >= 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                          Tiền thừa: {changeAmount >= 0 ? `${changeAmount.toLocaleString('vi-VN')}đ` : 'Chưa đủ tiền!'}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={isProcessingPayment}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      marginTop: '15px'
                    }}
                  >
                    {isProcessingPayment ? '⏳ Đang xử lý...' : '✅ XÁC NHẬN THANH TOÁN'}
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