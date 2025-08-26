// 로컬 데이터베이스 스키마 수정 스크립트
require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixLocalDbSchema() {
  console.log('🔧 로컬 데이터베이스 스키마 수정 중...');
  
  const localConfig = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '12345',
    database: 'alli_core_local'
  };

  let connection;
  
  try {
    console.log('🔌 로컬 데이터베이스에 연결 중...');
    connection = await mysql.createConnection(localConfig);
    
    // 현재 테이블 구조 확인
    console.log('📊 현재 users 테이블 구조 확인...');
    const [columns] = await connection.execute('DESCRIBE users');
    
    const hasDeletedAt = columns.some(col => col.Field === 'deleted_at');
    
    if (hasDeletedAt) {
      console.log('✅ deleted_at 컬럼이 이미 존재합니다.');
      return;
    }
    
    // deleted_at 컬럼 추가
    console.log('➕ deleted_at 컬럼 추가 중...');
    await connection.execute(`
      ALTER TABLE users 
      ADD COLUMN deleted_at TIMESTAMP NULL
    `);
    
    // 인덱스 추가
    console.log('🔍 deleted_at 인덱스 추가 중...');
    await connection.execute(`
      CREATE INDEX idx_users_deleted_at ON users(deleted_at)
    `);
    
    console.log('✅ 로컬 데이터베이스 스키마 수정 완료!');
    
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('✅ deleted_at 컬럼이 이미 존재합니다.');
    } else if (error.code === 'ER_DUP_KEYNAME') {
      console.log('✅ deleted_at 인덱스가 이미 존재합니다.');
    } else {
      console.error('❌ 스키마 수정 실패:', error.message);
      throw error;
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 데이터베이스 연결 종료');
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  fixLocalDbSchema()
    .then(() => {
      console.log('🎉 스크립트 실행 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { fixLocalDbSchema };