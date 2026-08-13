const mongoose = require('mongoose');

const LOCAL_URI = 'mongodb://127.0.0.1:27017/lamour_restaurant';
const ATLAS_URI = 'mongodb+srv://quangthien:thien123@cluster0.skhpfvp.mongodb.net/nhahang?retryWrites=true&w=majority';

async function syncData() {
  console.log('🔄 Đang kết nối tới Database Local và Atlas...');
  
  const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
  const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();

  console.log('✅ Đã kết nối! Bắt đầu lấy danh sách các bảng dữ liệu...');

  const collections = await localConn.db.listCollections().toArray();

  for (let col of collections) {
    const colName = col.name;
    const docs = await localConn.db.collection(colName).find({}).toArray();

    if (docs.length > 0) {
      console.log(`📦 Đang đẩy ${docs.length} bản ghi của '${colName}' lên Atlas...`);
      await atlasConn.db.collection(colName).deleteMany({}); // Xóa cũ nếu có để tránh trùng
      await atlasConn.db.collection(colName).insertMany(docs);
      console.log(`   👉 Thành công: ${colName}`);
    } else {
      console.log(`   ⚠️ '${colName}' không có dữ liệu, bỏ qua.`);
    }
  }

  console.log('\n🎉 HOÀN TẤT! TOÀN BỘ DỮ LIỆU ĐÃ LÊN MONGO ATLAS CLOUD!');
  await localConn.close();
  await atlasConn.close();
  process.exit(0);
}

syncData().catch(err => {
  console.error('❌ Lỗi trong quá trình chuyển dữ liệu:', err);
  process.exit(1);
});