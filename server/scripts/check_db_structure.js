const { getPool } = require('../config/database');

async function checkDatabaseStructure() {
    console.log('🔍 데이터베이스 구조 검증 시작...\n');
    
    try {
        const pool = await getPool();
        
        // 1. 테이블 목록 확인
        console.log('📋 현재 테이블 목록:');
        const [tables] = await pool.execute('SHOW TABLES');
        const tableNames = tables.map(table => Object.values(table)[0]).sort();
        tableNames.forEach(tableName => {
            console.log(`   ✓ ${tableName}`);
        });
        
        console.log('\n🔍 각 테이블 구조 상세 검증:\n');
        
        // 2. 각 테이블의 구조 확인
        for (const tableObj of tables) {
            const tableName = Object.values(tableObj)[0];
            console.log(`📊 ${tableName} 테이블:`);
            
            // 컬럼 정보 가져오기
            const [columns] = await pool.execute(`DESCRIBE ${tableName}`);
            columns.forEach(col => {
                const key = col.Key ? ` [${col.Key}]` : '';
                const nullable = col.Null === 'YES' ? ' (NULL허용)' : '';
                const defaultVal = col.Default ? ` (기본값: ${col.Default})` : '';
                console.log(`   - ${col.Field}: ${col.Type}${key}${nullable}${defaultVal}`);
            });
            
            // 외래키 정보 확인
            const [foreignKeys] = await pool.execute(`
                SELECT 
                    COLUMN_NAME,
                    REFERENCED_TABLE_NAME,
                    REFERENCED_COLUMN_NAME
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = DATABASE() 
                    AND TABLE_NAME = ? 
                    AND REFERENCED_TABLE_NAME IS NOT NULL
            `, [tableName]);
            
            if (foreignKeys.length > 0) {
                console.log('   🔗 외래키:');
                foreignKeys.forEach(fk => {
                    console.log(`     ${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
                });
            }
            console.log('');
        }
        
        // 3. Schema.sql과 비교할 예상 테이블
        const expectedTables = [
            'users', 'user_images', 'shelters', 'animals', 
            'prompts', 'generated_images', 'llm_logs'
        ];
        
        console.log('🎯 Schema.sql과 비교 결과:');
        const missingTables = expectedTables.filter(table => !tableNames.includes(table));
        const extraTables = tableNames.filter(table => !expectedTables.includes(table));
        
        if (missingTables.length === 0 && extraTables.length === 0) {
            console.log('✅ 모든 테이블이 schema.sql과 일치합니다!');
        } else {
            if (missingTables.length > 0) {
                console.log('❌ 누락된 테이블:', missingTables.join(', '));
            }
            if (extraTables.length > 0) {
                console.log('⚠️ 추가 테이블:', extraTables.join(', '));
            }
        }
        
        // 4. 테이블별 레코드 수 확인
        console.log('\n📊 각 테이블 데이터 현황:');
        for (const tableObj of tables) {
            const tableName = Object.values(tableObj)[0];
            const [count] = await pool.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
            console.log(`   ${tableName}: ${count[0].count}개 레코드`);
        }
        
        console.log('\n🎉 데이터베이스 구조 검증 완료!');
        
    } catch (error) {
        console.error('💥 검증 실패:', error.message);
        throw error;
    }
}

// 실행
checkDatabaseStructure().catch(console.error);