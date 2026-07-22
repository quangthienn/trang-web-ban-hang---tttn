import React, { useState } from 'react';

const BookingSection = ({ tables, onBookTable }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [guests, setGuests] = useState('2');
  const [time, setTime] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    // 🔍 Tự động tìm bàn trống phù hợp cho khách
    const availableTable = tables.find(
      (t) => t.status === 'AVAILABLE' && t.capacity >= Number(guests)
    );

    if (!availableTable) {
      alert(`⚠️ Rất tiếc! Nhà hàng hiện đã HẾT BÀN TRỐNG phù hợp cho nhóm ${guests} người vào khung giờ này.`);
      return;
    }

    // Tiến hành đặt bàn thành công
    onBookTable({
      id: Date.now(),
      name,
      phone,
      guests: Number(guests),
      time,
      tableId: availableTable.id,
      tableName: availableTable.name,
      createdAt: new Date().toLocaleTimeString()
    });

    alert(`🎉 Đặt bàn thành công! L’Amour Restaurant rất hân hạnh được đón tiếp quý khách.`);
    
    // Reset form
    setName('');
    setPhone('');
    setTime('');
  };

  return (
    <section id="booking" className="booking-section">
      <div className="section-title">
        <h2>Đặt Bàn Trực Tuyến</h2>
        <p>Thưởng thức không gian ẩm thực sang trọng chuẩn Pháp</p>
      </div>

      <form className="booking-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div>
            <label style={{ fontSize: '13px', color: '#c59d5f', marginBottom: '5px', display: 'block' }}>Họ và tên *</label>
            <input 
              type="text" 
              placeholder="Nguyễn Văn A" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', color: '#c59d5f', marginBottom: '5px', display: 'block' }}>Số điện thoại *</label>
            <input 
              type="tel" 
              placeholder="090x xxx xxx" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              required 
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', color: '#c59d5f', marginBottom: '5px', display: 'block' }}>Số lượng khách *</label>
            <select value={guests} onChange={(e) => setGuests(e.target.value)}>
              <option value="2">Tiệc 2 người (Bàn nhỏ)</option>
              <option value="4">Tiệc 4 người (Bàn tiêu chuẩn)</option>
              <option value="8">Tiệc nhóm 8 người (Bàn VIP)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '13px', color: '#c59d5f', marginBottom: '5px', display: 'block' }}>Thời gian đến *</label>
            <input 
              type="datetime-local" 
              value={time} 
              onChange={(e) => setTime(e.target.value)} 
              required 
            />
          </div>
        </div>

        <button type="submit" className="btn-gold" style={{ width: '100%', marginTop: '20px' }}>
          Xác Nhận Giữ Chỗ
        </button>
      </form>
    </section>
  );
};

export default BookingSection;