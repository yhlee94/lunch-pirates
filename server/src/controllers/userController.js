const pool = require('../config/database');

// 사용자의 아이템 목록 조회
exports.getUserItems = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. 유저의 현재 장착 아이템 ID 조회
        const userResult = await pool.query('SELECT equipped_item_id FROM users WHERE id = $1', [userId]);
        const equippedId = userResult.rows[0]?.equipped_item_id;

        // 2. 보유 아이템 목록 조회
        const result = await pool.query(
            `SELECT i.id, i.name, i.type, i.image_url, i.rarity, i.description, ui.obtained_at
             FROM user_items ui
             JOIN items i ON ui.item_id = i.id
             WHERE ui.user_id = $1
             ORDER BY ui.obtained_at DESC`,
            [userId]
        );

        // 3. 전체 아이템 개수 조회
        const totalItemsResult = await pool.query('SELECT COUNT(*) FROM items');
        const totalItemCount = parseInt(totalItemsResult.rows[0].count, 10);

        // 3. JS에서 비교 수행 (타입 안전성 확보)
        const items = result.rows.map(item => ({
            ...item,
            is_equipped: item.id === equippedId
        }));

        res.json({
            success: true,
            items: items,
            totalItemCount: totalItemCount
        });
    } catch (error) {
        console.error('사용자 아이템 조회 에러:', error);
        res.status(500).json({
            success: false,
            message: '아이템 목록을 가져오는 중 오류가 발생했습니다.'
        });
    }
};

// 아이템 장착
exports.equipItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId } = req.body;

        const possessionCheck = await pool.query(
            'SELECT * FROM user_items WHERE user_id = $1 AND item_id = $2',
            [userId, itemId]
        );

        if (possessionCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: '소유하지 않은 아이템은 장착할 수 없습니다.'
            });
        }

        await pool.query(
            'UPDATE users SET equipped_item_id = $1, updated_at = NOW() WHERE id = $2',
            [itemId, userId]
        );

        const itemResult = await pool.query('SELECT * FROM items WHERE id = $1', [itemId]);

        res.json({
            success: true,
            message: '아이템이 성공적으로 장착되었습니다.',
            equippedItem: itemResult.rows[0]
        });
    } catch (error) {
        console.error('아이템 장착 에러:', error);
        res.status(500).json({
            success: false,
            message: '아이템 장착 중 오류가 발생했습니다.'
        });
    }
};
