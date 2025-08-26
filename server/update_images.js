const mysql = require('mysql2/promise');
require('dotenv').config();

const updateAnimalImages = async () => {
  let connection;
  
  try {
    connection = mysql.createConnection({
      host: process.env.DB_HOST || 'bgmtrhkjfutqrqfn2x5r-mysql.services.clever-cloud.com',
      user: process.env.DB_USER || 'uw1s5bbbcfgqbahh', 
      password: process.env.DB_PASSWORD || 'HXe3DT9hG7yKj2cCKgfZ',
      database: process.env.DB_NAME || 'bgmtrhkjfutqrqfn2x5r',
      port: process.env.DB_PORT || 3306,
      ssl: { rejectUnauthorized: false }
    });

    console.log('데이터베이스 연결 중...');
    
    const images = [
      '/images/hoochoo1.jpeg',
      '/images/poster1.jpg', 
      '/images/poster2.jpg',
      '/images/poster4.jpg',
      '/images/poster5.jpg',
      '/images/poster6.jpg'
    ];
    
    const [animals] = await connection.execute('SELECT animal_id FROM animals ORDER BY animal_id LIMIT 6');
    
    for (let i = 0; i < animals.length; i++) {
      const animalId = animals[i].animal_id;
      const imageUrl = images[i % images.length];
      await connection.execute('UPDATE animals SET image_url = ? WHERE animal_id = ?', [imageUrl, animalId]);
      console.log('동물', animalId, '번 이미지 업데이트:', imageUrl);
    }
    
    console.log('이미지 업데이트 완료!');
    
  } catch (error) {
    console.error('오류 발생:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

updateAnimalImages();