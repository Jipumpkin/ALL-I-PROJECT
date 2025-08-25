// server/services/animalSync.js

const https = require('https');
const url = require('url');

// Sequelize 모델들 import
async function syncAnimalData() {
  console.log('🚀 최근 한 달간의 데이터 동기화를 시작합니다...');

  // 모델 동적 import (서버 시작 후 호출되므로 models가 초기화된 상태)
  const { Animal, Shelter } = require('../models');

  const serviceKey = process.env.PUBLICDATA_API_KEY;
  if (!serviceKey) {
    throw new Error('💥 오류: PUBLICDATA_API_KEY가 설정되지 않았습니다.');
  }
  
  const today = new Date();
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setDate(today.getDate() - 30);

  const formattedStartDate = `${oneMonthAgo.getFullYear()}${String(oneMonthAgo.getMonth() + 1).padStart(2, '0')}${String(oneMonthAgo.getDate()).padStart(2, '0')}`;
  const formattedEndDate = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

  const apiUrl = 'https://apis.data.go.kr/1543061/abandonmentPublicService_v2/abandonmentPublic_v2';
  const queryParams = {
    serviceKey: serviceKey,
    _type: 'json',
    bgnde: formattedStartDate,
    endde: formattedEndDate,
    numOfRows: 1000,
    pageNo: 1,
  };

  const parsedUrl = url.parse(apiUrl);
  const pathWithQuery = `${parsedUrl.pathname}?${Object.keys(queryParams).map(key => `${key}=${encodeURIComponent(queryParams[key])}`).join('&')}`;

  const options = {
    hostname: parsedUrl.hostname,
    path: pathWithQuery,
    method: 'GET'
  };

  try {
    const data = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let rawData = '';
        res.on('data', (chunk) => rawData += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(rawData));
          } catch (e) {
            reject(new Error(`JSON 파싱 오류: ${e.message}`));
          }
        });
      });

      req.on('error', (e) => reject(new Error(`API 요청 오류: ${e.message}`)));
      req.end();
    });

    const items = data.response.body.items.item || [];
    if (items.length === 0) {
      console.log('✅ 지정된 기간의 유기동물 데이터가 없습니다.');
      return;
    }

    console.log(`✅ API에서 ${items.length}건의 데이터를 성공적으로 가져왔습니다.`);

    // Sequelize 트랜잭션 시작
    const { sequelize } = require('../models');
    const transaction = await sequelize.transaction();

    try {
      for (const item of items) {
        const genderMap = { 'M': 'male', 'F': 'female' };
        const statusMap = { '보호중': 'available' };
        const placeholderImage = '/images/unknown_animal.png';

        // 데이터 클리닝 및 유효성 검사
        const cleanedItem = {
          desertionNo: item.desertionNo,
          careRegNo: item.careRegNo,
          careNm: item.careNm ? item.careNm.trim() : '정보 없음',
          careAddr: item.careAddr ? item.careAddr.trim() : '정보 없음',
          careTel: item.careTel ? item.careTel.trim() : '정보 없음',
          upKindNm: item.upKindNm ? item.upKindNm.trim() : '기타',
          sexCd: item.sexCd,
          age: item.age ? item.age.replace('(년생)', '').trim() : '나이 미상',
          processState: item.processState,
          orgNm: item.orgNm ? item.orgNm.trim() : '지역 정보 없음',
          happenDt: item.happenDt,
          colorCd: item.colorCd ? item.colorCd.trim() : '정보 없음',
          specialMark: item.specialMark ? item.specialMark.trim() : '특이사항 없음',
          popfile1: item.popfile1 && item.popfile1.startsWith('http') ? item.popfile1 : placeholderImage,
        };

        // 보호소 데이터 준비
        const shelterData = {
          ext_id: cleanedItem.careRegNo,
          shelter_name: cleanedItem.careNm,
          address: cleanedItem.careAddr,
          contact_number: cleanedItem.careTel,
          region: cleanedItem.orgNm,
          email: null
        };

        // Sequelize를 사용하여 보호소 생성 또는 업데이트
        const { shelter } = await Shelter.upsertByExtId(shelterData, { transaction });

        // 동물 데이터 준비
        const animalData = {
          ext_id: cleanedItem.desertionNo,
          species: cleanedItem.upKindNm,
          gender: genderMap[cleanedItem.sexCd] || 'unknown',
          age: cleanedItem.age,
          status: statusMap[cleanedItem.processState] || 'available',
          region: cleanedItem.orgNm,
          rescued_at: cleanedItem.happenDt,
          colorCd: cleanedItem.colorCd,
          specialMark: cleanedItem.specialMark,
          image_url: cleanedItem.popfile1,
          shelter_id: shelter.shelter_id
        };

        // Sequelize를 사용하여 동물 생성 또는 업데이트
        await Animal.upsertByExtId(animalData, { transaction });
        
        console.log(`➡️ 동물 데이터(ext_id: ${cleanedItem.desertionNo}) 저장 완료`);
      }

      await transaction.commit();
      console.log('🎉 모든 데이터 동기화 완료!');

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('💥 동기화 중 오류 발생:', error);
    throw error;
  }
}

module.exports = { syncAnimalData };