const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Base URL for the server
const BASE_URL = 'http://localhost:3003/api';

// Create a sample Base64 image (small 1x1 pixel PNG)
const sampleImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function testImageRegistration() {
  console.log('🚀 이미지 업로드를 포함한 회원가입 테스트 시작...\n');

  try {
    // 1단계: 새 사용자 회원가입
    console.log('1️⃣ 새 사용자 회원가입 중...');
    const registrationData = {
      username: `testuser_${Date.now()}`,
      password: 'TestPassword123!',
      email: `testuser_${Date.now()}@example.com`,
      nickname: '테스트유저',
      gender: 'male',
      phone_number: '010-1234-5678'
    };

    const registerResponse = await axios.post(`${BASE_URL}/register`, registrationData);
    
    if (registerResponse.data.success) {
      console.log('✅ 회원가입 성공!');
      console.log(`   사용자 ID: ${registerResponse.data.user.id}`);
      console.log(`   사용자명: ${registerResponse.data.user.username}`);
      console.log(`   이메일: ${registerResponse.data.user.email}\n`);

      const userId = registerResponse.data.user.id;

      // 2단계: 프로필 이미지 업로드 (Base64)
      console.log('2️⃣ 프로필 이미지 업로드 중 (Base64)...');
      const imageUploadData = {
        image_data: sampleImageBase64,
        filename: 'profile.png',
        mime_type: 'image/png',
        file_size: 95, // approximate size of the base64 image
        storage_type: 'base64'
      };

      const imageResponse = await axios.post(
        `${BASE_URL}/users/${userId}/images`, 
        imageUploadData
      );

      if (imageResponse.data.success) {
        console.log('✅ 프로필 이미지 업로드 성공!');
        console.log(`   이미지 ID: ${imageResponse.data.image.image_id}`);
        console.log(`   저장 타입: ${imageResponse.data.image.storage_type}`);
        console.log(`   파일명: ${imageResponse.data.image.filename}\n`);
      } else {
        console.log('❌ 프로필 이미지 업로드 실패:', imageResponse.data.message);
      }

      // 3단계: 기본 이미지 URL도 추가 (기존 로직 호환성)
      console.log('3️⃣ 기본 이미지 URL 추가 중...');
      const defaultImageData = {
        image_url: 'https://placehold.co/400x400/FF5733/FFFFFF?text=User+House+Image',
        storage_type: 'url'
      };

      const defaultImageResponse = await axios.post(
        `${BASE_URL}/users/${userId}/images`,
        defaultImageData
      );

      if (defaultImageResponse.data.success) {
        console.log('✅ 기본 이미지 URL 추가 성공!');
        console.log(`   이미지 ID: ${defaultImageResponse.data.image.image_id}`);
        console.log(`   저장 타입: ${defaultImageResponse.data.image.storage_type}\n`);
      }

      // 4단계: 사용자 이미지 조회 테스트
      console.log('4️⃣ 사용자 이미지 조회 테스트...');
      const imagesResponse = await axios.get(`${BASE_URL}/users/${userId}/images`);

      if (imagesResponse.data.success) {
        console.log('✅ 이미지 조회 성공!');
        console.log(`   총 이미지 수: ${imagesResponse.data.count}`);
        imagesResponse.data.data.forEach((image, index) => {
          console.log(`   이미지 ${index + 1}:`);
          console.log(`     - ID: ${image.image_id}`);
          console.log(`     - 저장 타입: ${image.storage_type}`);
          console.log(`     - 파일명: ${image.filename || 'N/A'}`);
          console.log(`     - MIME 타입: ${image.mime_type || 'N/A'}`);
          console.log(`     - 파일 크기: ${image.file_size || 'N/A'} bytes`);
          console.log(`     - 업로드 시간: ${image.uploaded_at}`);
        });
      } else {
        console.log('❌ 이미지 조회 실패:', imagesResponse.data.message);
      }

      console.log('\n🎉 모든 테스트 완료!');

    } else {
      console.log('❌ 회원가입 실패:', registerResponse.data.message);
    }

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.response?.data || error.message);
  }
}

// 테스트 실행
testImageRegistration();