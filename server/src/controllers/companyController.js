// server/src/controllers/companyController.js
const pool = require('../config/database');
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

        console.log(' 카카오 API 응답:', response.data.documents.length, '개');

        res.json({
            success: true,
            companies: response.data.documents
        });

    } catch (error) {
        console.error('회사 검색 오류:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: '회사 검색에 실패했습니다'
        });
    }
};

// 회사 맛집 랭킹 조회
const getCompanyRankings = async (req, res) => {
    const { companyId } = req.params;

    try {
        console.log(`🏆 랭킹 조회 요청: Company ID ${companyId}`);

        // 최근 30일간의 데이터 조회 (participants_count 합산)
        const query = `
            SELECT 
                MAX(restaurant_name) as restaurant_name,
                kakao_place_id,
                SUM(participants_count) as visit_count,
                MAX(restaurant_address) as restaurant_address
            FROM 
                lunch_rooms 
            WHERE 
                company_id = $1 
                AND departure_time >= (NOW() AT TIME ZONE 'Asia/Seoul') - INTERVAL '30 days'
                AND departure_time <= (NOW() AT TIME ZONE 'Asia/Seoul')
                AND status = 'departed'
            GROUP BY 
                kakao_place_id, 
                CASE WHEN kakao_place_id IS NULL THEN restaurant_name ELSE NULL END
            ORDER BY 
                visit_count DESC
            LIMIT 10
        `;

        const result = await pool.query(query, [companyId]);

        // 회사 정보 조회
        const companyResult = await pool.query('SELECT name FROM companies WHERE id = $1', [companyId]);
        const companyName = companyResult.rows[0]?.name || '우리 회사';

        res.json({
            success: true,
            companyName: companyName,
            rankings: result.rows
        });

    } catch (error) {
        console.error('❌ 랭킹 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '랭킹 조회에 실패했습니다.'
        });
    }
};

module.exports = { searchCompany, getCompanyRankings };