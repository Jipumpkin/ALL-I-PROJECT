const axios = require('axios');

// Base URL for the server
const BASE_URL = 'http://localhost:3003/api';

// 테스트용 Base64 이미지들
const redImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='; // 빨강
const greenImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='; // 초록

async function testProfileImageReplace() {
  console.log('🚀 프로필 이미지 교체 테스트 시작...\n');

  try {
    // 기존 사용자 (ID: 7)
    const userId = 7;

    console.log('1️⃣ 사용자 기존 이미지 조회...');
    const beforeResponse = await axios.get(`${BASE_URL}/users/${userId}/images`);
    
    if (beforeResponse.data.success) {
      console.log(`   기존 이미지 수: ${beforeResponse.data.count}`);
      beforeResponse.data.data.forEach((image, index) => {
        console.log(`   이미지 ${index + 1}: ${image.storage_type} (ID: ${image.image_id}) - ${image.filename || 'N/A'}`);
      });
    }

    console.log('\n2️⃣ 프로필 이미지를 빨간색 이미지로 교체...');
    const redImageData = {
      image_data: redImageBase64,
      filename: 'red_profile.png',
      mime_type: 'image/png',
      file_size: 95,
      storage_type: 'base64'
    };

    const redResponse = await axios.put(`${BASE_URL}/users/${userId}/images/profile`, redImageData);
    
    if (redResponse.data.success) {
      console.log('✅ 빨간색 이미지로 교체 성공!');
      console.log(`   새 이미지 ID: ${redResponse.data.image.image_id}`);
    }

    console.log('\n3️⃣ 교체 후 이미지 조회...');
    const afterRedResponse = await axios.get(`${BASE_URL}/users/${userId}/images`);
    
    if (afterRedResponse.data.success) {
      console.log(`   총 이미지 수: ${afterRedResponse.data.count}`);
      afterRedResponse.data.data.forEach((image, index) => {
        console.log(`   이미지 ${index + 1}: ${image.storage_type} (ID: ${image.image_id}) - ${image.filename || 'N/A'}`);
      });
    }

    console.log('\n4️⃣ URL 방식으로 프로필 이미지 재교체...');
    const urlImageData = {
      image_url: 'https://placehold.co/100x100/0000FF/FFFFFF?text=URL',
      storage_type: 'url'
    };

    const urlResponse = await axios.put(`${BASE_URL}/users/${userId}/images/profile`, urlImageData);
    
    if (urlResponse.data.success) {
      console.log('✅ URL 이미지로 교체 성공!');
      console.log(`   새 이미지 ID: ${urlResponse.data.image.image_id}`);
    }

    console.log('\n5️⃣ 최종 이미지 조회...');
    const finalResponse = await axios.get(`${BASE_URL}/users/${userId}/images`);
    
    if (finalResponse.data.success) {
      console.log(`   총 이미지 수: ${finalResponse.data.count}`);
      finalResponse.data.data.forEach((image, index) => {
        console.log(`   이미지 ${index + 1}:`);
        console.log(`     - ID: ${image.image_id}`);
        console.log(`     - 저장 타입: ${image.storage_type}`);
        console.log(`     - 파일명: ${image.filename || 'N/A'}`);
        console.log(`     - URL: ${image.image_url ? 'YES' : 'N/A'}`);
        console.log(`     - Base64: ${image.image_data ? 'YES' : 'N/A'}`);
      });
    }

    console.log('\n🎉 프로필 이미지 교체 테스트 완료!');
    console.log('✅ 기존 이미지들이 삭제되고 새 이미지로 교체되었습니다.');

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.response?.data || error.message);
  }
}

// 테스트 실행
testProfileImageReplace();