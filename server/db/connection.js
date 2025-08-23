// server/db/connection.js

const mysql = require('mysql2/promise');

// ✅ process.env 변수 이름에 'REMOTE_' 접두사를 추가하여 .env 파일을 직접 읽도록 수정
const dbConfig = {
    host: process.env.REMOTE_REMOTE_DB_HOST || '192.168.1.96',
    user: process.env.REMOTE_REMOTE_DB_USER || 'alli_admin',
    password: process.env.REMOTE_REMOTE_DB_PASSWORD || '250801',
    database: process.env.REMOTE_REMOTE_DB_NAME || 'alli_core',
    port: parseInt(process.env.REMOTE_REMOTE_DB_PORT, 10) || 3307 || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 30000 
};

const pool = mysql.createPool(dbConfig);

(async () => {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log(`✅ 데이터베이스(${process.env.REMOTE_DB_HOST}:${process.env.REMOTE_DB_PORT})에 성공적으로 연결되었습니다.`);
    } catch (error) {
        console.error('💥💥💥 데이터베이스 연결에 실패했습니다! 💥💥💥');
        console.error('`.env` 파일의 REMOTE_DB 접속 정보나 DB 서버 상태를 확인해주세요.');
        console.error('에러 상세:', error.message);
        process.exit(1); 
    } finally {
        if (connection) connection.release();
    }
})();

// 다른 파일에서는 이 pool 객체를 그대로 사용하면 됩니다.
module.exports = { pool };