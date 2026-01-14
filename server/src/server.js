const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`서버 실행 중: http://localhost:${PORT}`);
});