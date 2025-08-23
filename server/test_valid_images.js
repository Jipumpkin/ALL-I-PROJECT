require('dotenv').config();
const { pool } = require('./db/connection');

(async () => {
  const conn = await pool.getConnection();
  try {
    console.log('📊 유효한 이미지를 가진 동물들 확인:');
    
    // 유효한 이미지 URL을 가진 동물 5개 조회
    const [rows] = await conn.query(`
      SELECT animal_id, species, image_url, created_at 
      FROM animals 
      WHERE image_url LIKE 'http%' 
      ORDER BY rescued_at DESC 
      LIMIT 5
    `);
    
    rows.forEach((animal, idx) => {
      console.log(`${idx + 1}. ID: ${animal.animal_id}`);
      console.log(`   종류: ${animal.species}`);
      console.log(`   이미지: ${animal.image_url}`);
      console.log(`   생성: ${animal.created_at}`);
      console.log('---');
    });
    
    if (rows.length === 0) {
      console.log('❌ 유효한 이미지를 가진 동물이 없습니다!');
    } else {
      console.log(`✅ 총 ${rows.length}개의 유효한 이미지 발견`);
    }
  } finally {
    conn.release();
  }
})();