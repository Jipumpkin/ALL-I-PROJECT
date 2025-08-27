// /server/config/database.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); // 상위 폴더의 .env 파일

const mysql = require('mysql2/promise');

// 원격 데이터베이스 설정 (우선순위)
const remoteConfig = {
  host: process.env.REMOTE_DB_HOST || '192.168.1.96',
  port: Number(process.env.REMOTE_DB_PORT || 3307),
  user: process.env.REMOTE_DB_USER || 'alli_admin',
  password: process.env.REMOTE_DB_PASSWORD || '250801',
  database: process.env.REMOTE_DB_NAME || 'alli_core',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 5000, // 5초 타임아웃
  charset: 'utf8mb4'
};

// 로컬 데이터베이스 설정 (백업)
const localConfig = {
  host: process.env.LOCAL_DB_HOST || 'localhost',
  port: Number(process.env.LOCAL_DB_PORT || 3306),
  user: process.env.LOCAL_DB_USER || 'root',
  password: process.env.LOCAL_DB_PASSWORD || '12345',
  database: process.env.LOCAL_DB_NAME || 'alli_core_local',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

let pool = null;

// 데이터베이스 연결 초기화 함수
async function initializeDatabase() {
  console.log('🔄 데이터베이스 연결 초기화 중...');
  
  try {
    // 로컬 데이터베이스 연결 시도 (우선순위 변경)
    console.log('💻 로컬 데이터베이스 연결 시도 중...');
    pool = mysql.createPool(localConfig);
    
    // 연결 테스트
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    
    console.log('✅ 로컬 데이터베이스 연결 성공');
    return pool;
    
  } catch (error) {
    console.log('❌ 로컬 데이터베이스 연결 실패:', error.message);
    
    try {
      // 원격 데이터베이스로 폴백
      console.log('🔄 원격 데이터베이스로 폴백 중...');
      if (pool) {
        await pool.end();
      }
      
      pool = mysql.createPool(remoteConfig);
      
      // 연결 테스트
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      
      console.log('✅ 원격 데이터베이스 연결 성공');
      return pool;
      
    } catch (remoteError) {
      console.error('💥 원격 데이터베이스 연결도 실패:', remoteError.message);
      throw new Error('모든 데이터베이스 연결 실패');
    }
  }
}

// 데이터베이스 풀 가져오기 함수
async function getPool() {
  if (!pool) {
    await initializeDatabase();
  }
  return pool;
}

module.exports = { getPool, initializeDatabase };