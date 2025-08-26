const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { getPool } = require('../config/database');

async function addDeletedAtColumn() {
  console.log('🔄 users 테이블에 deleted_at 컬럼 추가 중...\n');

  try {
    const pool = await getPool();
    
    // 현재 테이블 구조 확인
    console.log('📊 현재 users 테이블 구조 확인...');
    const [columns] = await pool.execute('DESCRIBE users');
    
    const columnNames = columns.map(col => col.Field);
    
    if (columnNames.includes('deleted_at')) {
      console.log('✅ deleted_at 컬럼이 이미 존재합니다.');
    } else {
      console.log('➕ deleted_at 컬럼 추가 중...');
      await pool.execute(`
        ALTER TABLE users 
        ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL
      `);
      console.log('✅ deleted_at 컬럼 추가 완료');
    }
    
    // 인덱스 추가 (소프트 삭제 성능 최적화)
    console.log('🔍 deleted_at 인덱스 추가 중...');
    try {
      await pool.execute(`
        CREATE INDEX idx_deleted_at ON users(deleted_at)
      `);
      console.log('✅ deleted_at 인덱스 추가 완료');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('✅ deleted_at 인덱스가 이미 존재합니다.');
      } else {
        throw err;
      }
    }
    
    await pool.end();
    console.log('\n🎉 마이그레이션 완료!');
    
  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
addDeletedAtColumn();