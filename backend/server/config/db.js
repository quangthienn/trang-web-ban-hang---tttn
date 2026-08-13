const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Đã kết nối thành công CSDL MongoDB!');
  } catch (error) {
    console.error('❌ Lỗi kết nối CSDL:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;