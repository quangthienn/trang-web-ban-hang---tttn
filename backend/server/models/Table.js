const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String },
    status: {
      type: String,
      enum: ['AVAILABLE', 'RESERVED', 'OCCUPIED'], // Thêm trạng thái RESERVED (giữ bàn)
      default: 'AVAILABLE'
    },
    // --- BỔ SUNG THÔNG TIN ĐẶT BÀN ---
    reservationDetails: {
      customerName: { type: String, default: '' },
      customerPhone: { type: String, default: '' },
      reservationTime: { type: Date, default: null } // Thời gian khách hẹn đến
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Table', tableSchema);