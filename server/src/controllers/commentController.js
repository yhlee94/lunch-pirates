const pool = require('../config/database');

// 특정 식당의 댓글 조회
exports.getComments = async (req, res) => {
    const { restaurantId } = req.params;

    try {
        const query = `
            SELECT 
                rc.id,
                rc.content,
                rc.created_at,
                rc.user_id,
                u.name as user_name,
                u.profile_image_url
            FROM 
                restaurant_comments rc
            JOIN 
                users u ON rc.user_id = u.id
            WHERE 
                rc.restaurant_id = $1 
                AND rc.deleted_yn = 'N'
            ORDER BY 
                rc.created_at DESC
        `;

        const result = await pool.query(query, [restaurantId]);

        res.json({
            success: true,
            comments: result.rows
        });

    } catch (error) {
        console.error('댓글 조회 에러:', error);
        res.status(500).json({
            success: false,
            message: '댓글을 불러오는 중 오류가 발생했습니다.'
        });
    }
};

// 댓글 작성
exports.createComment = async (req, res) => {
    const { restaurant_id, content } = req.body;
    const user_id = req.user.id;

    if (!content || !content.trim()) {
        return res.status(400).json({
            success: false,
            message: '내용을 입력해주세요.'
        });
    }

    try {
        const query = `
            INSERT INTO restaurant_comments (restaurant_id, user_id, content)
            VALUES ($1, $2, $3)
            RETURNING id, content, created_at
        `;

        const result = await pool.query(query, [restaurant_id, user_id, content]);
        const newComment = result.rows[0];

        // 작성자 정보 추가해서 반환 (프론트에서 바로 보여주기 위함)
        const userQuery = 'SELECT name, profile_image_url FROM users WHERE id = $1';
        const userResult = await pool.query(userQuery, [user_id]);

        res.json({
            success: true,
            message: '댓글이 등록되었습니다.',
            comment: {
                ...newComment,
                user_name: userResult.rows[0].name,
                profile_image_url: userResult.rows[0].profile_image_url
            }
        });

    } catch (error) {
        console.error('댓글 작성 에러:', error);
        res.status(500).json({
            success: false,
            message: '댓글 등록 중 오류가 발생했습니다.'
        });
    }
};

// 댓글 수정
exports.updateComment = async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id; // 토큰에서 추출한 사용자 ID

    if (!content || !content.trim()) {
        return res.status(400).json({ success: false, message: '내용을 입력해주세요.' });
    }

    try {
        const query = `
            UPDATE restaurant_comments 
            SET content = $1, updated_at = NOW()
            WHERE id = $2 AND user_id = $3 AND deleted_yn = 'N'
            RETURNING id, content
        `;
        const result = await pool.query(query, [content, commentId, userId]);

        if (result.rowCount === 0) {
            return res.status(403).json({ success: false, message: '댓글을 수정할 권한이 없거나 존재하지 않습니다.' });
        }

        res.json({ success: true, message: '댓글이 수정되었습니다.', comment: result.rows[0] });

    } catch (error) {
        console.error('댓글 수정 에러:', error);
        res.status(500).json({ success: false, message: '댓글 수정 중 오류가 발생했습니다.' });
    }
};

// 댓글 삭제
exports.deleteComment = async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.id;

    try {
        const query = `
            UPDATE restaurant_comments 
            SET deleted_yn = 'Y', updated_at = NOW()
            WHERE id = $1 AND user_id = $2
            RETURNING id
        `;
        const result = await pool.query(query, [commentId, userId]);

        if (result.rowCount === 0) {
            return res.status(403).json({ success: false, message: '댓글을 삭제할 권한이 없거나 존재하지 않습니다.' });
        }

        res.json({ success: true, message: '댓글이 삭제되었습니다.' });

    } catch (error) {
        console.error('댓글 삭제 에러:', error);
        res.status(500).json({ success: false, message: '댓글 삭제 중 오류가 발생했습니다.' });
    }
};
