const axios = require('axios');

const BASE_URL = 'http://localhost:3003';

async function testAuthAPI() {
    console.log('🧪 인증 API 테스트 시작...\n');
    
    const testUser = {
        username: 'testuser2025',
        email: 'testuser2025@example.com',
        password: 'Test123!@#',
        nickname: '테스트유저',
        gender: 'male',
        phone_number: '010-1234-5678'
    };
    
    try {
        // 1. 회원가입 테스트
        console.log('📝 회원가입 테스트...');
        const registerResponse = await axios.post(`${BASE_URL}/api/users/auth/register`, testUser);
        console.log('✅ 회원가입 성공:', {
            user: registerResponse.data.data.user,
            hasToken: !!registerResponse.data.data.tokens.accessToken
        });
        
        const userId = registerResponse.data.data.user.id;
        const accessToken = registerResponse.data.data.tokens.accessToken;
        
        // 2. 로그인 테스트 (username 기반)
        console.log('\n🔐 로그인 테스트 (username 기반)...');
        const loginResponse = await axios.post(`${BASE_URL}/api/users/auth/login`, {
            username: testUser.username,
            password: testUser.password
        });
        console.log('✅ 로그인 성공:', {
            user: loginResponse.data.data.user,
            hasToken: !!loginResponse.data.data.tokens.accessToken
        });
        
        // 3. 보호된 라우트 테스트 (토큰 사용)
        console.log('\n🛡️ 보호된 라우트 테스트...');
        const profileResponse = await axios.get(`${BASE_URL}/api/users/profile`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        console.log('✅ 프로필 조회 성공:', profileResponse.data.data.profile);
        
        // 4. username 중복 체크 테스트
        console.log('\n🔄 username 중복 체크 테스트...');
        try {
            await axios.post(`${BASE_URL}/api/users/auth/register`, {
                ...testUser,
                email: 'different@email.com' // 다른 이메일로 같은 username 시도
            });
            console.log('❌ username 중복 체크 실패 - 중복 허용됨');
        } catch (error) {
            if (error.response?.status === 409 && error.response.data.errors?.username) {
                console.log('✅ username 중복 체크 성공:', error.response.data.message);
            } else {
                console.log('❌ 예상과 다른 에러:', error.response?.data);
            }
        }
        
        // 5. 이메일 중복 체크 테스트
        console.log('\n📧 이메일 중복 체크 테스트...');
        try {
            await axios.post(`${BASE_URL}/api/users/auth/register`, {
                ...testUser,
                username: 'differentuser' // 다른 username으로 같은 이메일 시도
            });
            console.log('❌ 이메일 중복 체크 실패 - 중복 허용됨');
        } catch (error) {
            if (error.response?.status === 409 && error.response.data.errors?.email) {
                console.log('✅ 이메일 중복 체크 성공:', error.response.data.message);
            } else {
                console.log('❌ 예상과 다른 에러:', error.response?.data);
            }
        }
        
        // 6. 잘못된 로그인 테스트
        console.log('\n❌ 잘못된 로그인 테스트...');
        try {
            await axios.post(`${BASE_URL}/api/users/auth/login`, {
                username: testUser.username,
                password: 'wrongpassword'
            });
            console.log('❌ 잘못된 비밀번호가 허용됨');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ 잘못된 비밀번호 차단 성공');
            }
        }
        
        try {
            await axios.post(`${BASE_URL}/api/users/auth/login`, {
                username: 'nonexistentuser',
                password: testUser.password
            });
            console.log('❌ 존재하지 않는 사용자 로그인 허용됨');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ 존재하지 않는 사용자 차단 성공');
            }
        }
        
        console.log('\n🎉 모든 인증 API 테스트 완료!');
        
    } catch (error) {
        console.error('💥 테스트 실패:', error.response?.data || error.message);
        throw error;
    }
}

// 실행
testAuthAPI().catch(console.error);