// 실제 데이터베이스 API 테스트 스크립트
const axios = require('axios');

const baseURL = 'http://localhost:3003';

async function testRealAPI() {
    console.log('🧪 실제 DB API 테스트 시작...');
    console.log(`📡 서버 URL: ${baseURL}`);
    
    try {
        // 1. 서버 상태 확인
        console.log('\n1️⃣ 서버 상태 확인...');
        const healthResponse = await axios.get(`${baseURL}/`);
        console.log('✅ 서버 상태:', healthResponse.data);
        
        // 2. 테스트 사용자로 로그인 (실제 DB)
        console.log('\n2️⃣ 실제 DB 로그인 테스트...');
        const loginData = {
            email: 'test@example.com',
            password: 'Test123!@#'
        };
        
        console.log(`📧 로그인 시도: ${loginData.email}`);
        const loginResponse = await axios.post(`${baseURL}/api/login`, loginData);
        
        console.log('🔍 로그인 응답 데이터:', JSON.stringify(loginResponse.data, null, 2));
        
        if (loginResponse.data.success) {
            console.log('✅ 로그인 성공!');
            console.log('👤 사용자 정보:', {
                username: loginResponse.data.data?.user?.username,
                email: loginResponse.data.data?.user?.email,
                nickname: loginResponse.data.data?.user?.nickname
            });
            console.log('🔑 토큰 수신됨:', loginResponse.data.data?.tokens?.accessToken ? '✓' : '✗');
        } else {
            console.log('❌ 로그인 실패:', loginResponse.data.message);
        }
        
        // 3. 잘못된 비밀번호로 로그인 시도
        console.log('\n3️⃣ 잘못된 비밀번호 테스트...');
        try {
            const wrongLoginData = {
                email: 'test@example.com',
                password: 'WrongPassword123'
            };
            
            const wrongLoginResponse = await axios.post(`${baseURL}/api/login`, wrongLoginData);
            console.log('❌ 예상과 다름: 잘못된 비밀번호로 로그인 성공함');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✅ 잘못된 비밀번호 차단됨');
            } else {
                console.log('⚠️ 예상과 다른 오류:', error.message);
            }
        }
        
        // 4. 존재하지 않는 사용자로 로그인 시도
        console.log('\n4️⃣ 존재하지 않는 사용자 테스트...');
        try {
            const nonExistentUserData = {
                email: 'nonexistent@example.com',
                password: 'SomePassword123'
            };
            
            const nonExistentResponse = await axios.post(`${baseURL}/api/login`, nonExistentUserData);
            console.log('❌ 예상과 다름: 존재하지 않는 사용자로 로그인 성공함');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✅ 존재하지 않는 사용자 차단됨');
            } else {
                console.log('⚠️ 예상과 다른 오류:', error.message);
            }
        }
        
        // 5. 회원가입 테스트
        console.log('\n5️⃣ 회원가입 테스트...');
        const registerData = {
            username: 'newuser',
            email: 'newuser@example.com',
            password: 'NewUser123!@#',
            name: '새로운사용자',
            phone: '010-7777-8888'
        };
        
        try {
            const registerResponse = await axios.post(`${baseURL}/api/register`, registerData);
            
            if (registerResponse.data.success) {
                console.log('✅ 회원가입 성공!');
                console.log('👤 새 사용자:', {
                    username: registerResponse.data.data?.user?.username,
                    email: registerResponse.data.data?.user?.email
                });
                console.log('🔑 자동 로그인 토큰:', registerResponse.data.data?.tokens?.accessToken ? '✓' : '✗');
            } else {
                console.log('❌ 회원가입 실패:', registerResponse.data.message);
            }
        } catch (error) {
            console.log('❌ 회원가입 오류:', error.response?.data?.message || error.message);
        }
        
        // 6. 중복 이메일 회원가입 시도
        console.log('\n6️⃣ 중복 이메일 회원가입 테스트...');
        try {
            const duplicateEmailData = {
                username: 'duplicate',
                email: 'test@example.com', // 이미 존재하는 이메일
                password: 'Duplicate123!@#',
                name: '중복이메일',
                phone: '010-9999-9999'
            };
            
            const duplicateResponse = await axios.post(`${baseURL}/api/register`, duplicateEmailData);
            console.log('❌ 예상과 다름: 중복 이메일로 회원가입 성공함');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✅ 중복 이메일 차단됨:', error.response.data.message);
            } else {
                console.log('⚠️ 예상과 다른 오류:', error.message);
            }
        }
        
        console.log('\n🎉 실제 DB API 테스트 완료!');
        
    } catch (error) {
        console.error('❌ API 테스트 실패:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 서버가 실행되지 않았습니다. npm run dev를 실행해주세요.');
        }
    }
}

// 서버가 실행 중인지 확인하고 테스트 실행
testRealAPI().catch(console.error);