import React, { useState, useEffect } from 'react';

// 🌐 Khai báo link Backend Render Online
const API_URL = 'https://trang-web-ban-hang-tttn.onrender.com';

function CashierInterface() {
  const [activeTab, setActiveTab] = useState('TABLES'); // 'TABLES' (Sơ đồ bàn) hoặc 'BOOKINGS' (Danh sách đặt bàn)
  
  // State Sơ đồ bàn & Thanh toán
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // 'CASH' hoặc 'TRANSFER'
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  // 2️⃣ Lấy danh sách Đặt bàn từ Backend
  const fetchBookings = async () => {
    try {
      // Thử gọi đường dẫn /api/bookings (hoặc /api/reservations)
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
    fetchBookings();

    // Tự động làm mới dữ liệu Bàn và Lịch đặt mỗi 5 giây
    const interval = setInterval(() => {
      fetchTables();
      fetchBookings();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // 3️⃣ Khi chọn 1 Bàn để xem thanh toán
  const handleSelectTable = async (table) => {
    if (table.status === 'AVAILABLE') return;

    setSelectedTable(table);
    setLoadingOrder(true);
    setCurrentOrder(null);

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

  // 4️⃣ Xử lý Xác nhận Thanh toán hóa đơn
  const handleConfirmPayment = async () => {
    if (!currentOrder) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/orders/${currentOrder._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PAID',
          paymentMethod: paymentMethod
        })
      });

      if (res.ok) {
        alert(`✅ Thanh toán thành công cho ${selectedTable.name}!`);
        setSelectedTable(null);
        setCurrentOrder(null);
        fetchTables();
      } else {
        alert('❌ Lỗi cập nhật trạng thái thanh toán!');
      }
    } catch (err) {
      alert('❌ Lỗi kết nối máy chủ!');
    } finally {
      setSubmitting(false);
    }
  };

  // 5️⃣ Xử lý Cập nhật Trạng thái Đặt bàn (Xác nhận / Hủy / Nhận bàn)
  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      let res = await fetch(`${API_URL}/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      // Nếu route /api/bookings không tồn tại, thử route /api/reservations
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

  // Hàm hỗ trợ hiển thị Ngày & Giờ linh hoạt
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
    
    // Nếu không dùng bookingTime thì hiển thị theo date & time riêng lẻ
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

  // Số lượng đơn đặt bàn mới (PENDING)
  const pendingCount = bookings.filter((b) => b.status === 'PENDING' || !b.status).length;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', color: '#fff' }}>
      {/* HEADER & TAB BANNER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ color: '#fbbf24', margin: 0 }}>💵 MÀN HÌNH QUẢN LÝ THU NGÂN</h2>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: '5px 0 0 0' }}>
            Quản lý sơ đồ bàn, thanh toán hóa đơn và danh sách khách hàng đặt trước.
          </p>
        </div>

        {/* NÚT CHUYỂN TAB */}
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

      {/* ==================== TAB 1: SƠ ĐỒ BÀN & THANH TOÁN ==================== */}
      {activeTab === 'TABLES' && (
        <div>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>
            Bấm vào bàn màu <strong>ĐỎ (có khách)</strong> để xem và xác nhận thanh toán hóa đơn.
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
                    border: selectedTable?._id === table._id ? '3px solid #fbbf24' : 'none',
                    transition: 'transform 0.1s'
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

      {/* ==================== TAB 2: DANH SÁCH ĐẶT BÀN ==================== */}
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
                    <th style={{ padding: '12px' }}>Ghi chú</th>
                    <th style={{ padding: '12px' }}>Trạng thái</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((item) => (
                    <tr key={item._id} style={{ borderBottom: '1px solid #374151', fontSize: '14px' }}>
                      {/* Đọc linh hoạt customerName hoặc fullName */}
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>
                        {item.customerName || item.fullName || 'Khách chưa để lại tên'}
                      </td>
                      <td style={{ padding: '12px', color: '#60a5fa' }}>
                        {item.phone || 'Chưa có SĐT'}
                      </td>
                      
                      {/* Hàm hiển thị Ngày Giờ tự động format */}
                      <td style={{ padding: '12px' }}>
                        {renderDateTime(item)}
                      </td>

                      <td style={{ padding: '12px' }}>
                        👥 {item.adults || item.guests || 1} người lớn
                        {item.children > 0 && `, ${item.children} trẻ em`}
                      </td>
                      
                      <td style={{ padding: '12px', color: '#9ca3af', fontStyle: 'italic', maxWidth: '200px' }}>
                        {item.note || 'Không có'}
                      </td>

                      <td style={{ padding: '12px' }}>
                        {item.status === 'CONFIRMED' && <span style={{ color: '#10b981', fontWeight: 'bold' }}>✅ Đã xác nhận</span>}
                        {item.status === 'CANCELLED' && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>❌ Đã hủy</span>}
                        {(!item.status || item.status === 'PENDING') && <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>⏳ Mới / Chờ duyệt</span>}
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================== POPUP HÓA ĐƠN THANH TOÁN (KHI CHỌN BÀN) ==================== */}
      {selectedTable && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <div
            style={{
              background: '#1f2937',
              width: '420px',
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
                fontSize: '20px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>

            <h3 style={{ margin: 0, color: '#fbbf24', textAlign: 'center' }}>
              🧾 HÓA ĐƠN - {selectedTable.name}
            </h3>

            {loadingOrder ? (
              <p style={{ textAlign: 'center', margin: '30px 0' }}>⏳ Đang tải hóa đơn...</p>
            ) : !currentOrder ? (
              <p style={{ textAlign: 'center', color: '#ef4444', margin: '30px 0' }}>
                Bàn này chưa có món hoặc đã thanh toán xong!
              </p>
            ) : (
              <div>
                <div
                  style={{
                    maxHeight: '200px',
                    overflowY: 'auto',
                    margin: '15px 0',
                    background: '#111827',
                    padding: '10px',
                    borderRadius: '8px'
                  }}
                >
                  <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #374151', color: '#9ca3af' }}>
                        <th style={{ textAlign: 'left', paddingBottom: '8px' }}>Món</th>
                        <th style={{ textAlign: 'center', paddingBottom: '8px' }}>SL</th>
                        <th style={{ textAlign: 'right', paddingBottom: '8px' }}>Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentOrder.items?.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #1f2937' }}>
                          <td style={{ padding: '8px 0' }}>{item.name}</td>
                          <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                          <td style={{ textAlign: 'right' }}>
                            {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#10b981',
                    marginBottom: '20px',
                    padding: '10px',
                    background: '#374151',
                    borderRadius: '6px'
                  }}
                >
                  <span>TỔNG CỘNG:</span>
                  <span>{currentOrder.totalAmount?.toLocaleString('vi-VN')}đ</span>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#d1d5db' }}>
                    Hình thức thanh toán:
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => setPaymentMethod('CASH')}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '6px',
                        border: paymentMethod === 'CASH' ? '2px solid #10b981' : '1px solid #374151',
                        background: paymentMethod === 'CASH' ? '#065f46' : '#374151',
                        color: '#fff',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      💵 Tiền mặt
                    </button>
                    <button
                      onClick={() => setPaymentMethod('TRANSFER')}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '6px',
                        border: paymentMethod === 'TRANSFER' ? '2px solid #3b82f6' : '1px solid #374151',
                        background: paymentMethod === 'TRANSFER' ? '#1e40af' : '#374151',
                        color: '#fff',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      💳 Chuyển khoản (CK)
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleConfirmPayment}
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: submitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting ? '⏳ Đang lưu...' : '✅ XÁC NHẬN THANH TOÁN'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CashierInterface;