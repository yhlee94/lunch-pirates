const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// 내 아이템 목록 조회
router.get('/items', authMiddleware.verifyToken, userController.getUserItems);

// 아이템 장착
router.post('/equip', authMiddleware.verifyToken, userController.equipItem);

module.exports = router;
