const axios = require('axios');

const BASE_URL = 'http://localhost:3003';

async function testNewRegisterFlow() {
    console.log('🧪 새로운 회원가입 플로우 테스트...\n');
    
    const testUsername = 'newuser' + Date.now();
    
    try {
        // 1. 아이디 중복체크 테스트
        console.log('1️⃣ 아이디 중복체크 테스트...');
        try {
            const checkResponse = await axios.post(`${BASE_URL}/api/users/auth/check-username`, {
                username: testUsername
            });
            console.log('✅ 중복체크 성공:', checkResponse.data.message);
        } catch (error) {
            console.log('❌ 중복체크 실패:', error.response?.data?.message);
        }
        
        // 2. 새로운 필드로 회원가입 테스트
        console.log('\n2️⃣ 새로운 필드로 회원가입 테스트...');
        const registerData = {
            username: testUsername,
            password: 'Test123!@#',
            email: testUsername + '@test.com',
            nickname: '새로운유저',
            gender: 'male',
            phone_number: '010-9999-8888'
        };
        
        const registerResponse = await axios.post(`${BASE_URL}/api/users/auth/register`, registerData);
        console.log('✅ 회원가입 성공:', {
            user: registerResponse.data.data.user,
            hasToken: !!registerResponse.data.data.tokens.accessToken
        });
        
        // 3. 로그인 테스트
        console.log('\n3️⃣ 로그인 테스트...');
        const loginResponse = await axios.post(`${BASE_URL}/api/users/auth/login`, {
            username: testUsername,
            password: 'Test123!@#'
        });
        console.log('✅ 로그인 성공:', {
            user: loginResponse.data.data.user,
            hasToken: !!loginResponse.data.data.tokens.accessToken
        });
        
        // 4. 같은 아이디로 중복체크 (이제 실패해야 함)
        console.log('\n4️⃣ 같은 아이디 중복체크 (실패 테스트)...');
        try {
            await axios.post(`${BASE_URL}/api/users/auth/check-username`, {
                username: testUsername
            });
            console.log('❌ 중복체크가 통과되었습니다 (문제!)');
        } catch (error) {
            if (error.response?.status === 409) {
                console.log('✅ 중복체크 정상 차단:', error.response.data.message);
            } else {
                console.log('❌ 예상과 다른 에러:', error.response?.data);
            }
        }
        
        console.log('\n🎉 모든 테스트 완료!');
        
    } catch (error) {
        console.error('💥 테스트 실패:', error.response?.data || error.message);
    }
}

testNewRegisterFlow();