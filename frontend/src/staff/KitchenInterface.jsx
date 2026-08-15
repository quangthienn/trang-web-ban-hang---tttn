import React, { useState, useEffect } from 'react';

// 🌐 Đổi link localhost sang link Render Backend của bạn tại đây:
const API_URL = 'https://trang-web-ban-hang-tttn.onrender.com';

function KitchenInterface() {
  const [orders, setOrders] = useState([]);

  // Tải các order có chứa món cần bếp chế biến
  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/api/orders`);
      if (res.ok) {
        const data = await res.json();
        
        // Lọc các order chưa hoàn tất thanh toán
        const activeOrders = data.filter(o => ['PENDING', 'COOKING'].includes(o.status));
        
        // Bên trong mỗi order, chỉ lọc lấy các món có cờ isSentToKitchen === false (món mới bổ sung)
        // Lưu ý: Nếu backend của bạn lưu cờ này là isSentToKitchen hoặc chưa có, bạn có thể kiểm tra thêm. 
        // Nếu muốn hiển thị tất cả món chưa xong, ta check item.status hoặc item.isSentToKitchen === false.
        const ordersWithUncookedItems = activeOrders.map(order => ({
          ...order,
          items: order.items ? order.items.filter(item => item.isSentToKitchen === false) : []
        })).filter(order => order.items.length > 0); // Chỉ giữ lại order nào thực sự có món bếp cần nấu

        setOrders(ordersWithUncookedItems);
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu Bếp:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    const timer = setInterval(fetchOrders, 3000); // Tự động cập nhật mỗi 3s
    return () => clearInterval(timer);
  }, []);

  // 🍳 Bếp bấm xác nhận nấu xong món (hoặc cập nhật trạng thái)
  const handleMarkAsCooked = async (orderId) => {
    try {
      // 1. Thử gọi API chuẩn theo code hiện tại của bạn: /api/orders/{orderId}/kitchen-done
      let res = await fetch(`${API_URL}/api/orders/${orderId}/kitchen-done`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });

      // 2. Phòng hờ nếu Backend của bạn dùng route khác, ta dự phòng thêm route chung cập nhật status order/item
      if (res.status === 404) {
        res = await fetch(`${API_URL}/api/orders/${orderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'COOKED' }) // Hoặc cập nhật các món thành đã gửi bếp
        });
      }

      if (res.ok) {
        fetchOrders();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`❌ Không thể cập nhật trạng thái món cho bếp: ${errData.message || 'Lỗi từ server'}`);
      }
    } catch (err) {
      console.error('Lỗi:', err);
      alert('❌ Lỗi kết nối đến server!');
    }
  };

  // Định dạng hiển thị Giờ : Phút : Giây
  const formatTime = (timeStr) => {
    if (!timeStr) return '--:--';
    const d = new Date(timeStr);
    return isNaN(d.getTime()) ? '--:--' : d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Tính số phút đã trôi qua kể từ khi order được tạo
  const getElapsedMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return 0;
    const diffMs = new Date() - d;
    return Math.floor(diffMs / 60000);
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#111827', minHeight: '90vh', color: '#fff', fontFamily: 'sans-serif' }}>
      <h2 style={{ margin: '0 0 20px 0', color: '#fbbf24', textAlign: 'center' }}>
        👨‍🍳 MÀN HÌNH CHẾ BIẾN DÀNH CHO BẾP ({orders.length} ĐƠN ĐANG CHỜ)
      </h2>

      {orders.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#9ca3af', marginTop: '50px', fontSize: '18px' }}>
          🎉 Hiện tại không có món nào cần chế biến!
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {orders.map((order) => {
            const elapsedMins = getElapsedMinutes(order.createdAt);
            const isLate = elapsedMins >= 15; // Cảnh báo đỏ nếu chờ quá 15 phút

            return (
              <div
                key={order._id}
                style={{
                  background: '#1f2937',
                  borderRadius: '12px',
                  border: isLate ? '2px solid #ef4444' : '2px solid #3b82f6',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  {/* TIÊU ĐỀ BÀN & THỜI GIAN GỬI BẾP */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #374151', paddingBottom: '10px', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, color: '#10b981', fontSize: '20px' }}>{order.tableName || order.tableCode || 'Bàn không tên'}</h3>
                    
                    {/* ⏰ THỜI GIAN GỬI XUỐNG BẾP */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: isLate ? '#ef4444' : '#fbbf24' }}>
                        ⏰ Giờ gọi: {formatTime(order.createdAt)}
                      </div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                        ({elapsedMins} phút trước)
                      </div>
                    </div>
                  </div>

                  {/* DANH SÁCH MÓN MỚI CẦN NẤU */}
                  <div style={{ marginBottom: '15px' }}>
                    {order.items?.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed #374151', fontSize: '15px' }}>
                        <span style={{ fontWeight: 'bold' }}>{item.name}</span>
                        <span style={{ background: '#374151', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', color: '#fbbf24' }}>
                          x{item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* NÚT BẤM HOÀN TẤT MÓN CHO BẾP */}
                <div>
                  <button
                    onClick={() => handleMarkAsCooked(order._id)}
                    style={{ width: '100%', padding: '10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
                  >
                    ✅ Báo Xong Món (Ra Đồ)
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default KitchenInterface;