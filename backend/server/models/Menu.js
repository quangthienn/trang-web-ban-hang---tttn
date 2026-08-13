const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true }, // Dùng kiểu Số để dễ tính tổng tiền
  category: { type: String, required: true },
  desc: { type: String },
  image: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Menu', menuSchema);