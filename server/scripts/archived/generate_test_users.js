// 테스트 사용자를 위한 실제 bcrypt 해시 생성 스크립트
const bcrypt = require('bcryptjs');

const testUsers = [
    {
        username: 'testuser',
        email: 'test@example.com', 
        password: 'Test123!@#',
        nickname: '테스트유저',
        gender: 'male',
        phone_number: '010-1234-5678'
    },
    {
        username: 'admin',
        email: 'admin@allipet.com',
        password: 'Admin123!@#', 
        nickname: '관리자',
        gender: 'female',
        phone_number: '010-9999-0000'
    },
    {
        username: 'demo',
        email: 'demo@allipet.com',
        password: 'Demo123!@#',
        nickname: '데모유저', 
        gender: 'other',
        phone_number: '010-5555-1234'
    }
];

async function generateHashes() {
    console.log('-- 실제 bcrypt 해시값으로 업데이트된 테스트 데이터');
    console.log('USE all_i_project;');
    console.log('');
    
    for (const user of testUsers) {
        const hashedPassword = await bcrypt.hash(user.password, 12);
        console.log(`INSERT INTO users (username, email, password_hash, nickname, gender, phone_number) VALUES`);
        console.log(`('${user.username}', '${user.email}', '${hashedPassword}', '${user.nickname}', '${user.gender}', '${user.phone_number}');`);
    }
    
    console.log('');
    console.log('-- 생성된 사용자 확인');
    console.log('SELECT user_id, username, email, nickname, created_at FROM users;');
}

generateHashes().catch(console.error);