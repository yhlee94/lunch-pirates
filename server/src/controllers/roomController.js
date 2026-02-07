const pool = require('../config/database');

// 방 생성
exports.createRoom = async (req, res) => {
    const client = await pool.connect();

    try {
        const { restaurant_name, restaurant_address, latitude, longitude, max_participants, departure_time, kakao_place_id } = req.body;
        const creator_id = req.user.id; // JWT에서 추출
        const company_id = req.user.company_id; // JWT에서 추출

        // 입력 검증
        if (!restaurant_name || !restaurant_address || !latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: '식당 정보를 모두 입력해주세요.'
            });
        }

        if (!max_participants || max_participants < 2 || max_participants > 10) {
            return res.status(400).json({
                success: false,
                message: '최대 인원은 2~10명 사이로 설정해주세요.'
            });
        }

        await client.query('BEGIN');

        // 방 생성
        const roomResult = await client.query(
            `INSERT INTO lunch_rooms
             (company_id, creator_id, restaurant_name, restaurant_address, latitude, longitude, max_participants, departure_time, kakao_place_id, status, created_at, updated_at, deleted_yn)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'waiting', NOW(), NOW(), 'N')
                 RETURNING *`,
            [company_id, creator_id, restaurant_name, restaurant_address, latitude, longitude, max_participants, departure_time, kakao_place_id]
        );

        const room = roomResult.rows[0];

        // 방장을 자동으로 참가자로 추가
        await client.query(
            `INSERT INTO participants (room_id, user_id, joined_at)
             VALUES ($1, $2, NOW())`,
            [room.id, creator_id]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            message: '방이 생성되었습니다.',
            room: {
                id: room.id,
                restaurant_name: room.restaurant_name,
                title: `${room.restaurant_name} 출항해요`,
                current_participants: 1,
                max_participants: room.max_participants,
                departure_time: room.departure_time,
                status: room.status
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('방 생성 에러:', error);
        res.status(500).json({
            success: false,
            message: '방 생성 중 오류가 발생했습니다.'
        });
    } finally {
        client.release();
    }
};

// 방 목록 조회 (같은 회사만)
exports.getRooms = async (req, res) => {
    try {
        // 방 목록을 불러오기 전에 유효기간 지난 방들 즉시 정리
        await exports.cleanupOldRooms();

        const userId = req.user.id;
        const company_id = req.user.company_id;

        // 같은 회사의 waiting 상태 방만 조회 + 상세 참가자 정보 + 본인 참여 여부 확인
        const result = await pool.query(
            `SELECT
                 lr.id,
                 lr.restaurant_name,
                 lr.restaurant_address,
                 lr.latitude,
                 lr.longitude,
                 lr.max_participants,
                 lr.departure_time,
                 lr.status,
                 lr.created_at,
                 u.id as creator_id,
                 u.name as creator_name,
                 u.profile_image_url as creator_profile_image,
                 i.image_url as creator_equipped_item_image,
                 (
                     SELECT JSON_AGG(JSON_BUILD_OBJECT(
                             'id', u2.id,
                             'name', u2.name,
                             'equipped_item_image_url', i2.image_url
                         ))
                     FROM participants p2
                              JOIN users u2 ON p2.user_id = u2.id
                              LEFT JOIN items i2 ON u2.equipped_item_id = i2.id
                     WHERE p2.room_id = lr.id AND p2.left_at IS NULL
                 ) as participants_info,
                 EXISTS(SELECT 1 FROM participants WHERE room_id = lr.id AND user_id = $2 AND left_at IS NULL) as is_participant
             FROM lunch_rooms lr
                      JOIN users u ON lr.creator_id = u.id
                      LEFT JOIN items i ON u.equipped_item_id = i.id
             WHERE lr.company_id = $1
               AND lr.status = 'waiting'
               AND lr.deleted_yn = 'N'
             ORDER BY lr.created_at DESC`,
            [company_id, userId]
        );

        const rooms = result.rows.map(room => {
            const participants = room.participants_info || [];
            return {
                id: room.id,
                title: `${room.restaurant_name} 출항해요`,
                restaurant_name: room.restaurant_name,
                restaurant_address: room.restaurant_address,
                latitude: room.latitude,
                longitude: room.longitude,
                current_participants: participants.length,
                max_participants: room.max_participants,
                departure_time: room.departure_time,
                status: room.status,
                is_participant: room.is_participant,
                creator: {
                    id: room.creator_id,
                    name: room.creator_name,
                    profile_image_url: room.creator_profile_image,
                    equipped_item_image_url: room.creator_equipped_item_image
                },
                participants: participants,
                created_at: room.created_at
            };
        });

        res.json({
            success: true,
            total_count: rooms.length,
            rooms
        });

    } catch (error) {
        console.error('방 목록 조회 에러:', error);
        res.status(500).json({
            success: false,
            message: '방 목록 조회 중 오류가 발생했습니다.'
        });
    }
};

