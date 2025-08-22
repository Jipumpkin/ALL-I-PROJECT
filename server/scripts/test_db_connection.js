// MySQL 연결 테스트 스크립트
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'all_i_project',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

async function testConnection() {
    try {
        console.log('🔍 MySQL 연결 테스트 시작...');
        console.log('📋 연결 설정:', {
            host: dbConfig.host,
            user: dbConfig.user,
            database: dbConfig.database,
            password: dbConfig.password ? '***설정됨***' : '***비어있음***'
        });

        // 데이터베이스 없이 연결 테스트
        const testConfig = { ...dbConfig };
        delete testConfig.database;
        
        console.log('\n📡 MySQL 서버 연결 시도...');
        const connection = await mysql.createConnection(testConfig);
        console.log('✅ MySQL 서버 연결 성공!');

        // 데이터베이스 존재 확인
        console.log('\n🗄️ 데이터베이스 확인...');
        const [databases] = await connection.execute('SHOW DATABASES');
        const dbExists = databases.some(db => db.Database === dbConfig.database);
        
        if (dbExists) {
            console.log(`✅ 데이터베이스 '${dbConfig.database}' 존재함`);
            
            // 데이터베이스 연결 테스트
            await connection.query(`USE ${dbConfig.database}`);
            console.log('✅ 데이터베이스 연결 성공!');
            
            // 테이블 확인
            const [tables] = await connection.execute('SHOW TABLES');
            console.log(`📊 테이블 수: ${tables.length}`);
            tables.forEach(table => {
                console.log(`   - ${Object.values(table)[0]}`);
            });
            
            // users 테이블이 있으면 사용자 수 확인
            const hasUsersTable = tables.some(table => Object.values(table)[0] === 'users');
            if (hasUsersTable) {
                const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
                console.log(`👥 사용자 수: ${userCount[0].count}명`);
            }
            
        } else {
            console.log(`❌ 데이터베이스 '${dbConfig.database}' 없음`);
            console.log('💡 setup.sql 스크립트를 실행해주세요.');
        }

        await connection.end();
        console.log('\n🎉 연결 테스트 완료!');
        
    } catch (error) {
        console.error('\n❌ 연결 실패:', error.message);
        console.log('\n🔧 해결 방법:');
        console.log('1. MySQL 서비스가 실행 중인지 확인');
        console.log('2. .env 파일의 DB 설정 확인');
        console.log('3. MySQL 사용자 권한 확인');
        
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 MySQL 서버가 실행되지 않았거나 포트가 다릅니다.');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('💡 사용자명 또는 비밀번호가 잘못되었습니다.');
        }
    }
}

testConnection();