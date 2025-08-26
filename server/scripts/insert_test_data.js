// 테스트 데이터 삽입 스크립트
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function insertTestData() {
    let connection;
    
    try {
        console.log('📝 테스트 데이터 삽입 시작...');
        
        // 데이터베이스 연결
        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'all_i_project'
        };
        
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ 데이터베이스 연결 성공');
        
        // 기존 데이터 정리
        console.log('🗑️ 기존 테스트 데이터 정리...');
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
        await connection.execute('DELETE FROM llm_logs');
        await connection.execute('DELETE FROM generated_images');
        await connection.execute('DELETE FROM prompts');
        await connection.execute('DELETE FROM user_images');
        await connection.execute('DELETE FROM animals');
        await connection.execute('DELETE FROM shelters');
        await connection.execute('DELETE FROM users');
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✅ 기존 데이터 정리 완료');
        
        // 테스트 사용자 데이터 삽입
        console.log('👤 사용자 데이터 삽입...');
        const users = [
            ['testuser', 'test@example.com', '$2b$12$NGU9YUwB6qIuMIuD6.Ye5.6rcYnVBW2SjReFMpos.TWctknK7MPmu', '테스트유저', 'male', '010-1234-5678'],
            ['admin', 'admin@allipet.com', '$2b$12$1MUWCt395ghyMvVJDtkttOOIEGRlckZzSY9x7vak8JtHX6WXnwOKW', '관리자', 'female', '010-9999-0000'],
            ['demo', 'demo@allipet.com', '$2b$12$bQGPtE1sB8cdQ1pFlW9f/eI0uD9IJUhDwQ.XBDgojFzJ1IVs6xarW', '데모유저', 'other', '010-5555-1234']
        ];
        
        for (const user of users) {
            await connection.execute(
                'INSERT INTO users (username, email, password_hash, nickname, gender, phone_number) VALUES (?, ?, ?, ?, ?, ?)',
                user
            );
        }
        console.log(`✅ 사용자 ${users.length}명 삽입 완료`);
        
        // 샘플 보호소 데이터 삽입
        console.log('🏠 보호소 데이터 삽입...');
        const shelters = [
            ['서울동물보호센터', 'seoul@shelter.kr', '02-1234-5678', '서울시 강남구 테헤란로 123', '서울'],
            ['부산동물사랑센터', 'busan@shelter.kr', '051-9876-5432', '부산시 해운대구 해변로 456', '부산'],
            ['대구펫보호소', 'daegu@shelter.kr', '053-5555-7777', '대구시 중구 동성로 789', '대구']
        ];
        
        for (const shelter of shelters) {
            await connection.execute(
                'INSERT INTO shelters (shelter_name, email, contact_number, address, region) VALUES (?, ?, ?, ?, ?)',
                shelter
            );
        }
        console.log(`✅ 보호소 ${shelters.length}개 삽입 완료`);
        
        // 샘플 유기동물 데이터 삽입
        console.log('🐕 동물 데이터 삽입...');
        const animals = [
            ['개', 'male', '2세', '/images/sample_dog1.jpg', 1, 'available', '서울', '2025-01-15'],
            ['고양이', 'female', '1세', '/images/sample_cat1.jpg', 1, 'available', '서울', '2025-01-20'],
            ['개', 'unknown', '3세', '/images/sample_dog2.jpg', 2, 'available', '부산', '2025-02-01'],
            ['고양이', 'male', '4세', '/images/sample_cat2.jpg', 2, 'pending', '부산', '2025-02-05'],
            ['개', 'female', '1세', '/images/sample_dog3.jpg', 3, 'available', '대구', '2025-02-10']
        ];
        
        for (const animal of animals) {
            await connection.execute(
                'INSERT INTO animals (species, gender, age, image_url, shelter_id, status, region, rescued_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                animal
            );
        }
        console.log(`✅ 동물 ${animals.length}마리 삽입 완료`);
        
        // 삽입된 데이터 확인
        console.log('\n📊 삽입된 데이터 확인:');
        const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
        const [shelterCount] = await connection.execute('SELECT COUNT(*) as count FROM shelters');
        const [animalCount] = await connection.execute('SELECT COUNT(*) as count FROM animals');
        
        console.log(`   👥 사용자: ${userCount[0].count}명`);
        console.log(`   🏠 보호소: ${shelterCount[0].count}개`);
        console.log(`   🐕 동물: ${animalCount[0].count}마리`);
        
        // 사용자 정보 확인 (비밀번호 제외)
        console.log('\n👤 등록된 사용자 목록:');
        const [usersData] = await connection.execute('SELECT user_id, username, email, nickname, gender, phone_number, created_at FROM users');
        usersData.forEach(user => {
            console.log(`   - ${user.username} (${user.email}) - ${user.nickname}`);
        });
        
        console.log('\n🎉 테스트 데이터 삽입 완료!');
        
    } catch (error) {
        console.error('❌ 오류 발생:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

insertTestData().catch(console.error);