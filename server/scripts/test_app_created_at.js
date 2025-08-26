const mysql = require('mysql2/promise');

async function testAppCreatedAt() {
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
    
    // 실제 앱에서 사용자 생성 시뮬레이션
    const testUser = {
      username: `app_test_${Date.now()}`,
      email: `app_test_${Date.now()}@example.com`,
      password_hash: '$2b$10$test.hash.value.here',
      nickname: 'App Test User'
    };
    
    console.log('🔍 앱 시뮬레이션: 사용자 생성 테스트');
    console.log('입력 데이터:', {
      username: testUser.username,
      email: testUser.email,
      nickname: testUser.nickname
    });
    
    // INSERT 실행 (created_at은 명시하지 않음 - DEFAULT 값 사용)
    const [result] = await connection.execute(
      'INSERT INTO users (username, email, password_hash, nickname) VALUES (?, ?, ?, ?)',
      [testUser.username, testUser.email, testUser.password_hash, testUser.nickname]
    );
    
    const userId = result.insertId;
    console.log('✅ 사용자 생성 완료, ID:', userId);
    
    // 생성된 사용자 조회
    const [rows] = await connection.execute(
      'SELECT user_id, username, email, nickname, created_at, updated_at FROM users WHERE user_id = ?',
      [userId]
    );
    
    if (rows.length > 0) {
      const user = rows[0];
      console.log('\n📅 생성된 사용자 정보:');
      console.log('  - user_id:', user.user_id);
      console.log('  - username:', user.username);
      console.log('  - email:', user.email);
      console.log('  - nickname:', user.nickname);
      console.log('  - created_at (Raw):', user.created_at);
      console.log('  - created_at (Type):', typeof user.created_at);
      console.log('  - created_at (toISOString):', user.created_at.toISOString());
      console.log('  - created_at (toLocaleDateString):', user.created_at.toLocaleDateString('ko-KR'));
      console.log('  - updated_at (Raw):', user.updated_at);
      
      // 프론트엔드에서 표시할 형태로 변환 테스트
      const displayDate = user.created_at.toLocaleDateString('ko-KR');
      console.log('\n✅ 프론트엔드 표시용 가입일:', displayDate);
      
      // Invalid Date 체크
      if (displayDate === 'Invalid Date') {
        console.log('❌ Invalid Date 문제 발생');
      } else {
        console.log('✅ 날짜 변환 정상');
      }
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

testAppCreatedAt().catch(console.error);