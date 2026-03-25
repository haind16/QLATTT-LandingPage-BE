const jwt = require('jsonwebtoken');

// 1. Kiểm tra xem người dùng đã đăng nhập chưa (Có Token hợp lệ không)
const verifyToken = (req, res, next) => {
  // Lấy token từ header của request gửi lên
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format chuẩn: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để tiếp tục' });
  }

  try {
    // Giải mã token bằng chìa khóa bí mật
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Gắn thông tin user (id, role) vào req để các hàm phía sau dùng
    next(); // Cho phép đi tiếp vào API
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' });
  }
};

// 2. Kiểm tra xem người dùng có phải là Admin không
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next(); // Đúng là admin, cho đi tiếp
  } else {
    return res.status(403).json({ success: false, message: 'Chỉ Quản trị viên (Admin) mới có quyền truy cập chức năng này' });
  }
};

module.exports = { verifyToken, isAdmin };