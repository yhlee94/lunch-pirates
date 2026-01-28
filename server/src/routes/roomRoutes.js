const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const authMiddleware = require('../middleware/authMiddleware');

// 모든 라우트에 인증 필요
router.post('/', authMiddleware.verifyToken, roomController.createRoom);
router.get('/', authMiddleware.verifyToken, roomController.getRooms);

module.exports = router;