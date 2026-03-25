const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// =========================================================
// BẬT BẢO VỆ: Mọi API trong file này đều bắt buộc:
// 1. Phải có Token (đã đăng nhập)
// 2. Phải là quyền Admin
// =========================================================
router.use(verifyToken, isAdmin);

// ─────────────────────────────────────────
// API: Lấy danh sách tài khoản nhân viên
// GET /api/users
// ─────────────────────────────────────────
router.get('/', (req, res) => {
  // Không select cột password ra để bảo mật
  db.query(
    'SELECT id, username, role, created_at FROM users ORDER BY created_at DESC', 
    (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Lỗi truy xuất dữ liệu' });
      res.json({ success: true, data: results });
    }
  );
});

// ─────────────────────────────────────────
// API: Thêm tài khoản nhân viên mới
// POST /api/users
// ─────────────────────────────────────────
router.post('/', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu' });
  }

  try {
    // 1. Kiểm tra xem username đã tồn tại chưa
    db.query('SELECT id FROM users WHERE username = ?', [username], async (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
      if (results.length > 0) {
        return res.status(400).json({ success: false, message: 'Tên tài khoản này đã có người sử dụng' });
      }

      // 2. Băm (hash) mật khẩu của nhân viên mới
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Mặc định nếu không truyền role thì là staff
      const userRole = role === 'admin' ? 'admin' : 'staff';

      // 3. Lưu vào DB
      db.query(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        [username, hashedPassword, userRole],
        (err2, insertResult) => {
          if (err2) return res.status(500).json({ success: false, message: 'Lỗi khi lưu tài khoản' });
          res.json({ success: true, message: 'Đã tạo tài khoản nhân viên thành công!' });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi xử lý server' });
  }
});

// ─────────────────────────────────────────
// API: Xóa tài khoản nhân viên
// DELETE /api/users/:id
// ─────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const targetUserId = req.params.id;
  const currentUserId = req.user.id; // Lấy từ token thông qua middleware

  // Ngăn chặn việc Admin tự xóa chính mình (tự sát)
  if (targetUserId == currentUserId) {
    return res.status(400).json({ success: false, message: 'Bạn không thể tự xóa tài khoản đang đăng nhập' });
  }

  db.query('DELETE FROM users WHERE id = ?', [targetUserId], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Lỗi khi xóa tài khoản' });
    res.json({ success: true, message: 'Đã xóa tài khoản thành công!' });
  });
});

module.exports = router;