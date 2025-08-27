const mysql = require('mysql2/promise');

async function fixImageUrlNullable() {
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
    
    // 현재 테이블 구조 확인
    console.log('\n현재 user_images 테이블 구조:');
    const [columns] = await connection.execute('DESCRIBE user_images');
    console.table(columns);
    
    // image_url 컬럼을 nullable로 변경
    console.log('\nimage_url 컬럼을 nullable로 변경 중...');
    await connection.execute('ALTER TABLE user_images MODIFY COLUMN image_url TEXT NULL');
    
    console.log('✅ image_url 컬럼이 nullable로 변경되었습니다.');
    
    // 변경 후 테이블 구조 확인
    console.log('\n변경 후 테이블 구조:');
    const [updatedColumns] = await connection.execute('DESCRIBE user_images');
    console.table(updatedColumns);
    
  } catch (error) {
    console.error('오류:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixImageUrlNullable().catch(console.error);