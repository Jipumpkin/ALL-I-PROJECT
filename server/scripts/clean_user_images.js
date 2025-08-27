const mysql = require('mysql2/promise');

async function cleanUserImages() {
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
    
    // 사용자 3의 placeholder 이미지 삭제
    const [result] = await connection.execute(
      'DELETE FROM user_images WHERE user_id = 3 AND image_url LIKE "%placehold.co%"'
    );
    
    console.log(`${result.affectedRows}개의 placeholder 이미지가 삭제되었습니다.`);
    
    // 남은 이미지 확인
    const [rows] = await connection.execute(
      'SELECT image_id, user_id, image_url, filename, storage_type FROM user_images WHERE user_id = 3'
    );
    
    console.log('남은 이미지:');
    console.table(rows);
    
  } catch (error) {
    console.error('오류:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

cleanUserImages().catch(console.error);