const { getPool, initializeDatabase } = require('../config/database');

async function testDatabaseFallback() {
    console.log('🧪 데이터베이스 연결 폴백 테스트 시작...\n');
    
    try {
        // 데이터베이스 초기화 (자동 폴백 포함)
        await initializeDatabase();
        
        // 풀 가져오기
        const pool = await getPool();
        
        // 연결 테스트
        console.log('\n📊 데이터베이스 연결 테스트...');
        const [result] = await pool.execute('SELECT ? as message, NOW() as test_time', ['연결 성공!']);
        console.log('✅ 쿼리 결과:', result[0]);
        
        // users 테이블 조회 테스트
        console.log('\n👥 사용자 테이블 조회 테스트...');
        const [users] = await pool.execute('SELECT COUNT(*) as user_count FROM users');
        console.log(`✅ 현재 사용자 수: ${users[0].user_count}명`);
        
        // 테이블 목록 조회
        console.log('\n📋 테이블 목록 조회...');
        const [tables] = await pool.execute('SHOW TABLES');
        console.log('✅ 데이터베이스 테이블:');
        tables.forEach(table => {
            const tableName = Object.values(table)[0];
            console.log(`   ✓ ${tableName}`);
        });
        
        console.log('\n🎉 데이터베이스 연결 폴백 테스트 완료!');
        
    } catch (error) {
        console.error('💥 테스트 실패:', error.message);
        throw error;
    }
}

// 실행
testDatabaseFallback().catch(console.error);