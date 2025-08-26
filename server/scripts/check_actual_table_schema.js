const mysql = require('mysql2/promise');

async function checkActualTableSchema() {
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
    
    // 실제 users 테이블 구조 확인
    const [columns] = await connection.execute('DESCRIBE users');
    
    console.log('\n📋 실제 users 테이블 스키마:');
    console.table(columns);
    
    // created_at 필드만 따로 확인
    const createdAtColumn = columns.find(col => col.Field === 'created_at');
    if (createdAtColumn) {
      console.log('\n📅 created_at 필드 상세:');
      console.log('  - Field:', createdAtColumn.Field);
      console.log('  - Type:', createdAtColumn.Type);
      console.log('  - Null:', createdAtColumn.Null);
      console.log('  - Key:', createdAtColumn.Key);
      console.log('  - Default:', createdAtColumn.Default);
      console.log('  - Extra:', createdAtColumn.Extra);
      
      if (createdAtColumn.Default === null && createdAtColumn.Null === 'NO') {
        console.log('❌ 문제: created_at이 NOT NULL인데 DEFAULT 값이 없음');
      } else if (createdAtColumn.Default) {
        console.log('✅ DEFAULT 값이 설정됨:', createdAtColumn.Default);
      }
    } else {
      console.log('❌ created_at 필드가 존재하지 않음');
    }
    
  } catch (error) {
    console.error('오류:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkActualTableSchema().catch(console.error);