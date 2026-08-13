const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    tableCode: { type: String, required: true },
    tableName: { type: String, required: true },
    items: [
      {
        menuItemId: String,
        name: String,
        price: Number,
        quantity: Number
      }
    ],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'COOKING', 'SERVED', 'PAID', 'CANCELLED'],
      default: 'PENDING'
    }
  },
  { timestamps: true } // 👈 Tự động tạo trường createdAt (Ngày & Giờ tạo)
);

module.exports = mongoose.model('Order', orderSchema);