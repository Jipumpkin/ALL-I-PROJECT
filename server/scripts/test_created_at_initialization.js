const mysql = require('mysql2/promise');

async function testCreatedAtInitialization() {
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
    
    // 테스트 사용자 생성으로 created_at 초기화 확인
    const testUsername = `test_init_${Date.now()}`;
    const testEmail = `${testUsername}@test.com`;
    
    console.log('🔍 created_at 초기화 테스트 시작...');
    
    // INSERT 전 현재 시간 기록
    const beforeInsert = new Date();
    console.log('⏰ INSERT 전 시간:', beforeInsert.toISOString());
    
    // 테스트 사용자 생성 (created_at 명시하지 않음)
    const [result] = await connection.execute(
      'INSERT INTO users (username, email, password_hash, nickname) VALUES (?, ?, ?, ?)',
      [testUsername, testEmail, 'test_hash', testUsername]
    );
    
    const userId = result.insertId;
    console.log('✅ 사용자 생성 완료, ID:', userId);
    
    // INSERT 후 현재 시간 기록
    const afterInsert = new Date();
    console.log('⏰ INSERT 후 시간:', afterInsert.toISOString());
    
    // 생성된 사용자의 created_at 확인
    const [rows] = await connection.execute(
      'SELECT user_id, username, created_at FROM users WHERE user_id = ?',
      [userId]
    );
    
    if (rows.length > 0) {
      const user = rows[0];
      console.log('\n📅 created_at 초기화 결과:');
      console.log('  - user_id:', user.user_id);
      console.log('  - username:', user.username);
      console.log('  - created_at (Raw):', user.created_at);
      console.log('  - created_at (Type):', typeof user.created_at);
      console.log('  - created_at (toString):', user.created_at.toString());
      console.log('  - created_at (toISOString):', user.created_at.toISOString());
      console.log('  - created_at (toLocaleDateString):', user.created_at.toLocaleDateString('ko-KR'));
      
      // 시간 차이 확인
      const createdTime = new Date(user.created_at);
      const diffBefore = Math.abs(createdTime - beforeInsert);
      const diffAfter = Math.abs(createdTime - afterInsert);
      
      console.log('\n⏱️ 시간 차이 분석:');
      console.log('  - INSERT 전과의 차이:', diffBefore, 'ms');
      console.log('  - INSERT 후와의 차이:', diffAfter, 'ms');
      console.log('  - 초기화 정상 여부:', (diffBefore <= 2000 && diffAfter <= 2000) ? '✅ 정상' : '❌ 비정상');
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

testCreatedAtInitialization().catch(console.error);