// server/services/animalSync.js

const https = require('https');
const url = require('url');
const { pool } = require('../db/connection');

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

  const fmt = (n) => String(n).padStart(2, '0');
  const formattedStartDate = `${oneMonthAgo.getFullYear()}${fmt(oneMonthAgo.getMonth() + 1)}${fmt(oneMonthAgo.getDate())}`;
  const formattedEndDate   = `${today.getFullYear()}${fmt(today.getMonth() + 1)}${fmt(today.getDate())}`;

  const apiUrl = 'https://apis.data.go.kr/1543061/abandonmentPublicService_v2/abandonmentPublic_v2';
  const queryParams = {
    serviceKey,
    _type: 'json',
    bgnde: formattedStartDate,
    endde: formattedEndDate,
    numOfRows: 1000,
    pageNo: 1,
  };

  const parsedUrl = url.parse(apiUrl);
  const pathWithQuery = `${parsedUrl.pathname}?${Object.entries(queryParams)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&')}`;

  const options = {
    hostname: parsedUrl.hostname,
    path: pathWithQuery,
    method: 'GET',
  };

  let connection;
  try {
    const data = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let rawData = '';
        res.on('data', (chunk) => (rawData += chunk));
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

    const items = data?.response?.body?.items?.item || [];
    if (items.length === 0) {
      console.log('✅ 지정된 기간의 유기동물 데이터가 없습니다.');
      return;
    }

    console.log(`✅ API에서 ${items.length}건의 데이터를 성공적으로 가져왔습니다.`);
    console.log('🔌 데이터베이스에 연결 중...');
        connection = await pool.getConnection();
    console.log('✅ 데이터베이스 연결 성공!');

    await connection.beginTransaction();

    const transformedData = items.map((item) => {
      const genderMap = { M: 'male', F: 'female' };
      const statusMap = { 보호중: 'available' };
      const placeholderImage = '/images/unknown_animal.png';

      const cleanedItem = {
        desertionNo: item.desertionNo,
        careRegNo: item.careRegNo,
        careNm: (item.careNm || '정보 없음').trim?.() ?? '정보 없음',
        careAddr: (item.careAddr || '정보 없음').trim?.() ?? '정보 없음',
        careTel: (item.careTel || '정보 없음').trim?.() ?? '정보 없음',
        upKindNm: (item.upKindNm || '기타').trim?.() ?? '기타',
        sexCd: item.sexCd,
        age: item.age ? item.age.replace('(년생)', '').trim() : '나이 미상',
        processState: item.processState,
        orgNm: (item.orgNm || '지역 정보 없음').trim?.() ?? '지역 정보 없음',
        happenDt: item.happenDt,
        colorCd: (item.colorCd || '정보 없음').trim?.() ?? '정보 없음',
        specialMark: (item.specialMark || '특이사항 없음').trim?.() ?? '특이사항 없음',
        // v2 스펙에서 이미지 키가 popfile인 경우도 있어 대비
        popfile1:
          (item.popfile1 && String(item.popfile1).startsWith('http') && item.popfile1) ||
          (item.popfile && String(item.popfile).startsWith('http') && item.popfile) ||
          placeholderImage,
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
      // 중복 체크 (ext_id 기준)
      const [existingAnimal] = await connection.execute(
        'SELECT animal_id FROM animals WHERE ext_id = ?',
        [animal.animal_ext_id]
      );
      if (existingAnimal.length > 0) {
        continue; // 이미 존재하면 스킵
      }

      // 보호소 upsert
      const [shelterResult] = await connection.execute(
        `INSERT INTO shelters (shelter_name, address, region, contact_number, email, ext_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP())
         ON DUPLICATE KEY UPDATE
           shelter_name=VALUES(shelter_name),
           address=VALUES(address),
           region=VALUES(region),
           contact_number=VALUES(contact_number)`,
        [
          animal.shelter_name,
          animal.shelter_address,
          animal.animal_region,
          animal.shelter_tel,
          null,
          animal.shelter_ext_id,
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
        shelterId = rows[0]?.shelter_id;
      }

      // 동물 upsert
      await connection.execute(
        `INSERT INTO animals (
          species, gender, age, image_url, shelter_id, status, region, rescued_at, ext_id, colorCd, specialMark, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP())
        ON DUPLICATE KEY UPDATE
          species = VALUES(species),
          gender = VALUES(gender),
          age = VALUES(age),
          image_url = VALUES(image_url),
          shelter_id = VALUES(shelter_id),
          status = VALUES(status),
          region = VALUES(region),
          rescued_at = VALUES(rescued_at),
          colorCd = VALUES(colorCd),
          specialMark = VALUES(specialMark),
          updated_at = CURRENT_TIMESTAMP()`,
        [
          animal.animal_species,
          animal.animal_gender,
          animal.animal_age,
          animal.animal_image_url,
          shelterId,
          animal.animal_status,
          animal.animal_region,
          animal.animal_rescued_at,
          animal.animal_ext_id,
          animal.animal_colorCd,
          animal.animal_specialMark,
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