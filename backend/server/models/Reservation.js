const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    tableCode: { type: String, required: true }, // Mã bàn (VD: B01, B02)
    table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' }, // Bổ sung link ObjectId tới Table
    bookingTime: { type: Date, required: true },
    guestCount: { type: Number, default: 1 },
    adults: { type: Number, default: 1 },        // Bổ sung số người lớn
    children: { type: Number, default: 0 },      // Bổ sung số trẻ em
    note: { type: String, default: '' },
    status: { 
      type: String, 
      enum: ['PENDING', 'CONFIRMED', 'ARRIVED', 'CANCELLED'], // Đã thêm 'CONFIRMED'
      default: 'PENDING' 
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reservation', reservationSchema);