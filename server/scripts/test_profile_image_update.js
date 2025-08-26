const axios = require('axios');

// Base URL for the server
const BASE_URL = 'http://localhost:3003/api';

// 테스트용 Base64 이미지 (작은 2x2 파란색 PNG)
const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFUlEQVQIHWPc//8/AzYwOjGQDcNQgAAAAANcAQAAGGqJrAAAABJRU5ErkJggg==';

async function testProfileImageUpdate() {
  console.log('🚀 프로필 이미지 업데이트 테스트 시작...\n');

  try {
    // 기존 사용자로 로그인 (테스트용)
    const userId = 7; // 앞에서 생성한 사용자 ID

    console.log('1️⃣ 사용자 기존 이미지 조회...');
    const beforeResponse = await axios.get(`${BASE_URL}/users/${userId}/images`);
    
    if (beforeResponse.data.success) {
      console.log(`   기존 이미지 수: ${beforeResponse.data.count}`);
      beforeResponse.data.data.forEach((image, index) => {
        console.log(`   이미지 ${index + 1}: ${image.storage_type} (ID: ${image.image_id})`);
      });
    }

    console.log('\n2️⃣ 새로운 프로필 이미지 업로드...');
    const newImageData = {
      image_data: testImageBase64,
      filename: 'new_profile.png',
      mime_type: 'image/png',
      file_size: 150,
      storage_type: 'base64'
    };

    const uploadResponse = await axios.post(`${BASE_URL}/users/${userId}/images`, newImageData);
    
    if (uploadResponse.data.success) {
      console.log('✅ 새 이미지 업로드 성공!');
      console.log(`   새 이미지 ID: ${uploadResponse.data.image.image_id}`);
      console.log(`   저장 타입: ${uploadResponse.data.image.storage_type}`);
    }

    console.log('\n3️⃣ 업데이트 후 이미지 조회...');
    const afterResponse = await axios.get(`${BASE_URL}/users/${userId}/images`);
    
    if (afterResponse.data.success) {
      console.log(`   총 이미지 수: ${afterResponse.data.count}`);
      afterResponse.data.data.forEach((image, index) => {
        console.log(`   이미지 ${index + 1}:`);
        console.log(`     - ID: ${image.image_id}`);
        console.log(`     - 저장 타입: ${image.storage_type}`);
        console.log(`     - 파일명: ${image.filename || 'N/A'}`);
        console.log(`     - 업로드 시간: ${image.uploaded_at}`);
      });
    }

    console.log('\n🎉 프로필 이미지 업데이트 테스트 완료!');

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.response?.data || error.message);
  }
}

// 테스트 실행
testProfileImageUpdate();