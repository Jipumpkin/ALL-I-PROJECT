// animalController.getAnimals 시뮬레이션 테스트
const { getPool } = require('./config/database');

async function testGetAnimals() {
    try {
        console.log('🔄 컨트롤러 로직 시작...');
        
        // 요청 파라미터 시뮬레이션
        const filter = 'all';
        const page = 1;
        const shelter_id = undefined;
        const limit = 12;
        const offset = (page - 1) * limit;
        
        console.log('   쿼리 파라미터:', { filter, page, shelter_id, limit, offset });
        
        // 데이터베이스 풀 획득
        console.log('🔗 데이터베이스 풀 획득 중...');
        const pool = await getPool();
        console.log('✅ 풀 획득 완료');
        
        // WHERE 조건 구성
        let whereClauses = [];
        let params = [];
        
        if (filter && filter !== 'all') {
            console.log('   필터 조건 추가...');
            // 실제로는 dog, cat, other 필터링 로직
        }
        
        if (shelter_id && shelter_id !== 'all') {
            console.log('   보호소 조건 추가...');
        }
        
        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        console.log('   WHERE 절:', whereSql || '(없음)');
        
        // 쿼리 구성
        const countQuery = `SELECT COUNT(*) as count FROM animals ${whereSql}`;
        const selectQuery = `SELECT * FROM animals ${whereSql} ORDER BY animal_id DESC LIMIT ${limit} OFFSET ${offset}`;
        
        console.log('   실행할 쿼리들:');
        console.log('   1.', countQuery);
        console.log('   2.', selectQuery);
        
        // 쿼리 실행
        console.log('🚀 쿼리 실행 중...');
        const startTime = Date.now();
        
        console.log('   COUNT 쿼리 실행...');
        const [countRows] = await pool.execute(countQuery, params);
        const totalAnimals = countRows[0].count;
        const totalPages = Math.ceil(totalAnimals / limit);
        console.log('   COUNT 결과:', totalAnimals);
        
        console.log('   SELECT 쿼리 실행...');
        const [animals] = await pool.execute(selectQuery, params);
        console.log('   SELECT 결과 개수:', animals.length);
        
        const totalTime = Date.now() - startTime;
        console.log('✅ 쿼리 완료 - 총 소요시간:', totalTime, 'ms');
        
        // 응답 데이터 구성
        const response = { animals, totalPages };
        console.log('📋 응답 데이터 구조:', {
            animalsCount: animals.length,
            totalAnimals,
            totalPages,
            firstAnimalId: animals[0]?.animal_id,
            lastAnimalId: animals[animals.length - 1]?.animal_id
        });
        
        return response;
        
    } catch (error) {
        console.error('❌ 컨트롤러 시뮬레이션 에러:', error.message);
        console.error('❌ 에러 스택:', error.stack);
        throw error;
    }
}

// 실행
testGetAnimals()
    .then(() => {
        console.log('🎉 테스트 완료');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 테스트 실패:', error.message);
        process.exit(1);
    });