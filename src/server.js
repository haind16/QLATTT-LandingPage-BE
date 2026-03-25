require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const dangkyRoutes = require('./routes/dangky');
const authRoutes = require('./routes/auth');
const userRoutes   = require('./routes/user');

const app = express();

// Cho phép landing page gọi API
app.use(cors({
  origin: '*'   // Sau này đổi thành domain thật: 'https://tenmien.com'
}));

app.use(express.json());

// Gắn các API vào
app.use('/api/dang-ky', dangkyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Kiểm tra server còn sống không
app.get('/', (req, res) => {
  res.json({ message: 'ERO Rivesite Backend đang chạy' });
});

// Chạy server
app.listen(process.env.PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${process.env.PORT}`);
});