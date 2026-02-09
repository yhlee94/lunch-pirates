const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Render 필수 설정
    }
});

// 연결 테스트
pool.on('connect', () => {
    console.log(' PostgreSQL 연결 성공!');
});

pool.on('error', (err) => {
    console.error('PostgreSQL 연결 오류:', err);
});

module.exports = pool;