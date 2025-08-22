const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function createLocalDatabase() {
    console.log('🔧 로컬 데이터베이스 생성 시작...');
    
    // 로컬 DB 설정 (데이터베이스 없이 연결)
    const localConfig = {
        host: process.env.LOCAL_DB_HOST || 'localhost',
        port: parseInt(process.env.LOCAL_DB_PORT || '3306'),
        user: process.env.LOCAL_DB_USER || 'root',
        password: process.env.LOCAL_DB_PASSWORD || ''
    };
    
    let connection;
    try {
        console.log('📡 로컬 MySQL 서버 연결 중...');
        connection = await mysql.createConnection(localConfig);
        console.log('✅ 로컬 MySQL 서버 연결 성공');
        
        // 데이터베이스 생성
        const dbName = process.env.LOCAL_DB_NAME || 'alli_core_local';
        console.log(`🗄️ 데이터베이스 '${dbName}' 생성 중...`);
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
        console.log(`✅ 데이터베이스 '${dbName}' 생성 완료`);
        
        // 데이터베이스 선택 (query 사용)
        await connection.query(`USE ${dbName}`);
        console.log(`✅ 데이터베이스 '${dbName}' 선택 완료`);
        
        // 스키마 파일 읽기 및 실행
        const schemaPath = path.join(__dirname, '..', 'sql', '000_schema.sql');
        console.log('📄 스키마 파일 읽기 중...');
        const schemaSQL = await fs.readFile(schemaPath, 'utf8');
        
        // SQL 문을 세미콜론으로 분리하여 실행
        const statements = schemaSQL.split(';').filter(stmt => stmt.trim().length > 0);
        
        console.log('📊 테이블 생성 중...');
        for (const statement of statements) {
            if (statement.trim()) {
                await connection.query(statement.trim());
            }
        }
        
        // 생성된 테이블 확인
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = ?
        `, [dbName]);
        
        console.log(`📊 생성된 테이블 (${tables.length}개):`);
        tables.forEach(table => {
            console.log(`   ✓ ${table.TABLE_NAME}`);
        });
        
        console.log('🎉 로컬 데이터베이스 생성 완료!');
        
    } catch (error) {
        console.error('💥 로컬 데이터베이스 생성 실패:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 연결 종료');
        }
    }
}

// 실행
createLocalDatabase().catch(console.error);