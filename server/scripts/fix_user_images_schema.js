const mysql = require('mysql2/promise');

async function fixUserImagesSchema() {
  // Try remote first, then local
  let connection;
  
  try {
    console.log('원격 DB 연결 시도...');
    connection = await mysql.createConnection({
      host: '192.168.1.96',
      port: 3307,
      user: 'alli_admin',
      password: '250801',
      database: 'alli_core'
    });
    console.log('원격 DB 연결 성공');
  } catch (error) {
    console.log('원격 DB 실패, 로컬 DB 시도...');
    try {
      connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '12345',
        database: 'alli_core_local'
      });
      console.log('로컬 DB 연결 성공');
    } catch (localError) {
      console.log('로컬 DB도 실패, 대체 DB 시도...');
      connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '12345',
        database: 'alliproject'
      });
      console.log('대체 DB 연결 성공');
    }
  }

  try {
    console.log('Adding missing columns to user_images table...');
    
    // Check current table structure
    console.log('\n현재 테이블 구조:');
    const [currentColumns] = await connection.execute('DESCRIBE user_images');
    console.table(currentColumns);
    
    // Add missing columns one by one with error handling
    const columnsToAdd = [
      'ALTER TABLE user_images ADD COLUMN image_data LONGTEXT COMMENT "Base64 encoded image data"',
      'ALTER TABLE user_images ADD COLUMN filename VARCHAR(255)',
      'ALTER TABLE user_images ADD COLUMN mime_type VARCHAR(100) COMMENT "image/jpeg, image/png, etc."',
      'ALTER TABLE user_images ADD COLUMN file_size INT COMMENT "File size in bytes"',
      'ALTER TABLE user_images ADD COLUMN storage_type ENUM("url", "base64", "file") DEFAULT "url" COMMENT "Storage method used"'
    ];
    
    for (const sql of columnsToAdd) {
      try {
        await connection.execute(sql);
        console.log(`✅ 성공: ${sql.split('ADD COLUMN ')[1]?.split(' ')[0] || 'column'} 컬럼 추가`);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`⚠️  이미 존재: ${sql.split('ADD COLUMN ')[1]?.split(' ')[0] || 'column'} 컬럼`);
        } else {
          console.error(`❌ 오류: ${error.message}`);
        }
      }
    }
    
    // Show updated table structure
    console.log('\n업데이트된 테이블 구조:');
    const [updatedColumns] = await connection.execute('DESCRIBE user_images');
    console.table(updatedColumns);
    
  } catch (error) {
    console.error('스키마 업데이트 오류:', error);
  } finally {
    await connection.end();
  }
}

fixUserImagesSchema().catch(console.error);