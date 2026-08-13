const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Chuỗi kết nối MongoDB Atlas Cloud
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://quangthien:thien123@cluster0.skhpfvp.mongodb.net/nhahang?retryWrites=true&w=majority';

// Kết nối Database
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Đã kết nối thành công tới MongoDB Atlas (Cloud)!'))
  .catch((err) => console.error('❌ Lỗi kết nối MongoDB Atlas:', err));

// Import routes
const reservationRoutes = require('./routes/reservationRoutes');

// Routes API
app.use('/api/menu', require('./routes/menuRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/tables', require('./routes/tableRoutes'));
app.use('/api/users', require('./routes/userRoutes')); 

app.use('/api/bookings', reservationRoutes);
app.use('/api/reservations', reservationRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`));