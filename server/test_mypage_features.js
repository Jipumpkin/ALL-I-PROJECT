const axios = require('axios');

const BASE_URL = 'http://localhost:3003';

// 테스트용 JWT 토큰 (실제 로그인으로 얻은 토큰 사용)
let testToken = '';

async function testMyPageFeatures() {
    console.log('🧪 마이페이지 기능 테스트 시작...\n');
    
    try {
        // 1. 회원가입 후 로그인하여 토큰 획득
        console.log('1️⃣ 테스트용 계정 생성 및 로그인...');
        
        const testUsername = 'mypagetestuser' + Date.now();
        const testPassword = 'Test123!@#';
        
        console.log('   → 새 테스트 계정 생성...');
        const registerResponse = await axios.post(`${BASE_URL}/api/users/auth/register`, {
            username: testUsername,
            password: testPassword,
            email: testUsername + '@test.com',
            nickname: '테스트용계정',
            gender: 'male',
            phone_number: '010-0000-0000'
        });
        
        if (!registerResponse.data.success) {
            console.log('❌ 회원가입 실패:', registerResponse.data.message);
            return;
        }
        
        console.log('   → 생성된 계정으로 로그인...');
        const loginResponse = await axios.post(`${BASE_URL}/api/users/auth/login`, {
            username: testUsername,
            password: testPassword
        });
        
        if (loginResponse.data.success) {
            testToken = loginResponse.data.data.tokens.accessToken;
            console.log('✅ 로그인 성공');
            
            // 토큰 내용 확인 (디버깅용)
            const jwt = require('jsonwebtoken');
            const decoded = jwt.decode(testToken);
            console.log('   → 토큰 내용:', { userId: decoded.userId, username: decoded.username });
        } else {
            console.log('❌ 로그인 실패');
            return;
        }
        
        // 2. 프로필 조회 테스트
        console.log('\n2️⃣ 프로필 조회 테스트...');
        const profileResponse = await axios.get(`${BASE_URL}/api/users/profile`, {
            headers: { Authorization: `Bearer ${testToken}` }
        });
        
        console.log('✅ 프로필 조회 성공:', {
            username: profileResponse.data.data.profile.username,
            email: profileResponse.data.data.profile.email,
            nickname: profileResponse.data.data.profile.nickname,
            gender: profileResponse.data.data.profile.gender,
            phone_number: profileResponse.data.data.profile.phone_number
        });
        
        // 3. 프로필 수정 테스트
        console.log('\n3️⃣ 프로필 수정 테스트...');
        const updateData = {
            nickname: '테스트유저' + Date.now(),
            phone_number: '010-1234-5678',
            gender: 'male'
        };
        
        const updateResponse = await axios.put(`${BASE_URL}/api/users/profile`, updateData, {
            headers: { Authorization: `Bearer ${testToken}` }
        });
        
        if (updateResponse.data.success) {
            console.log('✅ 프로필 수정 성공:', updateResponse.data.data.profile);
        } else {
            console.log('❌ 프로필 수정 실패:', updateResponse.data.message);
        }
        
        // 4. 수정된 프로필 다시 조회
        console.log('\n4️⃣ 수정된 프로필 재조회...');
        const updatedProfileResponse = await axios.get(`${BASE_URL}/api/users/profile`, {
            headers: { Authorization: `Bearer ${testToken}` }
        });
        
        console.log('✅ 수정된 프로필:', {
            nickname: updatedProfileResponse.data.data.profile.nickname,
            phone_number: updatedProfileResponse.data.data.profile.phone_number,
            gender: updatedProfileResponse.data.data.profile.gender
        });
        
        // 5. 잘못된 데이터로 수정 시도 (유효성 검사 테스트)
        console.log('\n5️⃣ 유효성 검사 테스트...');
        try {
            await axios.put(`${BASE_URL}/api/users/profile`, {
                phone_number: '잘못된 번호',
                gender: 'invalid'
            }, {
                headers: { Authorization: `Bearer ${testToken}` }
            });
            console.log('❌ 유효성 검사가 작동하지 않음');
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('✅ 유효성 검사 정상 작동:', error.response.data.message);
            } else {
                console.log('❌ 예상과 다른 에러:', error.response?.data);
            }
        }
        
        // 6. 빈 데이터로 수정 시도
        console.log('\n6️⃣ 빈 데이터 수정 테스트...');
        try {
            await axios.put(`${BASE_URL}/api/users/profile`, {}, {
                headers: { Authorization: `Bearer ${testToken}` }
            });
            console.log('❌ 빈 데이터 검사가 작동하지 않음');
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('✅ 빈 데이터 검사 정상 작동:', error.response.data.message);
            } else {
                console.log('❌ 예상과 다른 에러:', error.response?.data);
            }
        }
        
        // 7. 회원탈퇴 테스트 (실제로는 실행하지 않음 - 비밀번호만 검증)
        console.log('\n7️⃣ 회원탈퇴 비밀번호 검증 테스트...');
        try {
            await axios.delete(`${BASE_URL}/api/users/account`, {
                data: { password: '잘못된비밀번호' },
                headers: { Authorization: `Bearer ${testToken}` }
            });
            console.log('❌ 비밀번호 검증이 작동하지 않음');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ 비밀번호 검증 정상 작동:', error.response.data.message);
            } else {
                console.log('❌ 예상과 다른 에러:', error.response?.data);
            }
        }
        
        console.log('\n🎉 모든 마이페이지 기능 테스트 완료!');
        
    } catch (error) {
        console.error('💥 테스트 실행 중 오류:', error.response?.data || error.message);
    }
}

// 테스트 실행
testMyPageFeatures();