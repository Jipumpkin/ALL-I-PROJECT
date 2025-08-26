const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { getPool } = require('../config/database');

async function migrateUserImagesTable() {
  console.log('🔄 user_images 테이블 스키마 업데이트 시작...\n');

  try {
    // 데이터베이스 연결 풀 가져오기
    const pool = await getPool();

    console.log('✅ 데이터베이스 연결 성공\n');

    // 현재 테이블 구조 확인
    console.log('📊 현재 user_images 테이블 구조:');
    const [currentColumns] = await pool.execute('DESCRIBE user_images');
    currentColumns.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    console.log('');

    // 필요한 컬럼들이 이미 존재하는지 확인
    const existingColumns = currentColumns.map(col => col.Field);
    const newColumns = [
      { name: 'image_data', exists: existingColumns.includes('image_data') },
      { name: 'filename', exists: existingColumns.includes('filename') },
      { name: 'mime_type', exists: existingColumns.includes('mime_type') },
      { name: 'file_size', exists: existingColumns.includes('file_size') },
      { name: 'storage_type', exists: existingColumns.includes('storage_type') }
    ];

    // 각 컬럼을 확인하고 없으면 추가
    for (const column of newColumns) {
      if (!column.exists) {
        console.log(`➕ ${column.name} 컬럼 추가 중...`);
        
        let alterQuery = '';
        switch (column.name) {
          case 'image_data':
            alterQuery = 'ALTER TABLE user_images ADD COLUMN image_data LONGTEXT NULL COMMENT "Base64 encoded image data"';
            break;
          case 'filename':
            alterQuery = 'ALTER TABLE user_images ADD COLUMN filename VARCHAR(255) NULL';
            break;
          case 'mime_type':
            alterQuery = 'ALTER TABLE user_images ADD COLUMN mime_type VARCHAR(100) NULL COMMENT "image/jpeg, image/png, etc."';
            break;
          case 'file_size':
            alterQuery = 'ALTER TABLE user_images ADD COLUMN file_size INT NULL COMMENT "File size in bytes"';
            break;
          case 'storage_type':
            alterQuery = 'ALTER TABLE user_images ADD COLUMN storage_type ENUM("url", "base64", "file") DEFAULT "url" COMMENT "Storage method used"';
            break;
        }

        if (alterQuery) {
          await pool.execute(alterQuery);
          console.log(`   ✅ ${column.name} 컬럼 추가 완료`);
        }
      } else {
        console.log(`   ✅ ${column.name} 컬럼이 이미 존재함`);
      }
    }

    // image_url 컬럼을 NULL 허용으로 변경 (Base64 저장 시 URL이 없을 수 있음)
    console.log('\n🔄 image_url 컬럼을 NULL 허용으로 변경...');
    await pool.execute('ALTER TABLE user_images MODIFY COLUMN image_url TEXT NULL');
    console.log('   ✅ image_url 컬럼 수정 완료');

    // 업데이트된 테이블 구조 확인
    console.log('\n📊 업데이트된 user_images 테이블 구조:');
    const [updatedColumns] = await pool.execute('DESCRIBE user_images');
    updatedColumns.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    await pool.end();
    console.log('\n🎉 user_images 테이블 마이그레이션 완료!');

  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
migrateUserImagesTable();