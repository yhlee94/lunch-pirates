require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const pool = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const companyRoutes = require('./routes/companyRoutes');
const roomRoutes = require('./routes/roomRoutes');
const userRoutes = require('./routes/userRoutes');



const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        // 배포된 Electron 앱이나 웹에서 접근 가능하도록 설정
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors({
    origin: '*', // 모든 출처 허용 (보안이 중요하다면 추후 특정 도메인으로 제한 필요)
    credentials: true
}));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/users', userRoutes);

// Test route
app.get('/', (req, res) => {
    res.json({ message: '점심 해적단 서버 실행 중! 🏴‍☠️' });
});

// Socket.io 연결
io.on('connection', (socket) => {
    console.log('사용자 접속:', socket.id);

    socket.on('disconnect', () => {
        console.log('사용자 퇴장:', socket.id);
    });
});

const roomController = require('./controllers/roomController');

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`서버 실행 중: http://localhost:${PORT}`);
});


// Test route
app.get('/', (req, res) => {
    res.json({ message: '점심 해적단 서버 실행 중!' });
});


// DB 연결 테스트 API
app.get('/api/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({
            success: true,
            message: 'DB 연결 성공!',
            time: result.rows[0].now
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});