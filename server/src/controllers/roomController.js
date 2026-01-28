const pool = require('../config/database');

// 방 생성
exports.createRoom = async (req, res) => {
    const client = await pool.connect();

    try {
        const { restaurant_name, restaurant_address, latitude, longitude, max_participants, departure_time } = req.body;
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
             (company_id, creator_id, restaurant_name, restaurant_address, latitude, longitude, max_participants, departure_time, status, created_at, updated_at, deleted_yn)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'waiting', NOW(), NOW(), 'N')
                 RETURNING *`,
            [company_id, creator_id, restaurant_name, restaurant_address, latitude, longitude, max_participants, departure_time]
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

        const company_id = req.user.company_id; // JWT에서 추출

        // 같은 회사의 waiting 상태 방만 조회 + 참가 인원 수 계산
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
                 COUNT(p.id) as current_participants
             FROM lunch_rooms lr
                      JOIN users u ON lr.creator_id = u.id
                      LEFT JOIN participants p ON lr.id = p.room_id AND p.left_at IS NULL
             WHERE lr.company_id = $1
               AND lr.status = 'waiting'
               AND lr.deleted_yn = 'N'
             GROUP BY lr.id, u.id, u.name, u.profile_image_url
             ORDER BY lr.created_at DESC`,
            [company_id]
        );

        const rooms = result.rows.map(room => ({
            id: room.id,
            title: `${room.restaurant_name} 출항해요`,
            restaurant_name: room.restaurant_name,
            restaurant_address: room.restaurant_address,
            latitude: room.latitude,
            longitude: room.longitude,
            current_participants: parseInt(room.current_participants),
            max_participants: room.max_participants,
            departure_time: room.departure_time,
            status: room.status,
            creator: {
                id: room.creator_id,
                name: room.creator_name,
                profile_image_url: room.creator_profile_image
            },
            created_at: room.created_at
        }));

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

// 이미 지난 방들 정리 (deleted_yn = 'Y')
exports.cleanupOldRooms = async () => {
    try {
        // 기간 만료된 방을 정리하면서, 해당 방의 모든 참가자들도 '출항 성공(sailed)' 처리
        const result = await pool.query(
            `WITH expired_rooms AS (
                UPDATE lunch_rooms
                SET deleted_yn = 'Y', status = 'finished'
                WHERE departure_time < (NOW() AT TIME ZONE 'Asia/Seoul')
                  AND deleted_yn = 'N'
                RETURNING id
            )
            UPDATE participants
            SET left_at = (NOW() AT TIME ZONE 'Asia/Seoul'),
                exit_type = 'sailed'
            WHERE room_id IN (SELECT id FROM expired_rooms)
              AND left_at IS NULL
            RETURNING room_id`
        );

        if (result.rowCount > 0) {
            console.log(`🧹 기간 만료된 방 정리 및 참가자 퇴장 처리 완료 (${result.rowCount}개 항목)`);
        }
    } catch (error) {
        console.error('방 자동 정리 중 에러:', error);
    }
};