// server/db/connection.js

const mysql = require('mysql2/promise');

// ✅ process.env 변수 이름에 'REMOTE_' 접두사를 추가하여 .env 파일을 직접 읽도록 수정
const dbConfig = {
    host: process.env.REMOTE_DB_HOST,
    user: process.env.REMOTE_DB_USER,
    password: process.env.REMOTE_DB_PASSWORD,
    database: process.env.REMOTE_DB_NAME,
    port: parseInt(process.env.REMOTE_DB_PORT, 10) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 30000 
};

const pool = mysql.createPool(dbConfig);

// 연결 테스트는 필요 시에만 수행하도록 변경
async function testConnection() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log(`✅ 데이터베이스(${process.env.REMOTE_DB_HOST}:${process.env.REMOTE_DB_PORT})에 성공적으로 연결되었습니다.`);
        return true;
    } catch (error) {
        console.error('💥 데이터베이스 연결 실패:', error.message);
        return false;
    } finally {
        if (connection) connection.release();
    }
}

// 다른 파일에서는 이 pool 객체를 그대로 사용하면 됩니다.
module.exports = { pool };