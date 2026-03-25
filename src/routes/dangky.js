const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// ─────────────────────────────────────────
// API 1: Nhận form đăng ký từ landing page (PUBLIC - KHÁCH HÀNG DÙNG)
// POST /api/dang-ky
// ─────────────────────────────────────────
router.post('/', (req, res) => {
  const {
    ho_ten,
    so_dien_thoai,
    email,
    san_pham,
    ngan_sach,
    thoi_gian_lien_he,
    ghi_chu
  } = req.body;

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  // Kiểm tra thông tin bắt buộc
  if (!ho_ten || !so_dien_thoai) {
    db.query(
      `INSERT INTO log (hanh_dong, dia_chi_ip) VALUES (?, ?)`,
      ['đăng ký thất bại — thiếu thông tin', ip]
    );
    return res.status(400).json({
      success: false,
      message: 'Vui lòng điền họ tên và số điện thoại'
    });
  }

  // Kiểm tra số điện thoại đúng định dạng
  const sdtRegex = /^(0|\+84)[0-9]{8,10}$/;
  if (!sdtRegex.test(so_dien_thoai)) {
    return res.status(400).json({
      success: false,
      message: 'Số điện thoại không đúng định dạng'
    });
  }

  // Lưu khách hàng vào database
  const sql = `
    INSERT INTO khach_hang 
      (ho_ten, so_dien_thoai, email, san_pham, ngan_sach, thoi_gian_lien_he, ghi_chu)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [ho_ten, so_dien_thoai, email, san_pham, ngan_sach, thoi_gian_lien_he, ghi_chu],
    (err, result) => {
      if (err) {
        console.log('Lỗi lưu khách hàng:', err.message);
        db.query(
          `INSERT INTO log (hanh_dong, dia_chi_ip) VALUES (?, ?)`,
          ['đăng ký thất bại — lỗi server', ip]
        );
        return res.status(500).json({
          success: false,
          message: 'Lỗi server, vui lòng thử lại'
        });
      }

      // Ghi log thành công
      db.query(
        `INSERT INTO log (khach_hang_id, hanh_dong, dia_chi_ip) VALUES (?, ?, ?)`,
        [result.insertId, 'đăng ký mới', ip]
      );

      res.json({
        success: true,
        message: 'Đăng ký thành công'
      });
    }
  );
});


// ─────────────────────────────────────────
// API 2: Xem toàn bộ danh sách đăng ký (PRIVATE - CẦN ĐĂNG NHẬP)
// GET /api/dang-ky/danh-sach
// ─────────────────────────────────────────
router.get('/danh-sach', verifyToken, (req, res) => {
  db.query(
    `SELECT * FROM khach_hang ORDER BY thoi_gian_dang_ky DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: 'Lỗi server' });
      res.json({ success: true, data: rows });
    }
  );
});


// ─────────────────────────────────────────
// API 3: Xem log hệ thống (PRIVATE & ADMIN ONLY - CHỈ ADMIN MỚI ĐƯỢC XEM)
// GET /api/dang-ky/log
// ─────────────────────────────────────────
router.get('/log', verifyToken, isAdmin, (req, res) => {
  db.query(
    `SELECT log.*, khach_hang.ho_ten, khach_hang.so_dien_thoai
     FROM log
     LEFT JOIN khach_hang ON log.khach_hang_id = khach_hang.id
     ORDER BY log.thoi_gian DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: 'Lỗi server' });
      res.json({ success: true, data: rows });
    }
  );
});


// ─────────────────────────────────────────
// API 4: Xem chi tiết 1 khách hàng (PRIVATE - CẦN ĐĂNG NHẬP)
// GET /api/dang-ky/:id
// ─────────────────────────────────────────
router.get('/:id', verifyToken, (req, res) => {
  db.query(
    `SELECT * FROM khach_hang WHERE id = ?`,
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: 'Lỗi server' });
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
      res.json({ success: true, data: rows[0] });
    }
  );
});

module.exports = router;