// search.js

const mysql = require('mysql2/promise');

// --- 환경 변수 로드 ---
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT, 10),
};

// --- 검색 함수 ---
async function searchAnimals(args) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    const whereClauses = [];
    const queryParams = [];

    // --- 검색 및 필터링 조건 ---
    if (args.species) {
      whereClauses.push('species LIKE ?');
      queryParams.push(`%${args.species}%`);
    }
    if (args.gender) {
      whereClauses.push('gender = ?');
      queryParams.push(args.gender);
    }
    if (args.age) {
      whereClauses.push('age LIKE ?');
      queryParams.push(`%${args.age}%`);
    }
    if (args.color) {
      whereClauses.push('colorCd LIKE ?');
      queryParams.push(`%${args.color}%`);
    }
    
    let whereQuery = whereClauses.length > 0 ? `WHERE ` + whereClauses.join(' AND ') : '';

    const query = `
      SELECT animal_id, species, gender, age, region, image_url, colorCd
      FROM animals 
      ${whereQuery}
      ORDER BY rescued_at DESC`;

    // 쿼리에 ?가 없는 경우 파라미터 배열을 비워둡니다.
    const finalParams = whereClauses.length > 0 ? queryParams : [];

    // 실행 직전, 쿼리와 파라미터를 콘솔에 출력하여 확인합니다.
    console.log('--- 디버깅 정보 ---');
    console.log('최종 쿼리:', query);
    console.log('최종 파라미터:', finalParams);
    console.log('--------------------');
    
    const [rows] = await connection.execute(query, finalParams);

    if (rows.length === 0) {
      console.log(`❌ 검색 결과가 없습니다.`);
    } else {
      console.log(`✅ 검색 결과 (${rows.length}개):`);
      rows.forEach(animal => {
        console.log(`- ID: ${animal.animal_id}, 종: ${animal.species}, 성별: ${animal.gender}, 출생년도: ${animal.age}, 지역: ${animal.region}, 색상: ${animal.colorCd}`);
      });
    }
  } catch (error) {
      console.error('💥 쿼리 실행 중 오류 발생:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// --- 스크립트 실행 ---
const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
    const key = process.argv[i].replace('--', '');
    const value = process.argv[i+1];
    args[key] = value;
}
searchAnimals(args);