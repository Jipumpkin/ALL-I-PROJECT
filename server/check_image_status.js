require('dotenv').config();
const { pool } = require('./db/connection');

(async () => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query('SELECT COUNT(*) as total, image_url FROM animals GROUP BY image_url ORDER BY total DESC LIMIT 5');
    console.log('📊 이미지 URL 분포:');
    rows.forEach(row => {
      console.log(`   ${row.total}개: ${row.image_url}`);
    });
    
    const [validImages] = await conn.query('SELECT COUNT(*) as count FROM animals WHERE image_url LIKE "http%"');
    const [totalAnimals] = await conn.query('SELECT COUNT(*) as count FROM animals');
    console.log(`\n✅ 유효한 이미지: ${validImages[0].count}개`);
    console.log(`❌ 전체 동물: ${totalAnimals[0].count}개`);
    console.log(`📈 유효 이미지 비율: ${((validImages[0].count / totalAnimals[0].count) * 100).toFixed(1)}%`);
  } finally {
    conn.release();
  }
})();