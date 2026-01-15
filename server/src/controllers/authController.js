const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// 회원가입
exports.register = async (req, res) => {
    try {
        const { email, password, nickname } = req.body;

        // 1. 입력 검증
        if (!email || !password || !nickname) {
            return res.status(400).json({
                success: false,
                message: '이메일, 비밀번호, 닉네임을 모두 입력해주세요.'
            });
        }

        // 2. 이메일 중복 체크
        const checkEmail = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (checkEmail.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: '이미 사용 중인 이메일입니다.'
            });
        }

        // 3. 비밀번호 해싱
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 4. 사용자 생성
        const result = await pool.query(
            `INSERT INTO users (email, password, nickname, created_at, updated_at) 
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
             RETURNING id, email, nickname`,
            [email, hashedPassword, nickname]
        );

        const newUser = result.rows[0];

        res.status(201).json({
            success: true,
            message: '회원가입 성공!',
            user: {
                id: newUser.id,
                email: newUser.email,
                nickname: newUser.nickname
            }
        });

    } catch (error) {
        console.error('회원가입 에러:', error);
        res.status(500).json({
            success: false,
            message: '서버 에러가 발생했습니다.'
        });
    }
};

// 로그인
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. 입력 검증
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: '이메일과 비밀번호를 입력해주세요.'
            });
        }

        // 2. 사용자 조회
        const result = await pool.query(
            'SELECT id, email, password, nickname, role FROM users WHERE email = $1 AND deleted_yn = $2',
            [email, 'N']
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: '이메일 또는 비밀번호가 일치하지 않습니다.'
            });
        }

        const user = result.rows[0];

        // 3. 비밀번호 검증
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: '이메일 또는 비밀번호가 일치하지 않습니다.'
            });
        }

        // 4. JWT 토큰 생성
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' } // 7일 유효
        );

        res.json({
            success: true,
            message: '로그인 성공!',
            token: token,
            user: {
                id: user.id,
                email: user.email,
                nickname: user.nickname,
                role: user.role
            }
        });

    } catch (error) {
        console.error('로그인 에러:', error);
        res.status(500).json({
            success: false,
            message: '서버 에러가 발생했습니다.'
        });
    }
};

// 내 정보 조회
exports.getMe = async (req, res) => {
    try {
        // req.user는 authMiddleware에서 설정됨
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT id, email, nickname, profile_image_url, role, created_at 
             FROM users 
             WHERE id = $1 AND deleted_yn = $2`,
            [userId, 'N']
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            user: result.rows[0]
        });

    } catch (error) {
        console.error('내 정보 조회 에러:', error);
        res.status(500).json({
            success: false,
            message: '서버 에러가 발생했습니다.'
        });
    }
};