const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true }, // Tên khách đặt
    phone: { type: String, required: true },         // Số điện thoại
    tableCode: { type: String, required: true },     // Mã bàn đặt (VD: B01, B02)
    bookingTime: { type: Date, required: true },     // Ngày & Giờ khách tới
    guestCount: { type: Number, default: 2 },        // Số lượng khách
    note: { type: String, default: '' },             // Ghi chú (VD: Lấy ghế trẻ em)
    status: { 
      type: String, 
      enum: ['PENDING', 'ARRIVED', 'CANCELLED'], 
      default: 'PENDING' 
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reservation', reservationSchema);