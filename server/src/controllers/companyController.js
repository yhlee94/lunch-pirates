// server/src/controllers/companyController.js (새 파일!)
const { searchKakaoLocal } = require('../utils/kakao');

// 회사 검색
const searchCompany = async (req, res) => {
    const { query } = req.query;

    try {
        if (!query || query.trim() === '') {
            return res.status(400).json({
                success: false,
                message: '검색어를 입력해주세요'
            });
        }

        console.log('🔍 회사 검색 요청:', query);

        // 카카오 API 호출
        const response = await require('axios').get(
            'https://dapi.kakao.com/v2/local/search/keyword.json',
            {
                headers: {
                    Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`
                },
                params: {
                    query: query,
                    size: 10 // 최대 10개 결과
                }
            }
        );

        console.log('✅ 카카오 API 응답:', response.data.documents.length, '개');

        res.json({
            success: true,
            companies: response.data.documents
        });

    } catch (error) {
        console.error('❌ 회사 검색 오류:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: '회사 검색에 실패했습니다'
        });
    }
};

module.exports = { searchCompany };