// 이미 지난 방들 정리
exports.cleanupOldRooms = async () => {
    const client = await pool.connect(); // 트랜잭션을 위해 클라이언트 연결 필요
    try {
        await client.query('BEGIN');

        // 1. 기간 만료된 방들과 현재 인원수 조회
        const expiredRoomsResult = await client.query(
            `SELECT lr.id, COUNT(p.id) as current_participants
             FROM lunch_rooms lr
             LEFT JOIN participants p ON lr.id = p.room_id AND p.left_at IS NULL
             WHERE lr.departure_time < (NOW() AT TIME ZONE 'Asia/Seoul')
               AND lr.deleted_yn = 'N'
             GROUP BY lr.id`
        );

        if (expiredRoomsResult.rows.length === 0) {
            await client.query('COMMIT');
            return;
        }

        const expiredRooms = expiredRoomsResult.rows;

        // 2. 방 상태 업데이트 (인원수에 따라 분기 처리)
        // 2명 이상: departed (출항)
        const sailedRoomIds = expiredRooms
            .filter(r => parseInt(r.current_participants) >= 2)
            .map(r => r.id);

        // 2명 미만(1명): finished (취소/폭파)
        const failedRoomIds = expiredRooms
            .filter(r => parseInt(r.current_participants) < 2)
            .map(r => r.id);

        // [CASE 1] 출항 성공 (2명 이상)
        if (sailedRoomIds.length > 0) {
            // 방 상태 변경: departed, 삭제 처리
            await client.query(
                `UPDATE lunch_rooms
                 SET status = 'departed', deleted_yn = 'Y', updated_at = NOW(),
                     participants_count = (SELECT COUNT(*) FROM participants WHERE room_id = lunch_rooms.id AND left_at IS NULL)
                 WHERE id = ANY($1)`,
                [sailedRoomIds]
            );

            // 참가자 상태 변경: sailed (출항함)
            await client.query(
                `UPDATE participants
                 SET left_at = (NOW() AT TIME ZONE 'Asia/Seoul'),
                     exit_type = 'sailed'
                 WHERE room_id = ANY($1) AND left_at IS NULL`,
                [sailedRoomIds]
            );
        }

        // [CASE 2] 출항 실패 (1명)
        if (failedRoomIds.length > 0) {
            // 방 상태 변경: finished, 삭제 처리
            await client.query(
                `UPDATE lunch_rooms
                 SET status = 'finished', deleted_yn = 'Y', updated_at = NOW(),
                     participants_count = (SELECT COUNT(*) FROM participants WHERE room_id = lunch_rooms.id AND left_at IS NULL)
                 WHERE id = ANY($1)`,
                [failedRoomIds]
            );

            // 참가자 상태 변경: cancel (취소됨) - 혹은 failed 등 적절한 상태값
            await client.query(
                `UPDATE participants
                 SET left_at = (NOW() AT TIME ZONE 'Asia/Seoul'),
                     exit_type = 'cancel'
                 WHERE room_id = ANY($1) AND left_at IS NULL`,
                [failedRoomIds]
            );
        }

        await client.query('COMMIT');
        console.log(`🧹 방 정리 완료: 출항 ${sailedRoomIds.length}건, 취소 ${failedRoomIds.length}건`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('방 자동 정리 중 에러:', error);
    } finally {
        client.release();
    }
};

// 방 참가 (승선)
exports.joinRoom = async (req, res) => {
    const client = await pool.connect();
    try {
        const roomId = req.params.id;
        const userId = req.user.id;

        await client.query('BEGIN');

        // 1. 방 정보 및 현재 참가 인원 조회
        const roomResult = await client.query(
            `SELECT lr.*, COUNT(p.id) as current_participants
             FROM lunch_rooms lr
             LEFT JOIN participants p ON lr.id = p.room_id AND p.left_at IS NULL
             WHERE lr.id = $1 AND lr.deleted_yn = 'N'
             GROUP BY lr.id`,
            [roomId]
        );

        if (roomResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: '존재하지 않거나 이미 사라진 배입니다.' });
        }

        const room = roomResult.rows[0];

        // 2. 이미 출항 시간이 지났는지 체크
        const now = new Date();
        const departureTime = new Date(room.departure_time);
        if (departureTime < now) {
            return res.status(400).json({ success: false, message: '이미 출항한 해적선입니다!' });
        }

        // 3. 이미 참가 중인지 체크
        const checkPart = await client.query(
            'SELECT id FROM participants WHERE room_id = $1 AND user_id = $2 AND left_at IS NULL',
            [roomId, userId]
        );
        if (checkPart.rows.length > 0) {
            return res.status(400).json({ success: false, message: '이미 승선 중인 해적입니다!' });
        }

        // 4. 인원 정원 체크
        if (parseInt(room.current_participants) >= room.max_participants) {
            return res.status(400).json({ success: false, message: '배가 이미 꽉 찼습니다! 다음 배를 기다려주세요.' });
        }

        // 5. 참가 처리
        await client.query(
            'INSERT INTO participants (room_id, user_id, joined_at) VALUES ($1, $2, NOW())',
            [roomId, userId]
        );

        await client.query('COMMIT');
        res.json({ success: true, message: '승선에 성공했습니다! 🏴‍☠️' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('승선 에러:', error);
        res.status(500).json({ success: false, message: '승선 처리 중 오류가 발생했습니다.' });
    } finally {
        client.release();
    }
};

// 방 퇴장 (하선)
exports.leaveRoom = async (req, res) => {
    const client = await pool.connect();
    try {
        const roomId = req.params.id;
        const userId = req.user.id;

        const result = await client.query(
            `UPDATE participants
             SET left_at = (NOW() AT TIME ZONE 'Asia/Seoul'),
                 exit_type = 'cancel'
             WHERE room_id = $1 AND user_id = $2 AND left_at IS NULL
             RETURNING id`,
            [roomId, userId]
        );

        if (result.rowCount === 0) {
            return res.status(400).json({ success: false, message: '승선 중인 방이 아닙니다.' });
        }

        res.json({ success: true, message: '무사히 하선했습니다. 👋' });

    } catch (error) {
        console.error('하선 에러:', error);
        res.status(500).json({ success: false, message: '하선 처리 중 오류가 발생했습니다.' });
    } finally {
        client.release();
    }
};

// 방 삭제 (향해 취소)
exports.deleteRoom = async (req, res) => {
    const client = await pool.connect();
    try {
        const roomId = req.params.id;
        const userId = req.user.id;

        await client.query('BEGIN');

        // 1. 방장인지 확인
        const roomCheck = await client.query(
            'SELECT creator_id FROM lunch_rooms WHERE id = $1 AND deleted_yn = \'N\'',
            [roomId]
        );

        if (roomCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: '존재하지 않는 배입니다.' });
        }

        if (roomCheck.rows[0].creator_id !== userId) {
            await client.query('ROLLBACK');
            return res.status(403).json({ success: false, message: '방장만 항해를 취소할 수 있습니다.' });
        }

        // 2. 방 삭제 처리 (deleted_yn = 'Y')
        await client.query(
            `UPDATE lunch_rooms 
             SET deleted_yn = 'Y', status = 'finished', updated_at = NOW() 
             WHERE id = $1`,
            [roomId]
        );

        // 3. 참가자들 처리 (선택사항: 알림 등을 위해 처리할 수 있음)
        await client.query(
            `UPDATE participants 
             SET left_at = (NOW() AT TIME ZONE 'Asia/Seoul'), 
                 exit_type = 'cancel' 
             WHERE room_id = $1 AND left_at IS NULL`,
            [roomId]
        );

        await client.query('COMMIT');
        res.json({ success: true, message: '항해가 취소되었습니다. 🌊' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('방 삭제 에러:', error);
        res.status(500).json({ success: false, message: '항해 취소 중 오류가 발생했습니다.' });
    } finally {
        client.release();
    }
};