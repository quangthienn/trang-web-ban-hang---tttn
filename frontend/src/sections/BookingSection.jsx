import React, { useState } from 'react';

// 🌐 Khai báo link Backend Render Online tại đây:
const API_URL = 'https://trang-web-ban-hang-tttn.onrender.com';

function BookingSection({ onBookTable }) {
  // Lấy ngày hôm nay làm mặc định (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    date: today,
    time: '19:00',
    adults: 2,
    children: 0,
    note: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Danh sách khung giờ phục vụ
  const availableTimes = [
    '10:30', '11:00', '11:30', '12:00', '12:30', '13:00',
    '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuestChange = (type, delta) => {
    setFormData((prev) => {
      const current = prev[type];
      const updated = Math.max(type === 'adults' ? 1 : 0, current + delta);
      return { ...prev, [type]: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.phone.trim()) {
      alert('⚠️ Vui lòng nhập đầy đủ Họ tên và Số điện thoại!');
      return;
    }

    setIsSubmitting(true);

    try {
      const numAdults = Number(formData.adults);
      const numChildren = Number(formData.children);

      // 🚀 Payload gửi lên Backend (Không cần truyền tableCode)
      const payload = {
        customerName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        bookingTime: new Date(`${formData.date}T${formData.time}:00`),
        adults: numAdults,
        children: numChildren,
        guestCount: numAdults + numChildren,
        note: formData.note
      };

      const response = await fetch(`${API_URL}/api/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        if (onBookTable) {
          onBookTable(data);
        }

        alert(
          `🎉 Đặt bàn thành công!\n\n• Khách hàng: ${formData.fullName}\n• Thời gian: ${formData.time} - Ngày ${formData.date}\n• Số khách: ${numAdults} người lớn${
            numChildren > 0 ? `, ${numChildren} trẻ em` : ''
          }\n\nNhà hàng sẽ liên hệ xác nhận và xếp bàn cho bạn sớm nhất!`
        );

        // Reset form
        setFormData({
          fullName: '',
          phone: '',
          email: '',
          date: today,
          time: '19:00',
          adults: 2,
          children: 0,
          note: ''
        });
      } else {
        const errorMessage = data?.message || `Lỗi từ hệ thống (Mã lỗi HTTP ${response.status})`;
        alert(`❌ Đặt bàn thất bại: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Lỗi khi đặt bàn:', error);
      alert('❌ Lỗi kết nối đến máy chủ! Vui lòng kiểm tra lại đường truyền.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="booking" style={styles.section}>
      <div style={styles.overlay}>
        <div style={styles.header}>
          <span style={styles.badge}>RESERVATION</span>
          <h2 style={styles.title}>Đặt Bàn Thưởng Thức Ẩm Thực</h2>
          <p style={styles.subtitle}>
            Đặt trước bàn để L'Amour chuẩn bị cho bạn một không gian hoàn hảo cùng trải nghiệm dịch vụ chu đáo nhất.
          </p>
        </div>

        <div style={styles.card}>
          <form onSubmit={handleSubmit}>
            {/* HÀNG 1: THÔNG TIN KHÁCH HÀNG */}
            <div style={styles.grid2}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Họ và tên *</label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={formData.fullName}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Số điện thoại *</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Ví dụ: 0912 345 678"
                  value={formData.phone}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            {/* HÀNG 2: NGÀY & GIỜ ĐẶT BÀN */}
            <div style={styles.grid2}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Ngày đặt bàn *</label>
                <input
                  type="date"
                  name="date"
                  min={today}
                  value={formData.date}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Khung giờ *</label>
                <select
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  style={styles.select}
                >
                  {availableTimes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* HÀNG 3: SỐ LƯỢNG KHÁCH */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Số lượng khách *</label>
              <div style={styles.stepperContainer}>
                {/* Người lớn */}
                <div style={styles.stepperBox}>
                  <span style={styles.stepperLabel}>Người lớn:</span>
                  <div style={styles.stepperControl}>
                    <button
                      type="button"
                      onClick={() => handleGuestChange('adults', -1)}
                      style={styles.stepBtn}
                    >
                      -
                    </button>
                    <span style={styles.stepVal}>{formData.adults}</span>
                    <button
                      type="button"
                      onClick={() => handleGuestChange('adults', 1)}
                      style={styles.stepBtn}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Trẻ em */}
                <div style={styles.stepperBox}>
                  <span style={styles.stepperLabel}>Trẻ em:</span>
                  <div style={styles.stepperControl}>
                    <button
                      type="button"
                      onClick={() => handleGuestChange('children', -1)}
                      style={styles.stepBtn}
                    >
                      -
                    </button>
                    <span style={styles.stepVal}>{formData.children}</span>
                    <button
                      type="button"
                      onClick={() => handleGuestChange('children', 1)}
                      style={styles.stepBtn}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* HÀNG 4: GHI CHÚ */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Ghi chú / Yêu cầu đặc biệt</label>
              <textarea
                name="note"
                rows="3"
                placeholder="Ví dụ: Cần không gian yên tĩnh, dị ứng hải sản, trang trí tiệc sinh nhật..."
                value={formData.note}
                onChange={handleChange}
                style={styles.textarea}
              />
            </div>

            {/* NÚT SUBMIT */}
            <div style={{ textAlign: 'center', marginTop: '25px' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  ...styles.submitBtn,
                  opacity: isSubmitting ? 0.7 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? '⏳ ĐANG XỬ LÝ...' : '🥂 XÁC NHẬN ĐẶT BÀN'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

// 🎨 Styles
const styles = {
  section: {
    padding: '80px 20px',
    backgroundColor: '#111827',
    color: '#f9fafb',
    fontFamily: '"Plus Jakarta Sans", sans-serif, system-ui'
  },
  header: {
    textAlign: 'center',
    maxWidth: '600px',
    margin: '0 auto 40px auto'
  },
  badge: {
    color: '#fbbf24',
    letterSpacing: '2px',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    display: 'inline-block',
    marginBottom: '8px'
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    margin: '0 0 12px 0',
    color: '#ffffff'
  },
  subtitle: {
    fontSize: '15px',
    color: '#9ca3af',
    lineHeight: '1.6'
  },
  card: {
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '16px',
    padding: '35px 30px',
    maxWidth: '750px',
    margin: '0 auto',
    boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '18px'
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '18px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#e5e7eb'
  },
  input: {
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1px solid #4b5563',
    backgroundColor: '#111827',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  select: {
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1px solid #4b5563',
    backgroundColor: '#111827',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  textarea: {
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1px solid #4b5563',
    backgroundColor: '#111827',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    resize: 'vertical'
  },
  stepperContainer: {
    display: 'flex',
    gap: '15px',
    backgroundColor: '#111827',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #4b5563',
    alignItems: 'center',
    justify: 'space-around'
  },
  stepperBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  stepperLabel: {
    fontSize: '13px',
    color: '#9ca3af'
  },
  stepperControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  stepBtn: {
    width: '26px',
    height: '26px',
    borderRadius: '4px',
    border: '1px solid #4b5563',
    backgroundColor: '#374151',
    color: '#ffffff',
    cursor: 'pointer',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justify: 'center'
  },
  stepVal: {
    fontWeight: 'bold',
    fontSize: '14px',
    minWidth: '16px',
    textAlign: 'center'
  },
  submitBtn: {
    backgroundColor: '#e11d48',
    color: '#ffffff',
    border: 'none',
    padding: '14px 36px',
    borderRadius: '30px',
    fontSize: '15px',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(225, 29, 72, 0.4)'
  }
};

export default BookingSection;