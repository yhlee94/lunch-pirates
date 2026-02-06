const jwt = require('jsonwebtoken');

// JWT 토큰 검증 미들웨어
exports.verifyToken = (req, res, next) => {
    try {
        // 1. 헤더에서 토큰 추출
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: '인증 토큰이 필요합니다.'
            });
        }

        const token = authHeader.split(' ')[1]; // "Bearer 토큰" 에서 토큰만 추출

        // 2. 토큰 검증
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. 검증된 사용자 정보를 req에 저장
        req.user = {
            id: decoded.id,
            email: decoded.email,
            company_id: decoded.company_id,
            companyLatitude: decoded.companyLatitude,
            companyLongitude: decoded.companyLongitude
        };


        // 4. 다음 미들웨어/컨트롤러로 진행
        next();

    } catch (error) {
        console.error('토큰 검증 에러:', error);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: '토큰이 만료되었습니다. 다시 로그인해주세요.'
            });
        }

        return res.status(401).json({
            success: false,
            message: '유효하지 않은 토큰입니다.'
        });
    }
};