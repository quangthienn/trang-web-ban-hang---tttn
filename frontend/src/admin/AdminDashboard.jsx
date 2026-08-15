import React, { useState, useEffect } from 'react';

const API_URL = 'https://trang-web-ban-hang-tttn.onrender.com';

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [timeFilter, setTimeFilter] = useState('ALL'); // 'ALL' | 'TODAY' | 'THIS_MONTH'

  // Kéo dữ liệu đơn hàng từ Backend
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/orders`);
      const data = await res.json();
      const safeOrders = Array.isArray(data) ? data : data.orders || data.data || [];
      setOrders(safeOrders);
    } catch (err) {
      console.error('❌ Lỗi tải dữ liệu đơn hàng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Hàm định dạng ngày giờ chi tiết (VD: 14:30 - 15/08/2026)
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Chưa ghi nhận';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Thời gian lỗi';

    const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    return `${timeStr} - ${dateStr}`;
  };

  // Lọc các đơn đã thanh toán hoặc hợp lệ
  const paidOrders = orders.filter((o) => o.status === 'PAID' || o.status === 'COMPLETED' || !o.status);

  // Lọc theo khoảng thời gian
  const filteredOrders = paidOrders.filter((order) => {
    const orderDate = new Date(order.updatedAt || order.createdAt || order.date);
    const now = new Date();

    if (timeFilter === 'TODAY') {
      return orderDate.toDateString() === now.toDateString();
    }
    if (timeFilter === 'THIS_MONTH') {
      return (
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getFullYear() === now.getFullYear()
      );
    }
    return true;
  });

  // TÍNH TOÁN DOANH THU
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const cashRevenue = filteredOrders
    .filter((o) => o.paymentMethod === 'CASH')
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const qrRevenue = filteredOrders
    .filter((o) => o.paymentMethod === 'VIETQR' || o.paymentMethod === 'TRANSFER' || o.paymentMethod === 'BANK')
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  // TOP MÓN BÁN CHẠY
  const itemMap = {};
  filteredOrders.forEach((order) => {
    if (Array.isArray(order.items)) {
      order.items.forEach((item) => {
        const name = item.name || 'Món không tên';
        const qty = Number(item.quantity) || 1;
        itemMap[name] = (itemMap[name] || 0) + qty;
      });
    }
  });

  const topItems = Object.entries(itemMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', color: '#fbbf24' }}>📊 ADMIN DASHBOARD - THỐNG KÊ DOANH SỐ</h1>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>Chi tiết lịch sử thanh toán & thời gian gọi món</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', cursor: 'pointer' }}
          >
            <option value="ALL">🌐 Tất cả thời gian</option>
            <option value="TODAY">📅 Hôm nay</option>
            <option value="THIS_MONTH">📆 Tháng này</option>
          </select>

          <button
            onClick={fetchOrders}
            style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: '#2563eb', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
          >
            🔄 Tải lại
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>⏳ Đang tổng hợp dữ liệu...</div>
      ) : (
        <>
          {/* CARDS TỔNG QUAN */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '10px', borderLeft: '4px solid #10b981' }}>
              <div style={{ color: '#94a3b8', fontSize: '12px' }}>TỔNG DOANH THU</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#34d399', marginTop: '4px' }}>
                {totalRevenue.toLocaleString('vi-VN')} <span style={{ fontSize: '14px' }}>đ</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '10px', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ color: '#94a3b8', fontSize: '12px' }}>TIỀN MẶT</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fbbf24', marginTop: '4px' }}>
                {cashRevenue.toLocaleString('vi-VN')} <span style={{ fontSize: '14px' }}>đ</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '10px', borderLeft: '4px solid #3b82f6' }}>
              <div style={{ color: '#94a3b8', fontSize: '12px' }}>CHUYỂN KHOẢN / QR</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#60a5fa', marginTop: '4px' }}>
                {qrRevenue.toLocaleString('vi-VN')} <span style={{ fontSize: '14px' }}>đ</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '10px', borderLeft: '4px solid #a855f7' }}>
              <div style={{ color: '#94a3b8', fontSize: '12px' }}>TỔNG ĐƠN HÀNG</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#c084fc', marginTop: '4px' }}>
                {filteredOrders.length} <span style={{ fontSize: '14px' }}>đơn</span>
              </div>
            </div>
          </div>

          {/* BẢNG CHI TIẾT */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            
            {/* TOP MÓN BÁN CHẠY */}
            <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '10px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#fbbf24' }}>🏆 Top 5 món bán chạy nhất</h3>
              {topItems.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '13px' }}>Chưa có món nào được đặt.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {topItems.map(([name, qty], idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '10px 12px', borderRadius: '6px' }}>
                      <span style={{ fontSize: '13px' }}>
                        <strong style={{ color: '#f59e0b', marginRight: '6px' }}>#{idx + 1}</strong> {name}
                      </span>
                      <span style={{ backgroundColor: '#1e3a8a', color: '#93c5fd', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' }}>
                        {qty} phần
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* DANH SÁCH ĐƠN HÀNG KÈM MỐC THỜI GIAN */}
            <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '10px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#fbbf24' }}>🧾 Lịch sử đơn hàng & Thời gian</h3>
              <div style={{ overflowX: 'auto', maxHeight: '350px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                      <th style={{ padding: '8px 6px' }}>Thời gian</th>
                      <th style={{ padding: '8px 6px' }}>Bàn</th>
                      <th style={{ padding: '8px 6px' }}>P.Thức</th>
                      <th style={{ padding: '8px 6px', textAlign: 'right' }}>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ padding: '15px', textAlign: 'center', color: '#64748b' }}>
                          Chưa có lịch sử đơn hàng.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((o) => (
                        <tr key={o._id} style={{ borderBottom: '1px solid #1e293b' }}>
                          <td style={{ padding: '8px 6px', color: '#cbd5e1', fontSize: '12px' }}>
                            ⏱️ {formatDateTime(o.updatedAt || o.createdAt)}
                          </td>
                          <td style={{ padding: '8px 6px', fontWeight: 'bold', color: '#38bdf8' }}>
                            {o.tableName || o.tableCode || 'Bàn không tên'}
                          </td>
                          <td style={{ padding: '8px 6px' }}>
                            <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', backgroundColor: o.paymentMethod === 'CASH' ? '#065f46' : '#1e40af', color: '#fff' }}>
                              {o.paymentMethod === 'CASH' ? 'TM' : 'CK'}
                            </span>
                          </td>
                          <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 'bold', color: '#34d399' }}>
                            {(Number(o.totalAmount) || 0).toLocaleString('vi-VN')}đ
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
}

export default AdminDashboard;