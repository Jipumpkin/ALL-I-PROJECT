const axios = require('axios');

// 1x1 픽셀의 투명한 PNG 이미지에 대한 Base64 데이터입니다.
// 실제 테스트에서는 프론트엔드에서 넘어올 이미지 데이터에 해당합니다.
const sampleImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

// --- 테스트 설정 (아래 값을 자신의 데이터에 맞게 수정하세요) ---
const testConfig = {
    // API 서버의 주소와 포트
    serverUrl: 'http://localhost:3307',

    // DB에 실제로 존재하는 동물의 ID
    animal_id: '1', // 예시: '60d0fe4f5311236168a109ca'

    // DB에 실제로 존재하는 사용자의 ID
    user_id: '1' , // 예시: '60d0fe4f5311236168a109cb'

    // 테스트할 이미지 생성 모드: "bath", "meal", "styling" 중 선택
    style: 'bath',

    // 새 이미지를 업로드하는 시나리오를 테스트합니다.
    extraImageUrl: 'new'
};
// ----------------------------------------------------------------

const testEndpoint = async () => {
    console.log('AI 이미지 생성 기능 테스트를 시작합니다...');
    
    if (testConfig.animal_id.startsWith('여기에') || testConfig.user_id.startsWith('여기에')) {
        console.error('❌ 테스트 실패: 스크립트 파일(test_ai_endpoint.js)을 열어 animalId와 userId를 실제 데이터베이스에 있는 ID로 수정해주세요.');
        return;
    }

    console.log('테스트 설정:', testConfig);

    try {
        const response = await axios.post(`${testConfig.serverUrl}/api/ai/generate`, {
            animalId: testConfig.animal_id,
            userId: testConfig.user_id,
            style: testConfig.style,
            extraImageUrl: testConfig.extraImageUrl,
            extraImageBase64: sampleImageBase64
        });

        console.log('✅ 테스트 성공!');
        console.log('서버 응답:', response.data);
        if (response.data.imageUrl) {
            console.log('생성된 이미지 URL:', response.data.imageUrl);
        }

    } catch (error) {
        console.error('❌ 테스트 실패!');
        if (error.response) {
            // 서버가 응답을 반환했지만, 상태 코드가 2xx가 아닌 경우
            console.error('에러 상태:', error.response.status);
            console.error('에러 데이터:', error.response.data);
        } else if (error.request) {
            // 요청이 이루어졌으나 응답을 받지 못한 경우
            console.error('서버에서 응답이 없습니다. 서버가 실행 중인지 확인하세요.');
        } else {
            // 요청을 설정하는 중에 에러가 발생한 경우
            console.error('요청 설정 중 에러 발생:', error.message);
        }
    }
};

testEndpoint();
