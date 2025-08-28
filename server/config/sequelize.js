const { Sequelize } = require('sequelize');
const path = require('path');

// .env 파일 로드
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// 데이터베이스 연결 설정
const sequelize = new Sequelize({
  // 원격 데이터베이스 우선 시도
  host: process.env.REMOTE_DB_HOST || '192.168.1.96',
  port: Number(process.env.REMOTE_DB_PORT || 3307),
  username: process.env.REMOTE_DB_USER || 'alli_admin',
  password: process.env.REMOTE_DB_PASSWORD || '250801',
  database: process.env.REMOTE_DB_NAME || 'alli_core',
  
  dialect: 'mysql',
  
  // 연결 설정
  pool: {
    max: 10,
    min: 0,
    acquire: 5000,  // 5초로 단축하여 빠른 fallback
    idle: 10000
  },
  
  // UTF-8 인코딩
  dialectOptions: {
    charset: 'utf8mb4'
  },
  
  // 개발환경에서는 SQL 로깅 활성화
  logging: process.env.NODE_ENV !== 'production' ? console.log : false,
  
  // 타임존 설정
  timezone: '+09:00',
  
  // 연결 재시도 설정
  retry: {
    match: [
      /ECONNRESET/,
      /ENOTFOUND/,
      /ECONNREFUSED/,
      /ETIMEDOUT/,
      /EPIPE/,
      /PROTOCOL_CONNECTION_LOST/,
      /PROTOCOL_ENQUEUE_AFTER_QUIT/,
      /PROTOCOL_ENQUEUE_AFTER_DESTROY/,
      /PROTOCOL_ENQUEUE_HANDSHAKE_TWICE/,
      /PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR/
    ],
    max: 3
  }
});

// 연결 테스트 및 fallback 로직
async function initializeSequelize() {
  try {
    console.log('🔄 Sequelize 데이터베이스 연결 초기화 중...');
    
    // 원격 데이터베이스 연결 시도
    console.log('📡 원격 데이터베이스 연결 시도 중...');
    await sequelize.authenticate();
    console.log('✅ 원격 데이터베이스 연결 성공 (Sequelize)');
    
    return sequelize;
    
  } catch (error) {
    console.log('❌ 원격 데이터베이스 연결 실패 (Sequelize):', error.message);
    
    // 로컬 데이터베이스로 fallback
    console.log('🔄 로컬 데이터베이스로 폴백 중...');
    
    const localSequelize = new Sequelize({
      host: process.env.LOCAL_DB_HOST || 'localhost',
      port: Number(process.env.LOCAL_DB_PORT || 3306),
      username: process.env.LOCAL_DB_USER || 'root',
      password: process.env.LOCAL_DB_PASSWORD || '12345',
      database: process.env.LOCAL_DB_NAME || 'alli_core_local',
      
      dialect: 'mysql',
      pool: sequelize.options.pool,
      dialectOptions: sequelize.options.dialectOptions,
      logging: sequelize.options.logging,
      timezone: sequelize.options.timezone,
      retry: sequelize.options.retry
    });
    
    try {
      await localSequelize.authenticate();
      console.log('✅ 로컬 데이터베이스 연결 성공 (Sequelize)');
      return localSequelize;
    } catch (localError) {
      console.error('💥 로컬 데이터베이스 연결도 실패 (Sequelize):', localError.message);
      
      // SQLite로 최종 fallback
      console.log('🔄 SQLite로 최종 폴백 중...');
      
      const sqliteSequelize = new Sequelize({
        dialect: 'sqlite',
        storage: path.join(__dirname, '..', 'database.sqlite'),
        logging: process.env.NODE_ENV !== 'production' ? console.log : false,
      });
      
      try {
        await sqliteSequelize.authenticate();
        console.log('✅ SQLite 데이터베이스 연결 성공 (Sequelize)');
        return sqliteSequelize;
      } catch (sqliteError) {
        console.error('💥 SQLite 연결도 실패 (Sequelize):', sqliteError.message);
        throw new Error('모든 데이터베이스 연결 실패 (Sequelize)');
      }
    }
  }
}

module.exports = {
  sequelize,
  initializeSequelize,
  Sequelize
};