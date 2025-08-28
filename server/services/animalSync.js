// server/services/animalSync.js

const https = require('https');
const url = require('url');
const mysql = require('mysql2/promise');
const { getPool } = require('../config/database');

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
    const pool = await getPool();
    connection = await pool.getConnection();
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
        animal_ext_id: cleanedItem.desertionNo ?? null,
        shelter_ext_id: cleanedItem.careRegNo ?? null,
        shelter_name: cleanedItem.careNm ?? '정보 없음',
        shelter_address: cleanedItem.careAddr ?? '정보 없음',
        shelter_tel: cleanedItem.careTel ?? '정보 없음',
        animal_species: cleanedItem.upKindNm ?? '기타',
        animal_gender: genderMap[cleanedItem.sexCd] || 'unknown',
        animal_age: cleanedItem.age ?? '나이 미상',
        animal_status: statusMap[cleanedItem.processState] || 'available',
        animal_region: cleanedItem.orgNm ?? '지역 정보 없음',
        animal_rescued_at: cleanedItem.happenDt ?? null,
        animal_colorCd: cleanedItem.colorCd ?? '정보 없음',
        animal_specialMark: cleanedItem.specialMark ?? '특이사항 없음',
        animal_image_url: cleanedItem.popfile1 ?? placeholderImage,
      };
    });

    for (const animal of transformedData) {
      // 값이 null 또는 undefined인 경우 삽입을 건너뜁니다.
      if (!animal.animal_ext_id || !animal.shelter_ext_id) {
        console.log('⚠️ 필수 ID (animal_ext_id 또는 shelter_ext_id)가 없어 건너뜁니다.');
        continue;
      }

      // 중복 체크 먼저 수행 (올바른 변수 사용)
      const [existingAnimal] = await connection.execute(
        'SELECT animal_id FROM animals WHERE ext_id = ?',
        [animal.animal_ext_id] // BUG FIX: animal.ext_id -> animal.animal_ext_id
      );
      
      if (existingAnimal.length > 0) {
        // 이미 존재하는 동물은 스킵
        continue;
      }

      const [shelterResult] = await connection.execute(
        `INSERT INTO shelters (shelter_name, address, region, contact_number, email, ext_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP())
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
        // BUG FIX: 행이 없을 경우에 대한 방어 코드 추가
        if (rows && rows.length > 0) {
            shelterId = rows[0].shelter_id;
        } else {
            console.error(`🚨 shelter_id를 찾을 수 없습니다. ext_id: ${animal.shelter_ext_id}`);
            continue; // 이 동물 데이터는 건너뜁니다.
        }
      }

      const [animalResult] = await connection.execute(
        `INSERT INTO animals (
          species, gender, age, image_url, shelter_id, status, region, rescued_at, ext_id, colorCd, specialMark, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP())
        ON DUPLICATE KEY UPDATE
          species = VALUES(species), gender = VALUES(gender), age = VALUES(age),
          image_url = VALUES(image_url), shelter_id = VALUES(shelter_id), status = VALUES(status),
          region = VALUES(region), rescued_at = VALUES(rescued_at), colorCd = VALUES(colorCd),
          specialMark = VALUES(specialMark), updated_at = VALUES(updated_at)`,
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
      connection.release();
      console.log('🔌 데이터베이스 연결 종료.');
    }
  }
}

module.exports = { syncAnimalData };