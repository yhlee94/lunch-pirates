const pool = require('../config/database');

// 유저의 티켓 수 및 현재 가챠 상태 조회 (프론트 동기화용)
exports.getTicketStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            'SELECT ticket_count, is_coin_inserted, is_lever_pulled FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
        }

        res.json({
            success: true,
            status: result.rows[0]
        });
    } catch (error) {
        console.error('상태 조회 에러:', error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};

// [1단계] 동전 넣기
exports.insertCoin = async (req, res) => {
    const userId = req.user.id;
    try {
        // 이미 코인을 넣었는지 확인
        const user = await pool.query('SELECT ticket_count, is_coin_inserted FROM users WHERE id = $1', [userId]);
        if (user.rows[0].is_coin_inserted === 'Y') {
            return res.status(400).json({ success: false, message: '이미 코인을 넣었습니다. 레버를 돌려주세요!' });
        }
        if (user.rows[0].ticket_count <= 0) {
            return res.status(400).json({ success: false, message: '티켓이 부족합니다.' });
        }

        // 티켓 1개 차감 및 코인 삽입 상태 변경
        await pool.query(
            "UPDATE users SET ticket_count = ticket_count - 1, is_coin_inserted = 'Y' WHERE id = $1",
            [userId]
        );

        res.json({ success: true, message: '코인이 투입되었습니다!', is_coin_inserted: 'Y' });
    } catch (error) {
        console.error('코인 투입 에러:', error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};

// [2단계] 레버 돌리기 완료 기록
exports.pullLever = async (req, res) => {
    const userId = req.user.id;
    try {
        const user = await pool.query('SELECT is_coin_inserted FROM users WHERE id = $1', [userId]);
        if (user.rows[0].is_coin_inserted !== 'Y') {
            return res.status(400).json({ success: false, message: '먼저 코인을 넣어주세요!' });
        }

        await pool.query("UPDATE users SET is_lever_pulled = 'Y' WHERE id = $1", [userId]);
        res.json({ success: true, message: '레버 기믹 완료!', is_lever_pulled: 'Y' });
    } catch (error) {
        console.error('레버 조작 에러:', error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};

// [3단계] 푸시 버튼 클릭 (최종 아이템 지급 및 리셋)
exports.pushButton = async (req, res) => {
    const userId = req.user.id;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 상태 검증
        const userResult = await client.query(
            "SELECT is_coin_inserted, is_lever_pulled FROM users WHERE id = $1 FOR UPDATE",
            [userId]
        );
        const { is_coin_inserted, is_lever_pulled } = userResult.rows[0];

        if (is_coin_inserted !== 'Y' || is_lever_pulled !== 'Y') {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: '아직 레버를 끝까지 돌리지 않았습니다!' });
        }

        // 아이템 선정 (Weighted Random)
        const itemsResult = await client.query('SELECT * FROM items');
        const allItems = itemsResult.rows;

        // 아이템 목록 셔플 (특정 아이템 쏠림 방지)
        const shuffledItems = allItems.sort(() => Math.random() - 0.5);

        const totalRarity = shuffledItems.reduce((sum, item) => {
            const r = parseFloat(item.drop_rate) || 0;
            return sum + r;
        }, 0);

        if (totalRarity <= 0) {
            await client.query('ROLLBACK');
            return res.status(500).json({ success: false, message: '아이템 확률 설정에 오류가 있습니다.' });
        }

        let randomValue = Math.random() * totalRarity;
        console.log(`[GACHA] Total Rarity: ${totalRarity}, Picked Value: ${randomValue}`);

        let selectedItem = null;
        for (const item of shuffledItems) {
            const r = parseFloat(item.drop_rate) || 0;
            randomValue -= r;
            if (randomValue <= 0) {
                selectedItem = item;
                break;
            }
        }

        // 선택되지 않은 경우 예외 처리
        if (!selectedItem) selectedItem = shuffledItems[0];

        // 중복 체크 및 획득 기록 저장
        const checkItem = await client.query(
            'SELECT id FROM user_items WHERE user_id = $1 AND item_id = $2',
            [userId, selectedItem.id]
        );

        let isNewItem = false;
        if (checkItem.rows.length === 0) {
            await client.query('INSERT INTO user_items (user_id, item_id) VALUES ($1, $2)', [userId, selectedItem.id]);
            isNewItem = true;
        }

        // ★ 핵심: 모든 상태를 'N'으로 리셋
        await client.query(
            "UPDATE users SET is_coin_inserted = 'N', is_lever_pulled = 'N' WHERE id = $1",
            [userId]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            message: isNewItem ? '새 아이템을 찾았습니다!' : '이미 가지고 있는 아이템이네요!',
            item: selectedItem,
            isNewItem
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('최종 지급 에러:', error);
        res.status(500).json({ success: false, message: '아이템 지급 중 오류가 발생했습니다.' });
    } finally {
        client.release();
    }
};