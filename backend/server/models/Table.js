const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String },
    status: {
      type: String,
      enum: ['AVAILABLE', 'OCCUPIED'],
      default: 'AVAILABLE'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Table', tableSchema);