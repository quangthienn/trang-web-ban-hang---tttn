const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    // Bổ sung tableId kết nối trực tiếp với Model Table
    tableId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Table' 
    },
    tableCode: { type: String, required: true },
    tableName: { type: String, required: true },
    items: [
      {
        menuItemId: String,
        name: String,
        price: Number,
        quantity: Number,
        // --- BỔ SUNG CỜ ĐÁNH DẤU MÓN ĐÃ GỬI BẾP HAY CHƯA ---
        isSentToKitchen: { 
          type: Boolean, 
          default: false 
        }
      }
    ],
    totalAmount: { type: Number, required: true },
    
    // Trạng thái đơn hàng (Tiến trình phục vụ)
    status: {
      type: String,
      enum: ['PENDING', 'COOKING', 'SERVED', 'PAID', 'CANCELLED'],
      default: 'PENDING'
    },

    // --- QUẢN LÝ THANH TOÁN ---
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PAID'],
      default: 'UNPAID'
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'BANK_TRANSFER'], // Tiền mặt hoặc Chuyển khoản VietQR
      default: 'CASH'
    },
    paidAt: {
      type: Date // Thời điểm thu ngân xác nhận thanh toán thành công
    }
  },
  { timestamps: true } // Tự động tạo createdAt & updatedAt
);

module.exports = mongoose.model('Order', orderSchema);