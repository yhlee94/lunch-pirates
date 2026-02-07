const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { verifyToken } = require('../middleware/authMiddleware'); // 사용자 인증 미들웨어

// 댓글 목록 조회
router.get('/:restaurantId', verifyToken, commentController.getComments);

// 댓글 작성
router.post('/', verifyToken, commentController.createComment);
router.put('/:commentId', verifyToken, commentController.updateComment);
router.delete('/:commentId', verifyToken, commentController.deleteComment);

module.exports = router;
