require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./src/db'); // Đường dẫn trỏ vào file db.js của bạn

// 1. Dùng bcrypt băm chữ 'admin123' với độ khó là 10
const hashedPassword = bcrypt.hashSync('admin123', 10);

// 2. Cập nhật vào cơ sở dữ liệu
db.query(
  'UPDATE users SET password = ? WHERE username = "admin"', 
  [hashedPassword], 
  (err, result) => {
    if (err) {
      console.error('Lỗi cập nhật:', err.message);
    } else {
      console.log('✅ Đã cập nhật mật khẩu thành công!');
      console.log('Chuỗi hash chuẩn của admin123 là:', hashedPassword);
    }
    process.exit(); // Tắt script sau khi chạy xong
  }
);