const mysql = require('mysql2/promise');

async function checkUserImages() {
  let connection;
  
  try {
    // 원격 DB 연결 시도
    connection = await mysql.createConnection({
      host: '192.168.1.96',
      port: 3307,
      user: 'alli_admin',
      password: '250801',
      database: 'alli_core'
    });
    console.log('DB 연결 성공');
    
    // 사용자 3의 이미지 데이터 조회
    const [rows] = await connection.execute(
      'SELECT image_id, user_id, image_url, filename, storage_type, ' +
      'LEFT(image_data, 50) as image_data_preview, ' +
      'LENGTH(image_data) as image_data_length ' +
      'FROM user_images WHERE user_id = 3 ORDER BY uploaded_at DESC'
    );
    
    console.log('\n사용자 3의 이미지 데이터:');
    console.table(rows);
    
  } catch (error) {
    console.error('오류:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkUserImages().catch(console.error);