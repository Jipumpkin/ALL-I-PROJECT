const mysql = require('mysql2/promise');

async function checkUserCreatedAt() {
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
    
    // 사용자 3의 created_at 값 확인
    const [rows] = await connection.execute(
      'SELECT user_id, username, email, created_at, ' +
      'DATE_FORMAT(created_at, "%Y-%m-%d %H:%i:%s") as formatted_created_at ' +
      'FROM users WHERE user_id = 3'
    );
    
    console.log('\n사용자 3의 created_at 정보:');
    console.table(rows);
    
    if (rows.length > 0) {
      const user = rows[0];
      console.log('\n상세 정보:');
      console.log('Raw created_at:', user.created_at);
      console.log('Type of created_at:', typeof user.created_at);
      console.log('Formatted created_at:', user.formatted_created_at);
      console.log('JavaScript Date:', new Date(user.created_at));
    }
    
  } catch (error) {
    console.error('오류:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkUserCreatedAt().catch(console.error);