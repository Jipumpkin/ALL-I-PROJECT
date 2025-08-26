const mysql = require('mysql2/promise');

async function checkMySQLTimezone() {
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
    
    // MySQL 서버의 현재 시간과 타임존 확인
    console.log('\n⏰ MySQL 서버 시간 정보:');
    
    const [timeRows] = await connection.execute('SELECT NOW() as server_time');
    console.log('  - MySQL NOW():', timeRows[0].server_time);
    
    const [timezoneRows] = await connection.execute('SELECT @@global.time_zone as global_tz, @@session.time_zone as session_tz');
    console.log('  - Global timezone:', timezoneRows[0].global_tz);
    console.log('  - Session timezone:', timezoneRows[0].session_tz);
    
    try {
      const [utcRows] = await connection.execute('SELECT UTC_TIMESTAMP() as utc_timestamp');
      console.log('  - MySQL UTC_TIMESTAMP():', utcRows[0].utc_timestamp);
    } catch (err) {
      console.log('  - UTC_TIMESTAMP function not available in this MySQL version');
    }
    
    // JavaScript 현재 시간과 비교
    const jsNow = new Date();
    console.log('\n🖥️ JavaScript 시간 정보:');
    console.log('  - JavaScript Date():', jsNow);
    console.log('  - JavaScript toISOString():', jsNow.toISOString());
    console.log('  - JavaScript timezone offset:', jsNow.getTimezoneOffset(), 'minutes');
    
    // 시간 차이 계산
    const mysqlTime = new Date(timeRows[0].server_time);
    const timeDiff = Math.abs(mysqlTime - jsNow);
    console.log('\n⚖️ 시간 차이 분석:');
    console.log('  - MySQL vs JavaScript 차이:', timeDiff, 'ms');
    console.log('  - 시간 동기화 상태:', timeDiff < 5000 ? '✅ 정상' : '❌ 비정상');
    
  } catch (error) {
    console.error('오류:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkMySQLTimezone().catch(console.error);