// 데이터베이스 및 테이블 자동 생성 스크립트
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
    let connection;
    
    try {
        console.log('🔧 데이터베이스 설정 시작...');
        
        // 데이터베이스 없이 MySQL 서버에 연결
        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true
        };
        
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ MySQL 서버 연결 성공');
        
        // setup.sql 파일 읽기
        const setupSqlPath = path.join(__dirname, '../db/setup.sql');
        const setupSql = fs.readFileSync(setupSqlPath, 'utf8');
        
        console.log('📄 setup.sql 파일 읽기 완료');
        
        // 1단계: 데이터베이스 생성
        console.log('🗄️ 데이터베이스 생성 중...');
        await connection.execute(`
            CREATE DATABASE IF NOT EXISTS all_i_project 
            CHARACTER SET utf8mb4 
            COLLATE utf8mb4_unicode_ci
        `);
        console.log('✅ 데이터베이스 생성 완료');
        
        // 2단계: 데이터베이스 선택
        await connection.query('USE all_i_project');
        console.log('✅ 데이터베이스 선택 완료');
        
        // 3단계: 기존 테이블 삭제
        console.log('🗑️ 기존 테이블 정리...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        const dropTables = [
            'llm_logs', 'generated_images', 'prompts', 
            'user_images', 'animals', 'shelters', 'users'
        ];
        for (const table of dropTables) {
            await connection.execute('DROP TABLE IF EXISTS ' + table);
        }
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✅ 기존 테이블 정리 완료');
        
        // 4단계: 테이블 생성
        console.log('📊 테이블 생성 중...');
        
        // users 테이블
        await connection.execute(`
            CREATE TABLE users (
                user_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                nickname VARCHAR(50),
                gender ENUM('male', 'female', 'other', 'unknown') DEFAULT 'unknown',
                phone_number VARCHAR(20),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                last_login_at DATETIME
            )
        `);
        
        // shelters 테이블
        await connection.execute(`
            CREATE TABLE shelters (
                shelter_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                shelter_name VARCHAR(100),
                email VARCHAR(100),
                contact_number VARCHAR(20),
                address VARCHAR(255),
                region VARCHAR(100),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // animals 테이블
        await connection.execute(`
            CREATE TABLE animals (
                animal_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                species VARCHAR(50),
                gender ENUM('male', 'female', 'unknown') DEFAULT 'unknown',
                age VARCHAR(20),
                image_url TEXT,
                shelter_id BIGINT UNSIGNED,
                status ENUM('available', 'adopted', 'pending') DEFAULT 'available',
                region VARCHAR(100),
                rescued_at DATE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (shelter_id) REFERENCES shelters(shelter_id) ON DELETE SET NULL
            )
        `);
        
        // user_images 테이블
        await connection.execute(`
            CREATE TABLE user_images (
                image_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                user_id BIGINT UNSIGNED NOT NULL,
                image_url TEXT NOT NULL,
                uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            )
        `);
        
        // 나머지 테이블들
        await connection.execute(`
            CREATE TABLE prompts (
                prompt_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                user_id BIGINT UNSIGNED NOT NULL,
                original_prompt TEXT,
                final_prompt TEXT,
                image_id BIGINT UNSIGNED,
                animal_id BIGINT UNSIGNED,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                FOREIGN KEY (image_id) REFERENCES user_images(image_id) ON DELETE SET NULL,
                FOREIGN KEY (animal_id) REFERENCES animals(animal_id) ON DELETE SET NULL
            )
        `);
        
        await connection.execute(`
            CREATE TABLE generated_images (
                generated_image_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                user_id BIGINT UNSIGNED NOT NULL,
                prompt_id BIGINT UNSIGNED NOT NULL,
                image_url TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                FOREIGN KEY (prompt_id) REFERENCES prompts(prompt_id) ON DELETE CASCADE
            )
        `);
        
        await connection.execute(`
            CREATE TABLE llm_logs (
                log_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                request_type ENUM('gpt', 'dalle') NOT NULL,
                cost DECIMAL(10,5),
                result_id BIGINT UNSIGNED NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // 인덱스 추가
        await connection.execute('CREATE INDEX idx_users_email ON users(email)');
        await connection.execute('CREATE INDEX idx_users_username ON users(username)');
        await connection.execute('CREATE INDEX idx_animals_status ON animals(status)');
        await connection.execute('CREATE INDEX idx_animals_region ON animals(region)');
        
        console.log('✅ 테이블 생성 완료');
        
        // 생성된 테이블 확인
        await connection.query('USE all_i_project');
        const [tables] = await connection.execute('SHOW TABLES');
        
        console.log(`📊 생성된 테이블 (${tables.length}개):`);
        tables.forEach(table => {
            console.log(`   ✓ ${Object.values(table)[0]}`);
        });
        
        console.log('\n🎉 데이터베이스 설정 완료!');
        
    } catch (error) {
        console.error('❌ 오류 발생:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

setupDatabase().catch(console.error);