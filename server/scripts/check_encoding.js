// 데이터베이스 인코딩 확인 및 수정 스크립트
const { getPool } = require('../config/database');

async function checkAndFixEncoding() {
  try {
    const pool = await getPool();
    
    // 현재 테이블 인코딩 확인
    console.log('🔍 현재 users 테이블 구조 확인...');
    const [tableInfo] = await pool.execute('SHOW CREATE TABLE users');
    console.log('📋 테이블 생성 구문:', tableInfo[0]['Create Table']);
    
    // 현재 데이터베이스 character set 확인
    console.log('\n🔍 현재 데이터베이스 character set 확인...');
    const [dbCharset] = await pool.execute('SELECT @@character_set_database, @@collation_database');
    console.log('📋 DB character set:', dbCharset[0]);
    
    // nickname 컬럼의 인코딩 확인
    console.log('\n🔍 users 테이블 컬럼 정보 확인...');
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_SET_NAME, COLLATION_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = 'alli_core' AND TABLE_NAME = 'users'
      AND COLUMN_NAME IN ('nickname', 'username')
    `);
    console.log('📋 컬럼 정보:', columns);
    
    // 테스트 데이터 확인
    console.log('\n🔍 현재 저장된 데이터 확인...');
    const [users] = await pool.execute('SELECT user_id, username, nickname FROM users WHERE nickname IS NOT NULL LIMIT 5');
    console.log('📋 사용자 데이터:', users);
    
    // UTF-8로 컬럼 변경
    console.log('\n🔧 nickname 컬럼을 UTF-8으로 변경 중...');
    await pool.execute(`
      ALTER TABLE users 
      MODIFY COLUMN nickname VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    console.log('✅ nickname 컬럼 인코딩 변경 완료');
    
    console.log('\n✅ 인코딩 확인 및 수정 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    process.exit(0);
  }
}

checkAndFixEncoding();