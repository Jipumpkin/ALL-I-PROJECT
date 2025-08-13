// server/db/connection.js

const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT, 10),
};

async function getConnection() {
    if (!dbConfig.host || !dbConfig.user || !dbConfig.password || !dbConfig.database) {
        throw new Error('💥 오류: DB 환경 변수가 설정되지 않았습니다.');
    }
    return await mysql.createConnection(dbConfig);
}

module.exports = { getConnection };