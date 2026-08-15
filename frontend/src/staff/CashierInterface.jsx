import React, { useState, useEffect } from 'react';

const API_URL = 'https://trang-web-ban-hang-tttn.onrender.com';

// 🏦 CẤU HÌNH TÀI KHOẢN NGÂN HÀNG VIETQR
const BANK_CONFIG = {
  bankId: 'MB',          
  accountNo: '0388888888', 
  accountName: 'NHA HANG PHUC VU'
};

function CashierInterface() {
  const [activeTab, setActiveTab] = useState('TABLES'); // 'TABLES' | 'BOOKINGS'

  // State Dữ liệu chính
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [urgentCount, setUrgentCount] = useState(0);

  // State Thao tác Bàn & Hóa đơn
  const [selectedTable, setSelectedTable] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // State Order thêm món
  const [orderQuantities, setOrderQuantities] = useState({});

  // State Thanh toán ('CASH' | 'VIETQR')
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [cashReceived, setCashReceived] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // 🛠️ HÀM SO SÁNH & KHỚP THÔNG TIN BÀN GIỮA BOOKING/ORDER VỚI TABLE
  const isTableMatching = (table, entity) => {
    if (!table || !entity) return false;

    const tId = String(table._id || table.id || '');
    const tCode = String(table.code || table.tableCode || '').toLowerCase();
    const tName = String(table.name || table.tableName || '').toLowerCase();

    let eTableId = '';
    if (typeof entity.table === 'object' && entity.table !== null) {
      eTableId = String(entity.table._id || entity.table.id || '');
    } else {
      eTableId = String(entity.tableId || entity.table || '');
    }

    const eTableCode = String(entity.tableCode || (typeof entity.table === 'object' ? entity.table.code : '') || '').toLowerCase();
    const eTableName = String(
      typeof entity.table === 'object' && entity.table !== null
        ? entity.table.name || entity.table.code || ''
        : entity.tableName || ''
    ).toLowerCase();

    return (
      (tId && eTableId && tId === eTableId) ||
      (tCode && eTableCode && tCode === eTableCode) ||
      (tName && eTableName && tName === eTableName) ||
      (tCode && eTableName && tCode === eTableName) ||
      (tName && eTableCode && tName === eTableCode)
    );
  };

  // 🛠️ HÀM ĐỌC DỮ LIỆU NGƯỜI LỚN & TRẺ EM BẢO ĐẢM NHẬN ĐÚNG API TỪ BE
  const formatGuests = (booking) => {
    if (!booking) return '👨 1 người lớn';

    let adults = 0;
    let children = 0;

    // 1. Kiểm tra nếu BE gửi dưới dạng object lồng nhau (vd: booking.guestCount hoặc booking.guests)
    const gc = booking.guestCount || (typeof booking.guests === 'object' ? booking.guests : null);
    if (gc) {
      adults = gc.adults ?? gc.adultCount ?? gc.adult ?? gc.numAdults ?? 0;
      children = gc.children ?? gc.childCount ?? gc.child ?? gc.numChildren ?? gc.kids ?? 0;
    }

    // 2. Kiểm tra các trường trực tiếp trên booking
    if (!adults) {
      adults = booking.adults ?? booking.adultCount ?? booking.adult_count ?? booking.numAdults ?? booking.peopleCount ?? booking.amountPeople ?? 0;
    }
    if (!children) {
      children = booking.children ?? booking.childCount ?? booking.child_count ?? booking.numChildren ?? booking.kids ?? 0;
    }

    // 3. Dự phòng nếu BE chỉ trả về 1 số tổng (guests / people)
    if (!adults && !children) {
      const total = typeof booking.guests === 'number' 
        ? booking.guests 
        : (parseInt(booking.guests || booking.people || booking.amountPeople || 1) || 1);
      return `👨 ${total} người lớn`;
    }

    adults = parseInt(adults) || 1;
    children = parseInt(children) || 0;

    if (children > 0) {
      return `👨 ${adults} NL, 🧒 ${children} TE`;
    }
    return `👨 ${adults} người lớn`;
  };

  // 🛠️ HÀM LẤY TÊN BÀN HIỂN THỊ
  const getDisplayTableName = (booking) => {
    if (!booking) return 'Chưa chọn bàn';
    if (typeof booking.table === 'object' && booking.table !== null) {
      return booking.table.name || booking.table.code || 'Bàn không tên';
    }
    return booking.tableName || booking.tableCode || booking.table || 'Chưa gán bàn';
  };

  // 🛠️ HÀM ĐỊNH DẠNG NGÀY GIỜ CHUẨN
  const formatBookingTime = (booking) => {
    const rawTime = booking.bookingTime || booking.date || booking.time;
    if (!rawTime) return 'Chưa chọn';

    const d = new Date(rawTime);
    if (isNaN(d.getTime())) {
      return `${booking.date || ''} ${booking.time || ''}`.trim() || String(rawTime);
    }

    const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${timeStr} - ${dateStr}`;
  };

  // 1️⃣ Tải dữ liệu từ Backend & Đồng bộ trạng thái Bàn Giữ (VÀNG)
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

      // Đơn gọi món đang hoạt động
      const activeOrders = safeOrders.filter((o) => o.status !== 'PAID' && o.status !== 'CANCELLED');
      
      // Đơn đặt bàn ĐÃ DUYỆT (CONFIRMED)
      const confirmedBookings = safeBookings.filter((b) => (b.status || '').toUpperCase() === 'CONFIRMED');

      // TỰ ĐỘNG CHUYỂN BÀN TỪ XANH SANG VÀNG NẾU CÓ ĐƠN ĐẶT ĐÃ DUYỆT KHỚP VỚI BÀN
      const updatedTables = safeTables.map((tbl) => {
        const hasOrder = activeOrders.some((o) => isTableMatching(tbl, o));
        const hasConfirmedBooking = confirmedBookings.some((b) => isTableMatching(tbl, b));

        let calculatedStatus = tbl.status || 'AVAILABLE';

        if (hasOrder || tbl.status === 'OCCUPIED') {
          calculatedStatus = 'OCCUPIED'; // ĐỎ
        } else if (hasConfirmedBooking || tbl.status === 'RESERVED') {
          calculatedStatus = 'RESERVED'; // VÀNG (GIỮ BÀN)
        } else {
          calculatedStatus = 'AVAILABLE'; // XANH (TRỐNG)
        }

        return {
          ...tbl,
          status: calculatedStatus
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

  // 🔔 2️⃣ CẢNH BÁO ĐƠN SẮP ĐẾN GIỜ (LẶP 5S/LẦN)
  useEffect(() => {
    const checkUrgentBookings = () => {
      const now = new Date().getTime();
      const ONE_HOUR_MS = 60 * 60 * 1000;

      const urgentList = bookings.filter((b) => {
        const status = (b.status || 'PENDING').toUpperCase();
        if (status === 'CONFIRMED' || status === 'CANCELLED') return false;

        const rawTime = b.bookingTime || b.date || b.time;
        if (!rawTime) return false;

        const bookingTs = new Date(rawTime).getTime();
        if (isNaN(bookingTs)) return false;

        const diff = bookingTs - now;
        return diff <= ONE_HOUR_MS;
      });

      setUrgentCount(urgentList.length);
    };

    checkUrgentBookings();
    const alertInterval = setInterval(checkUrgentBookings, 5000);
    return () => clearInterval(alertInterval);
  }, [bookings]);

  // 3️⃣ Mở Bàn xem Hóa đơn
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
          (o) => isTableMatching(table, o) && o.status !== 'PAID' && o.status !== 'CANCELLED'
        );
        setCurrentOrder(activeOrder || null);
      }
    } catch (err) {
      alert('❌ Lỗi tải hóa đơn bàn này!');
    } finally {
      setLoadingOrder(false);
    }
  };

  // 4️⃣ Thay đổi số lượng món gọi thêm
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

  // 5️⃣ Gửi món gọi thêm
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

  // 6️⃣ THANH TOÁN & GIẢI PHÓNG BÀN (TRỞ VỀ MÀU XANH TRỐNG)
  const handleCheckout = async () => {
    if (!currentOrder) return;

    const total = currentOrder.totalAmount || 0;
    const numCash = parseFloat(cashReceived) || 0;

    if (paymentMethod === 'CASH' && numCash < total) {
      alert('⚠️ Số tiền khách đưa chưa đủ!');
      return;
    }

    const methodText = paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản VietQR';
    if (!window.confirm(`Xác nhận thanh toán ${total.toLocaleString('vi-VN')}đ (${methodText}) cho ${selectedTable.name}?`)) {
      return;
    }

    setIsProcessingPayment(true);
    try {
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

      const tableId = selectedTable._id || selectedTable.id;
      await fetch(`${API_URL}/api/tables/${tableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'AVAILABLE' })
      });

      alert(`🎉 Thanh toán thành công! Bàn ${selectedTable.name} đã giải phóng thành Bàn Trống (Xanh).`);
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

  // 7️⃣ DUYỆT ĐẶT BÀN -> CHUYỂN BÀN TƯƠNG ỨNG TỪ XANH SANG VÀNG (RESERVED)
  const handleUpdateBookingStatus = async (booking, newStatus) => {
    const bookingId = booking._id || booking.id;
    
    // Tìm ID bàn tương ứng trong booking
    let targetTableId = '';
    if (typeof booking.table === 'object' && booking.table !== null) {
      targetTableId = booking.table._id || booking.table.id || '';
    } else {
      targetTableId = booking.tableId || booking.table || '';
    }

    try {
      // 1. Cập nhật trạng thái đơn đặt hàng
      let res = await fetch(`${API_URL}/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        await fetch(`${API_URL}/api/reservations/${bookingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
      }

      // 2. NẾU DUYỆT ĐƠN (CONFIRMED) -> ÉP BÀN ĐÓ CHUYỂN SANG MÀU VÀNG (RESERVED)
      if (newStatus === 'CONFIRMED') {
        if (targetTableId) {
          await fetch(`${API_URL}/api/tables/${targetTableId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'RESERVED' })
          }).catch(() => null);
        }

        // Cập nhật ngay lập tức giao diện Bàn (UI) sang Màu Vàng mà không cần chờ reload
        setTables((prevTables) =>
          prevTables.map((tbl) => {
            const isMatch = isTableMatching(tbl, booking) || String(tbl._id || tbl.id) === String(targetTableId);
            if (isMatch) {
              return { ...tbl, status: 'RESERVED' }; // Ép thành VÀNG ngay lập tức!
            }
            return tbl;
          })
        );
      } else if (newStatus === 'CANCELLED' && targetTableId) {
        // Nếu Hủy đơn giữ bàn, đưa bàn về màu XANH (AVAILABLE)
        await fetch(`${API_URL}/api/tables/${targetTableId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'AVAILABLE' })
        }).catch(() => null);
      }

      alert(`✅ Đã ${newStatus === 'CONFIRMED' ? 'duyệt đơn (Bàn đã chuyển từ XANH sang VÀNG)' : 'hủy đơn'} thành công!`);
      await fetchData();
    } catch (err) {
      alert('❌ Lỗi kết nối máy chủ!');
    }
  };

  const pendingCount = bookings.filter((b) => (b.status || 'PENDING').toUpperCase() === 'PENDING').length;
  const totalAmount = currentOrder?.totalAmount || 0;
  const changeAmount = paymentMethod === 'CASH' ? (parseFloat(cashReceived) || 0) - totalAmount : 0;

  const qrNote = encodeURIComponent(`Thanh toan ${selectedTable?.name || ''}`);
  const vietQrUrl = `https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNo}-compact2.png?amount=${totalAmount}&addInfo=${qrNote}&accountName=${encodeURIComponent(BANK_CONFIG.accountName)}`;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', color: '#fff', backgroundColor: '#111827', minHeight: '90vh' }}>
      
      {/* KHU VỰC CẢNH BÁO ĐƠN CHƯA DUYỆT SẮP ĐẾN HẸN */}
      {urgentCount > 0 && (
        <div style={{
          backgroundColor: '#ef4444',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 0 12px rgba(239, 68, 68, 0.6)'
        }}>
          <span>🚨 CẢNH BẢO: Có {urgentCount} đơn đặt bàn trong vòng 1 tiếng chưa được duyệt!</span>
          <button
            onClick={() => setActiveTab('BOOKINGS')}
            style={{
              backgroundColor: '#fff',
              color: '#ef4444',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Xem & Duyệt ngay
          </button>
        </div>
      )}

      {/* HEADER & TABS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ color: '#fbbf24', margin: 0 }}>💵 MÀN HÌNH THU NGÂN & THANH TOÁN</h2>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: '5px 0 0 0' }}>
            Quản lý sơ đồ bàn (Xanh: Trống | Vàng: Giữ Bàn | Đỏ: Đang có khách) & Đặt Bàn.
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
            🪑 Sơ đồ bàn ({tables.filter((t) => t.status === 'OCCUPIED' || t.status === 'RESERVED').length}/{tables.length})
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

      {/* TAB 1: SƠ ĐỒ BÀN (XANH = TRỐNG, VÀNG = ĐÃ DUYỆT GIỮ BÀN, ĐỎ = ĐANG DÙNG) */}
      {activeTab === 'TABLES' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
            {tables.map((table) => {
              const isOccupied = table.status === 'OCCUPIED';
              const isReserved = table.status === 'RESERVED';

              // MẶC ĐỊNH: XANH LÁ (BÀN TRỐNG)
              let bgColor = '#064e3b';
              let borderColor = '#10b981';
              let statusText = '🟢 BÀN TRỐNG';

              if (isOccupied) {
                // MÀU ĐỎ: ĐANG ĂN / CÓ HÓA ĐƠN
                bgColor = '#7f1d1d';
                borderColor = '#ef4444';
                statusText = '🔴 ĐANG CÓ KHÁCH';
              } else if (isReserved) {
                // MÀU VÀNG: ĐÃ DUYỆT ĐẶT BÀN (GIỮ BÀN)
                bgColor = '#78350f';
                borderColor = '#f59e0b';
                statusText = '🟡 GIỮ BÀN (ĐÃ DUYỆT)';
              }

              return (
                <div
                  key={table._id || table.code || Math.random()}
                  onClick={() => handleSelectTable(table)}
                  style={{
                    background: bgColor,
                    borderRadius: '10px',
                    padding: '18px 10px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                    border: `2px solid ${borderColor}`,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{table.name || table.code}</div>
                  <div style={{ fontSize: '12px', marginTop: '6px', fontWeight: '600', color: isOccupied ? '#fca5a5' : isReserved ? '#fde68a' : '#6ee7b7' }}>
                    {statusText}
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
                      background: isOccupied ? '#ef4444' : isReserved ? '#d97706' : '#374151',
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

      {/* TAB 2: ĐƠN ĐẶT BÀN (ĐỌC ĐÚNG API CỦA BE) */}
      {activeTab === 'BOOKINGS' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1f2937', borderRadius: '10px' }}>
            <thead>
              <tr style={{ background: '#374151', color: '#fbbf24', textAlign: 'left', fontSize: '14px' }}>
                <th style={{ padding: '12px' }}>Khách hàng</th>
                <th style={{ padding: '12px' }}>Số điện thoại</th>
                <th style={{ padding: '12px' }}>🪑 Bàn chọn</th>
                <th style={{ padding: '12px' }}>Thời gian hẹn</th>
                <th style={{ padding: '12px' }}>👥 Số lượng người</th>
                <th style={{ padding: '12px' }}>Ghi chú / Trạng thái</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((item) => {
                const status = (item.status || 'PENDING').toUpperCase();
                const isConfirmed = status === 'CONFIRMED';
                const isCancelled = status === 'CANCELLED';

                return (
                  <tr key={item._id || item.id} style={{ borderBottom: '1px solid #374151', fontSize: '14px' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.customerName || item.fullName || item.name || 'Khách Vô Danh'}</td>
                    <td style={{ padding: '12px', color: '#60a5fa' }}>{item.phone || item.phoneNumber || 'N/A'}</td>
                    
                    <td style={{ padding: '12px', color: '#38bdf8', fontWeight: 'bold' }}>
                      {getDisplayTableName(item)}
                    </td>

                    <td style={{ padding: '12px', color: '#fbbf24', fontWeight: '500' }}>
                      ⏱️ {formatBookingTime(item)}
                    </td>

                    {/* HIỂN THỊ ĐÚNG SỐ LƯỢNG NGƯỜI LỚN & TRẺ EM TỪ API CỦA BE */}
                    <td style={{ padding: '12px', color: '#34d399', fontWeight: '600' }}>
                      {formatGuests(item)}
                    </td>

                    <td style={{ padding: '12px' }}>
                      <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}>{item.note || 'Không ghi chú'}</div>
                      <strong style={{ color: isConfirmed ? '#10b981' : isCancelled ? '#ef4444' : '#f59e0b' }}>
                        {isConfirmed ? 'ĐÃ DUYỆT (GIỮ BÀN MÀU VÀNG)' : isCancelled ? 'ĐÃ HỦY' : 'CHỜ DUYỆT'}
                      </strong>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        {!isConfirmed && !isCancelled && (
                          <button
                            onClick={() => handleUpdateBookingStatus(item, 'CONFIRMED')}
                            style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            Duyệt giữ bàn (Đổi sang Vàng)
                          </button>
                        )}
                        {!isCancelled && (
                          <button
                            onClick={() => handleUpdateBookingStatus(item, 'CANCELLED')}
                            style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}
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

      {/* POPUP THANH TOÁN & GỌI MÓN THÊM */}
      {selectedTable && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#1f2937', width: '1050px', maxWidth: '95vw', height: '90vh', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            
            <button onClick={() => setSelectedTable(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '24px', cursor: 'pointer' }}>✕</button>

            <h3 style={{ margin: '0 0 15px 0', color: '#fbbf24', textAlign: 'center' }}>
              💳 QUẢN LÝ TÍNH TIỀN & THÊM MÓN - {selectedTable.name || selectedTable.code}
            </h3>

            {loadingOrder ? (
              <p style={{ textAlign: 'center', margin: 'auto' }}>⏳ Đang tải hóa đơn...</p>
            ) : !currentOrder ? (
              <div style={{ textAlign: 'center', margin: 'auto' }}>
                <p style={{ color: '#9ca3af' }}>Bàn này hiện chưa có hóa đơn chưa thanh toán.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.1fr', gap: '15px', flex: 1, overflow: 'hidden' }}>
                
                {/* CỘT 1: HÓA ĐƠN HIỆN TẠI */}
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

                {/* CỘT 3: HÌNH THỨC THANH TOÁN (TIỀN MẶT / VIETQR) */}
                <div style={{ background: '#111827', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ color: '#ef4444', marginTop: 0 }}>💰 Phương thức thanh toán</h4>
                    
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '15px' }}>
                      <button
                        onClick={() => setPaymentMethod('CASH')}
                        style={{
                          flex: 1,
                          padding: '10px 4px',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          background: paymentMethod === 'CASH' ? '#10b981' : '#374151',
                          color: '#fff'
                        }}
                      >
                        💵 Tiền mặt
                      </button>

                      <button
                        onClick={() => setPaymentMethod('VIETQR')}
                        style={{
                          flex: 1,
                          padding: '10px 4px',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          background: paymentMethod === 'VIETQR' ? '#3b82f6' : '#374151',
                          color: '#fff'
                        }}
                      >
                        📲 Chuyển khoản VietQR
                      </button>
                    </div>

                    {paymentMethod === 'CASH' && (
                      <div style={{ background: '#1f2937', padding: '10px', borderRadius: '6px' }}>
                        <label style={{ fontSize: '12px', color: '#9ca3af' }}>Tiền khách đưa (VNĐ):</label>
                        <input
                          type="number"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                          placeholder="Nhập số tiền..."
                          style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #374151', background: '#111827', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                        <div style={{ marginTop: '10px', fontSize: '13px', color: changeAmount >= 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                          Tiền thừa trả khách: {changeAmount >= 0 ? `${changeAmount.toLocaleString('vi-VN')}đ` : 'Chưa đủ tiền!'}
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'VIETQR' && (
                      <div style={{ background: '#fff', color: '#000', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#2563eb', marginBottom: '4px' }}>
                          MÃ CHUYỂN KHOẢN VIETQR AUTO
                        </div>
                        <img
                          src={vietQrUrl}
                          alt="VietQR Payment Code"
                          style={{ width: '180px', height: '180px', objectFit: 'contain', margin: '0 auto', display: 'block', borderRadius: '6px' }}
                        />
                        <div style={{ fontSize: '11px', marginTop: '6px', color: '#374151' }}>
                          Số tiền: <strong>{totalAmount.toLocaleString('vi-VN')}đ</strong>
                        </div>
                        <div style={{ fontSize: '10px', color: '#6b7280' }}>
                          STK: {BANK_CONFIG.accountNo} ({BANK_CONFIG.bankId})
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
                      fontSize: '15px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      marginTop: '12px'
                    }}
                  >
                    {isProcessingPayment ? '⏳ Đang xác nhận...' : '✅ XÁC NHẬN ĐÃ THU TIỀN'}
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