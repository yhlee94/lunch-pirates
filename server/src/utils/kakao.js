// server/src/utils/kakao.js
const axios = require('axios');

const searchKakaoLocal = async (query) => {
    try {
        const response = await axios.get(
            'https://dapi.kakao.com/v2/local/search/keyword.json',
            {
                headers: {
                    Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`
                },
                params: {
                    query: query,  // 예: "카카오"
                    size: 5        // 최대 5개 결과
                }
            }
        );

        console.log('카카오 검색 결과:', response.data.documents);

        return response.data.documents[0]; // 첫 번째 결과

    } catch (error) {
        console.error('카카오 API 오류:', error.response?.data || error);
        return null;
    }
};

module.exports = { searchKakaoLocal };