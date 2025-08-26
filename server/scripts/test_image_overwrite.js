const axios = require('axios');

// Base URL for the server
const BASE_URL = 'http://localhost:3003/api';

// 다양한 테스트 이미지들
const images = {
  red: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  green: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  blue: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
};

async function testImageOverwrite() {
  console.log('🚀 이미지 덮어쓰기 테스트 시작...\n');
  console.log('===================================');
  console.log('이 테스트는 이미지 변경 시 기존 이미지가');
  console.log('완전히 삭제되고 새 이미지로 교체되는지 확인합니다.');
  console.log('===================================\n');

  try {
    // 새 사용자 생성
    const newUser = {
      username: `testoverwrite_${Date.now()}`,
      password: 'Test123!@#',
      email: `testoverwrite_${Date.now()}@test.com`,
      nickname: '덮어쓰기테스트'
    };

    console.log('1️⃣ 새 사용자 생성...');
    const registerResponse = await axios.post(`${BASE_URL}/register`, newUser);
    const userId = registerResponse.data.user.id;
    console.log(`✅ 사용자 생성 완료 (ID: ${userId})\n`);

    // 초기 이미지 추가
    console.log('2️⃣ 초기 빨간색 이미지 추가...');
    await axios.put(`${BASE_URL}/users/${userId}/images/profile`, {
      image_data: images.red,
      filename: 'red.png',
      mime_type: 'image/png',
      file_size: 95,
      storage_type: 'base64'
    });

    let response = await axios.get(`${BASE_URL}/users/${userId}/images`);
    console.log(`✅ 이미지 추가 완료`);
    console.log(`   현재 이미지 수: ${response.data.count}`);
    console.log(`   이미지 ID: ${response.data.data[0].image_id}`);
    console.log(`   파일명: ${response.data.data[0].filename}\n`);

    // 초록색으로 변경
    console.log('3️⃣ 초록색 이미지로 덮어쓰기...');
    await axios.put(`${BASE_URL}/users/${userId}/images/profile`, {
      image_data: images.green,
      filename: 'green.png',
      mime_type: 'image/png',
      file_size: 95,
      storage_type: 'base64'
    });

    response = await axios.get(`${BASE_URL}/users/${userId}/images`);
    console.log(`✅ 이미지 교체 완료`);
    console.log(`   현재 이미지 수: ${response.data.count}`);
    if (response.data.count === 1) {
      console.log(`   ✅ 정확히 1개의 이미지만 존재 (덮어쓰기 성공)`);
    } else {
      console.log(`   ❌ ${response.data.count}개의 이미지 존재 (덮어쓰기 실패)`);
    }
    console.log(`   이미지 ID: ${response.data.data[0].image_id}`);
    console.log(`   파일명: ${response.data.data[0].filename}\n`);

    // 파란색으로 변경
    console.log('4️⃣ 파란색 이미지로 덮어쓰기...');
    await axios.put(`${BASE_URL}/users/${userId}/images/profile`, {
      image_data: images.blue,
      filename: 'blue.png',
      mime_type: 'image/png',
      file_size: 95,
      storage_type: 'base64'
    });

    response = await axios.get(`${BASE_URL}/users/${userId}/images`);
    console.log(`✅ 이미지 교체 완료`);
    console.log(`   현재 이미지 수: ${response.data.count}`);
    if (response.data.count === 1) {
      console.log(`   ✅ 정확히 1개의 이미지만 존재 (덮어쓰기 성공)`);
    } else {
      console.log(`   ❌ ${response.data.count}개의 이미지 존재 (덮어쓰기 실패)`);
    }
    console.log(`   이미지 ID: ${response.data.data[0].image_id}`);
    console.log(`   파일명: ${response.data.data[0].filename}\n`);

    // URL 이미지로 변경
    console.log('5️⃣ URL 이미지로 덮어쓰기...');
    await axios.put(`${BASE_URL}/users/${userId}/images/profile`, {
      image_url: 'https://placehold.co/100x100/FF00FF/FFFFFF?text=URL',
      storage_type: 'url'
    });

    response = await axios.get(`${BASE_URL}/users/${userId}/images`);
    console.log(`✅ 이미지 교체 완료`);
    console.log(`   현재 이미지 수: ${response.data.count}`);
    if (response.data.count === 1) {
      console.log(`   ✅ 정확히 1개의 이미지만 존재 (덮어쓰기 성공)`);
    } else {
      console.log(`   ❌ ${response.data.count}개의 이미지 존재 (덮어쓰기 실패)`);
    }
    console.log(`   이미지 ID: ${response.data.data[0].image_id}`);
    console.log(`   저장 타입: ${response.data.data[0].storage_type}`);
    console.log(`   URL 존재: ${response.data.data[0].image_url ? 'YES' : 'NO'}\n`);

    // 최종 확인
    console.log('====================================');
    console.log('📊 테스트 결과 요약');
    console.log('====================================');
    if (response.data.count === 1) {
      console.log('✅ 성공: 이미지 변경 시 기존 이미지가');
      console.log('         완전히 삭제되고 새 이미지로 교체됨');
      console.log(`✅ 최종 이미지 ID: ${response.data.data[0].image_id}`);
      console.log('✅ 데이터베이스에 단 1개의 이미지만 존재');
    } else {
      console.log('❌ 실패: 이미지가 누적되고 있음');
      console.log(`❌ 현재 ${response.data.count}개의 이미지가 존재`);
    }

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.response?.data || error.message);
  }
}

// 테스트 실행
testImageOverwrite();