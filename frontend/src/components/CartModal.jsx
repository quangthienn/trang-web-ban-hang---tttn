import React, { useState } from 'react';

function CartModal({ tableNumber, cart, onClose, onUpdateQuantity, onRemoveItem, onCreateOrder }) {
  const [note, setNote] = useState('');

  // Tính tổng tiền giỏ hàng
  const calculateTotal = () => {
    return cart.reduce((sum, item) => {
      const priceNum = typeof item.price === 'number' 
        ? item.price 
        : parseInt(String(item.price).replace(/\D/g, '')) || 0;
      return sum + priceNum * item.quantity;
    }, 0);
  };

  const handleSend = () => {
    if (cart.length === 0) return alert('Giỏ hàng đang trống!');
    onCreateOrder({ note });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '12px', padding: '24px',
        width: '90%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#1f2937' }}>🛒 Giỏ hàng - Bàn {tableNumber}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>❌</button>
        </div>

        {cart.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6b7280', margin: '30px 0' }}>Chưa có món nào trong giỏ hàng!</p>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              {cart.map((item) => {
                const itemId = item._id || item.id;
                const priceNum = typeof item.price === 'number' 
                  ? item.price 
                  : parseInt(String(item.price).replace(/\D/g, '')) || 0;
                
                return (
                  <div key={itemId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f3f4f6', paddingBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                      <div style={{ color: '#e11d48', fontSize: '14px' }}>{priceNum.toLocaleString()}đ</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button onClick={() => onUpdateQuantity(itemId, -1)} style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #ccc' }}>-</button>
                      <span style={{ fontWeight: 'bold' }}>{item.quantity}</span>
                      <button onClick={() => onUpdateQuantity(itemId, 1)} style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #ccc' }}>+</button>
                      <button onClick={() => onRemoveItem(itemId)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', marginLeft: '8px' }}>🗑️</button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: '500' }}>Ghi chú cho bếp:</label>
              <input
                type="text"
                placeholder="VD: Không lấy hành, bớt cay..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
              <span>Tổng tiền:</span>
              <span style={{ color: '#e11d48' }}>{calculateTotal().toLocaleString()}đ</span>
            </div>

            <button
              onClick={handleSend}
              style={{
                width: '100%', padding: '12px', backgroundColor: '#e11d48', color: '#fff',
                border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              🚀 Gửi Đơn Vào Bếp
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default CartModal;