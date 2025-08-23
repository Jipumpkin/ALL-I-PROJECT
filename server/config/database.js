// /server/db.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') }); // 위치에 맞게: 상위면 '..'

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),   // ★ 추가
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alli_core', // 기본값도 프로젝트 DB로
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // 선택: 필요하면 아래 옵션 켜기
  // dateStrings: true,
  // namedPlaceholders: true,
});

module.exports = pool;
