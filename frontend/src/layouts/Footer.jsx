import React from 'react';

function Footer() {
  // Đường dẫn định vị Google Maps theo địa chỉ của bạn
  const addressText = "Số 17 phố Thanh Vân, xã Hội Thịnh, Phú Thọ";
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText)}`;

  return (
    <footer style={{ background: '#090d16', color: '#9ca3af', padding: '30px 20px', fontSize: '14px' }}>
      {/* KHUNG CHỨA DÀN HÀNG NGANG (FLEXBOX) */}
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        {/* CỘT BÊN TRÁI: THÔNG TIN NHÀ HÀNG */}
        <div style={{ flex: '1 1 350px', textAlign: 'left' }}>
          <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
            Nhà Hàng Sang Trọng L’Amour
          </h3>

          <p style={{ margin: '8px 0', lineHeight: '1.5' }}>
            📍 Địa chỉ:{' '}
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#d1d5db', textDecoration: 'none' }}
              title="Bấm để xem chỉ đường trên Google Maps"
            >
              {addressText}{' '}
              <span style={{ color: '#3b82f6', fontSize: '13px' }}>(🗺️ Chỉ đường)</span>
            </a>
          </p>

          <p style={{ margin: '8px 0' }}>
            📞 Hotline:{' '}
            <a href="tel:0968771491" style={{ color: '#fbbf24', fontWeight: 'bold', textDecoration: 'none' }}>
              0968 771 491
            </a>{' '}
            | ✉️ Email: contact@lamour.com
          </p>
        </div>

        {/* CỘT BÊN PHẢI: BẢN ĐỒ THU NHỎ VỪA VẶN */}
        <div
          style={{
            width: '320px',
            height: '160px',
            borderRadius: '10px',
            overflow: 'hidden',
            border: '1px solid #374151',
            flexShrink: 0
          }}
        >
          <iframe
            title="Địa chỉ Nhà hàng"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src={`https://maps.google.com/maps?q=${encodeURIComponent(addressText)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
          ></iframe>
        </div>
      </div>

      <hr style={{ borderColor: '#1f2937', margin: '20px 0' }} />

      {/* BẢN QUYỀN (CĂN GIỮA DƯỚI CÙNG) */}
      <p style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280', margin: 0 }}>
        © 2026 L’Amour Restaurant. All rights reserved. | <a href="/admin" style={{ color: '#6b7280' }}>Quản trị</a>
      </p>
    </footer>
  );
}

export default Footer;