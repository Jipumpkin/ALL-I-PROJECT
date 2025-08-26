const mysql = require('mysql2/promise');

async function fixCreatedAtDefault() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: '192.168.1.96',
      port: 3307,
      user: 'alli_admin',
      password: '250801',
      database: 'alli_core'
    });
    console.log('DB 연결 성공');
    
    console.log('🔧 created_at 필드에 DEFAULT CURRENT_TIMESTAMP 설정 중...');
    
    // created_at 필드에 DEFAULT CURRENT_TIMESTAMP 추가
    await connection.execute(
      'ALTER TABLE users MODIFY COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP'
    );
    
    console.log('✅ created_at DEFAULT 설정 완료');
    
    // updated_at 필드도 수정 (ON UPDATE CURRENT_TIMESTAMP 추가)
    console.log('🔧 updated_at 필드에 DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP 설정 중...');
    
    await connection.execute(
      'ALTER TABLE users MODIFY COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
    );
    
    console.log('✅ updated_at DEFAULT 설정 완료');
    
    // 수정된 테이블 구조 확인
    const [columns] = await connection.execute('DESCRIBE users');
    
    console.log('\n📋 수정된 users 테이블 스키마:');
    const relevantColumns = columns.filter(col => 
      ['created_at', 'updated_at'].includes(col.Field)
    );
    console.table(relevantColumns);
    
    // 테스트: 새 사용자 생성으로 DEFAULT 값 동작 확인
    console.log('\n🧪 DEFAULT 값 동작 테스트...');
    const testUsername = `test_default_${Date.now()}`;
    const testEmail = `${testUsername}@test.com`;
    
    const [result] = await connection.execute(
      'INSERT INTO users (username, email, password_hash, nickname) VALUES (?, ?, ?, ?)',
      [testUsername, testEmail, 'test_hash', testUsername]
    );
    
    const userId = result.insertId;
    
    // 생성된 사용자 확인
    const [rows] = await connection.execute(
      'SELECT user_id, username, created_at, updated_at FROM users WHERE user_id = ?',
      [userId]
    );
    
    if (rows.length > 0) {
      const user = rows[0];
      console.log('✅ 테스트 사용자 생성 성공:');
      console.log('  - user_id:', user.user_id);
      console.log('  - username:', user.username);
      console.log('  - created_at:', user.created_at);
      console.log('  - updated_at:', user.updated_at);
      console.log('  - 현재 시간:', new Date());
    }
    
    // 테스트 데이터 정리
    await connection.execute('DELETE FROM users WHERE user_id = ?', [userId]);
    console.log('🧹 테스트 데이터 정리 완료');
    
  } catch (error) {
    console.error('오류:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixCreatedAtDefault().catch(console.error);