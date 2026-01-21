const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');
const { searchKakaoLocal } = require('../utils/kakao');

// 회원가입
const register = async (req, res) => {
    const { companyName, email, password, nickname } = req.body;

    try {
        // 1. 입력 검증
        if (!companyName || !email || !password || !nickname) {
            return res.status(400).json({
                success: false,
                message: '모든 필드를 입력해주세요'
            });
        }

        // 2. 이메일 도메인 추출
        const emailDomain = email.split('@')[1];
        if (!emailDomain) {
            return res.status(400).json({
                success: false,
                message: '올바른 이메일 형식이 아닙니다'
            });
        }

        // 3. 이메일 중복 체크
        const existingUser = await pool.query(
            'SELECT * FROM users WHERE email = $1 AND deleted_yn = $2',
            [email, 'N']
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: '이미 사용 중인 이메일입니다'
            });
        }

        // 4. companies 테이블에서 회사 검색
        let company = await pool.query(
            'SELECT * FROM companies WHERE email_domain = $1 AND deleted_yn = $2',
            [emailDomain, 'N']
        );

        let companyId;

        // 5. 회사가 없으면 카카오 API로 검색 후 생성
        if (company.rows.length === 0) {
            console.log('🔍 카카오 API로 회사 검색:', companyName);

            const kakaoResult = await searchKakaoLocal(companyName);

            if (!kakaoResult) {
                return res.status(400).json({
                    success: false,
                    message: '회사를 찾을 수 없습니다. 회사명을 확인해주세요'
                });
            }

            // companies INSERT
            const newCompany = await pool.query(
                `INSERT INTO companies (name, address, latitude, longitude, email_domain, approved_yn)
         VALUES ($1, $2, $3, $4, $5, 'N') RETURNING *`,
                [
                    kakaoResult.place_name,
                    kakaoResult.address_name || kakaoResult.road_address_name,
                    kakaoResult.y, // 위도
                    kakaoResult.x, // 경도
                    emailDomain
                ]
            );

            companyId = newCompany.rows[0].id;
            console.log('새 회사 생성 완료:', newCompany.rows[0].name);
        } else {
            companyId = company.rows[0].id;
            console.log('기존 회사 사용:', company.rows[0].name);
        }

        // 6. 이메일 도메인 검증
        const finalCompany = await pool.query(
            'SELECT * FROM companies WHERE id = $1',
            [companyId]
        );

        if (finalCompany.rows[0].email_domain !== emailDomain) {
            return res.status(400).json({
                success: false,
                message: `${finalCompany.rows[0].name} 회사 이메일(@${finalCompany.rows[0].email_domain})만 사용 가능합니다`
            });
        }

        // 7. 비밀번호 해싱
        const hashedPassword = await bcrypt.hash(password, 10);

        // 8. 인증 토큰 생성
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간

        // 9. users INSERT
        const result = await pool.query(
            `INSERT INTO users 
       (company_id, email, password, nickname, email_verified_yn, verification_token, token_expires_at)
       VALUES ($1, $2, $3, $4, 'N', $5, $6) 
       RETURNING id, email, nickname, email_verified_yn`,
            [companyId, email, hashedPassword, nickname, verificationToken, tokenExpiresAt]
        );

        console.log('사용자 생성 완료:', result.rows[0].email);

        // 10. 이메일 인증 링크 발송
        await sendVerificationEmail(email, verificationToken);

        res.status(201).json({
            success: true,
            message: '회원가입 성공! 이메일을 확인해주세요',
            user: result.rows[0]
        });

    } catch (error) {
        console.error('회원가입 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다'
        });
    }
};

// 이메일 인증
const verifyEmail = async (req, res) => {
    const { token } = req.query;

    try {
        if (!token) {
            return res.status(400).send('유효하지 않은 요청입니다');
        }

        // 토큰으로 사용자 찾기
        const result = await pool.query(
            `SELECT * FROM users 
       WHERE verification_token = $1 
       AND token_expires_at > NOW() 
       AND deleted_yn = 'N'`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).send(`
        <html>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>인증 실패</h1>
            <p>유효하지 않거나 만료된 인증 링크입니다.</p>
          </body>
        </html>
      `);
        }

        // 이메일 인증 완료
        await pool.query(
            `UPDATE users 
       SET email_verified_yn = 'Y', 
           email_verified_at = NOW(),
           verification_token = NULL,
           token_expires_at = NULL
       WHERE id = $1`,
            [result.rows[0].id]
        );

        console.log('이메일 인증 완료:', result.rows[0].email);

        res.send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>이메일 인증 완료!</h1>
          <p>이제 점심 해적단을 사용할 수 있습니다</p>
          <p style="color: #999;">3초 후 창이 자동으로 닫힙니다...</p>
          <script>
            setTimeout(() => {
              window.close();
            }, 3000);
          </script>
        </body>
      </html>
    `);

    } catch (error) {
        console.error('이메일 인증 오류:', error);
        res.status(500).send('서버 오류가 발생했습니다');
    }
};

// 로그인
const login = async (req, res) => {
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
const getMe = async (req, res) => {
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

//(모든 함수 export)
module.exports = {
    register,
    verifyEmail,
    login,
    getMe
};