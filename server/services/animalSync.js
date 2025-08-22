// server/services/animalSync.js

const https = require('https');
const url = require('url');
const mysql = require('mysql2/promise');
const { getConnection } = require('../db/connection');

// --- API 호출 및 데이터베이스 저장 함수 ---
async function syncAnimalData() {
  console.log('🚀 최근 한 달간의 데이터 동기화를 시작합니다...');

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

  let connection;
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

    console.log('🔌 데이터베이스에 연결 중...');
    connection = await getConnection();
    console.log('✅ 데이터베이스 연결 성공!');

    await connection.beginTransaction();

    const transformedData = items.map(item => {
      const genderMap = { 'M': 'male', 'F': 'female' };
      const statusMap = { '보호중': 'available' };
      const placeholderImage = '/images/unknown_animal.png'; // 이미지 준비중 placeholder

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

      return {
        animal_ext_id: cleanedItem.desertionNo,
        shelter_ext_id: cleanedItem.careRegNo,
        shelter_name: cleanedItem.careNm,
        shelter_address: cleanedItem.careAddr,
        shelter_tel: cleanedItem.careTel,
        animal_species: cleanedItem.upKindNm,
        animal_gender: genderMap[cleanedItem.sexCd] || 'unknown',
        animal_age: cleanedItem.age,
        animal_status: statusMap[cleanedItem.processState] || 'available',
        animal_region: cleanedItem.orgNm,
        animal_rescued_at: cleanedItem.happenDt,
        animal_colorCd: cleanedItem.colorCd,
        animal_specialMark: cleanedItem.specialMark,
        animal_image_url: cleanedItem.popfile1,
      };
    });

    for (const animal of transformedData) {
      const [shelterResult] = await connection.execute(
        `INSERT INTO shelters (shelter_name, address, region, contact_number, email, ext_id)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         shelter_name=VALUES(shelter_name), address=VALUES(address), region=VALUES(region), contact_number=VALUES(contact_number)`,
        [
          animal.shelter_name,
          animal.shelter_address,
          animal.animal_region,
          animal.shelter_tel,
          null,
          animal.shelter_ext_id
        ]
      );

      let shelterId;
      if (shelterResult.insertId) {
        shelterId = shelterResult.insertId;
      } else {
        const [rows] = await connection.execute(
          'SELECT shelter_id FROM shelters WHERE ext_id = ?',
          [animal.shelter_ext_id]
        );
        shelterId = rows[0].shelter_id;
      }

      const [animalResult] = await connection.execute(
        `INSERT INTO animals (
          species, gender, age, image_url, shelter_id, status, region, rescued_at, ext_id, colorCd, specialMark
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          species = VALUES(species), gender = VALUES(gender), age = VALUES(age),
          image_url = VALUES(image_url), shelter_id = VALUES(shelter_id), status = VALUES(status),
          region = VALUES(region), rescued_at = VALUES(rescued_at), colorCd = VALUES(colorCd),
          specialMark = VALUES(specialMark)`,
        [
          animal.animal_species, animal.animal_gender, animal.animal_age, animal.animal_image_url,
          shelterId, animal.animal_status, animal.animal_region, animal.animal_rescued_at,
          animal.animal_ext_id, animal.animal_colorCd, animal.animal_specialMark
        ]
      );
      console.log(`➡️ 동물 데이터(ext_id: ${animal.animal_ext_id}) 저장 완료`);
    }

    await connection.commit();
    console.log('🎉 모든 데이터 동기화 완료!');

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('💥 동기화 중 오류 발생:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 데이터베이스 연결 종료.');
    }
  }
}

module.exports = { syncAnimalData };