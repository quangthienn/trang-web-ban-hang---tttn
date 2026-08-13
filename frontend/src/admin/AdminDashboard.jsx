import React, { useState, useEffect } from 'react';

// 🌐 Đổi link localhost sang link Render Backend của bạn tại đây:
const API_URL = 'https://trang-web-ban-hang---tttn.onrender.com';

function AdminDashboard() {
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // Khởi tạo ngày mặc định: Hôm nay (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);

  // 1️⃣ Lấy dữ liệu Bàn và Order từ Backend Online
  const fetchData = async () => {
    try {
      const [resTables, resOrders] = await Promise.all([
        fetch(`${API_URL}/api/tables`),
        fetch(`${API_URL}/api/orders`)
      ]);

      if (resTables.ok && resOrders.ok) {
        setTables(await resTables.json());
        setOrders(await resOrders.json());
      }
    } catch (err) {
      console.error('❌ Lỗi tải dữ liệu thống kê:', err);
    }
  };

  useEffect(() => {
    fetchData();
    // ⚡ ĐỔI THÀNH 3 GIÂY: Thu ngân vừa bấm thanh toán là Admin nhảy tiền ngay lập tức!
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  // 2️⃣ Tính toán Thống kê theo Khoảng Ngày được chọn
  const filteredOrders = orders.filter((order) => {
    const isPaid = order.status === 'PAID' || order.status === 'COMPLETED';
    if (!isPaid) return false;

    const orderDate = new Date(order.createdAt).getTime();
    
    const [fYear, fMonth, fDay] = fromDate.split('-');
    const start = new Date(fYear, fMonth - 1, fDay, 0, 0, 0, 0).getTime();

    const [tYear, tMonth, tDay] = toDate.split('-');
    const end = new Date(tYear, tMonth - 1, tDay, 23, 59, 59, 999).getTime();

    return orderDate >= start && orderDate <= end;
  });

  // Tổng doanh thu trong khoảng thời gian chọn
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

  // Thống kê trạng thái bàn
  const totalTables = tables.length;
  const occupiedTables = tables.filter((t) => t.status === 'OCCUPIED').length;
  const availableTables = totalTables - occupiedTables;

  return (
    <div style={{ padding: '10px 0', fontFamily: 'sans-serif', color: '#1f2937' }}>
      <h2 style={{ color: '#1f2937', marginTop: 0 }}>📊 THỐNG KÊ & BÁO CÁO DOANH THU</h2>

      {/* 📅 BỘ LỌC THỜI GIAN */}
      <div style={{ background: '#fff', padding: '15px 20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 'bold', color: '#374151' }}>📆 Chọn khoảng thời gian:</span>
        <div>
          <label style={{ fontSize: '13px', color: '#6b7280', marginRight: '5px' }}>Từ ngày:</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '13px', color: '#6b7280', marginRight: '5px' }}>Đến ngày:</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
          />
        </div>
        <button
          onClick={fetchData}
          style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          🔄 Cập nhật
        </button>
      </div>

      {/* 📈 CÁC THẺ THỐNG KÊ TỔNG QUAN */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '25px' }}>
        {/* Thẻ 1: Doanh thu */}
        <div style={{ background: '#10b981', color: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>💰 Tổng Doanh Thu</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '5px' }}>
            {totalRevenue.toLocaleString('vi-VN')} đ
          </div>
          <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>
            Từ {fromDate} ➔ {toDate}
          </div>
        </div>

        {/* Thẻ 2: Số hóa đơn */}
        <div style={{ background: '#3b82f6', color: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>🧾 Tổng Hóa Đơn Thanh Toán</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '5px' }}>
            {filteredOrders.length} đơn
          </div>
          <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>
            Đã hoàn thành giao dịch
          </div>
        </div>

        {/* Thẻ 3: Trạng thái bàn hiện tại */}
        <div style={{ background: '#f59e0b', color: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>🔴 Bàn Đang Có Khách</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '5px' }}>
            {occupiedTables} / {totalTables} Bàn
          </div>
          <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>
            🟢 Bàn trống: {availableTables} bàn
          </div>
        </div>
      </div>

      {/* 🧾 BẢNG CHI TIẾT HÓA ĐƠN */}
      <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ marginTop: 0, color: '#374151', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
          📋 Lịch Sử Đơn Hàng Thanh Toán
        </h3>

        {filteredOrders.length === 0 ? (
          <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>
            Không có hóa đơn nào trong khoảng thời gian này.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f9fafb', color: '#6b7280', fontSize: '14px' }}>
                  <th style={{ padding: '12px' }}>Thời gian</th>
                  <th style={{ padding: '12px' }}>Bàn</th>
                  <th style={{ padding: '12px' }}>Các món đã gọi</th>
                  <th style={{ padding: '12px' }}>HT Thanh toán</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Tổng tiền</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order._id} style={{ borderBottom: '1px solid #f3f4f6', fontSize: '14px' }}>
                    <td style={{ padding: '12px', color: '#4b5563' }}>
                      {new Date(order.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#1f2937' }}>
                      {order.tableName || order.tableCode || `Bàn ${order.tableId}`}
                    </td>
                    <td style={{ padding: '12px', color: '#4b5563' }}>
                      {order.items?.map((i) => `${i.name} (x${i.quantity})`).join(', ')}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          background: order.paymentMethod === 'TRANSFER' ? '#dbeafe' : '#d1fae5',
                          color: order.paymentMethod === 'TRANSFER' ? '#1e40af' : '#065f46'
                        }}
                      >
                        {order.paymentMethod === 'TRANSFER' ? '💳 Chuyển khoản' : '💵 Tiền mặt'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>
                      {order.totalAmount?.toLocaleString('vi-VN')} đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;