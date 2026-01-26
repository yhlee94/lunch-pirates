const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// 회원가입
router.post('/register', authController.register);

// 메일 인증
router.get('/verify-email', authController.verifyEmail);

// 로그인
router.post('/login', authController.login);

// 내 정보 조회 (인증 필요)
router.get('/me', authMiddleware.verifyToken, authController.getMe);

// 비밀번호 재설정 링크 요청
router.post('/request-password-reset', authController.requestPasswordReset);

// 비밀번호 재설정
router.post('/reset-password', authController.resetPassword);

module.exports = router;