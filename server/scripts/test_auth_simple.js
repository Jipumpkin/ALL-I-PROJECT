const axios = require('axios');

const BASE_URL = 'http://localhost:3003';

async function testSimpleAuth() {
    console.log('🧪 간단한 인증 테스트...\n');
    
    const testUser = {
        username: 'quicktest',
        email: 'quicktest@example.com',
        password: 'Test123!@#'
    };
    
    try {
        // 1. 회원가입
        console.log('📝 회원가입...');
        const registerResponse = await axios.post(`${BASE_URL}/api/users/auth/register`, testUser);
        console.log('✅ 회원가입 성공:', registerResponse.data.data.user.username);
        
        const accessToken = registerResponse.data.data.tokens.accessToken;
        console.log('🔑 토큰 받음:', accessToken.substring(0, 50) + '...');
        
        // 2. 즉시 프로필 조회 테스트
        console.log('\n🛡️ 프로필 조회...');
        const profileResponse = await axios.get(`${BASE_URL}/api/users/profile`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        console.log('✅ 프로필 조회 성공:', profileResponse.data.data.profile.username);
        
        // 3. 로그인 테스트
        console.log('\n🔐 로그인 테스트...');
        const loginResponse = await axios.post(`${BASE_URL}/api/users/auth/login`, {
            username: testUser.username,
            password: testUser.password
        });
        console.log('✅ 로그인 성공:', loginResponse.data.data.user.username);
        
        console.log('\n🎉 모든 테스트 성공!');
        
    } catch (error) {
        console.error('💥 테스트 실패:');
        if (error.response) {
            console.error('상태코드:', error.response.status);
            console.error('응답:', error.response.data);
        } else {
            console.error('에러:', error.message);
        }
    }
}

testSimpleAuth();