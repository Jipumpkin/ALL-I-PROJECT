require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./models');

const app = express();
const PORT = 3004; 

app.use(cors());
app.use(express.json());

// 실제 컨트롤러 import
const animalController = require('./controllers/animalController');

// Routes
app.get('/api/test', (req, res) => {
    res.json({ message: 'API 테스트 성공! (실제 DB 연결)' });
});

app.get('/api/animals', (req, res) => {
    console.log('🔄 동물 목록 조회 - 실제 데이터베이스 사용');
    animalController.getAnimals(req, res);
});

app.get('/api/animals/shelters', (req, res) => {
    console.log('🏠 보호소 목록 조회 - 실제 데이터베이스 사용');
    animalController.getShelters(req, res);
});

app.get('/api/animals/oldest', (req, res) => {
    console.log('⏰ 가장 오래된 동물 조회 - 실제 데이터베이스 사용');
    animalController.getOldestAnimals(req, res);
});

app.get('/api/animals/:id', (req, res) => {
    const { id } = req.params;
    console.log(`🐕 동물 상세 조회 (ID: ${id}) - 실제 데이터베이스 사용`);
    animalController.getAnimalById(req, res);
});

async function startServer() {
    try {
        console.log('🔄 데이터베이스 초기화 중...');
        await initializeDatabase();
        console.log('✅ 데이터베이스 초기화 완료!');
        
        // 테스트 데이터 추가
        await addTestData();
        
        app.listen(PORT, () => {
            console.log(`✅ 실제 DB 연결 서버가 ${PORT}번 포트에서 시작되었습니다!`);
            console.log(`🌐 서버 주소: http://localhost:${PORT}`);
            console.log('📊 실제 데이터베이스 데이터를 사용합니다.');
        });
    } catch (error) {
        console.error('❌ 서버 시작 실패:', error);
        process.exit(1);
    }
}

async function addTestData() {
    try {
        const { Animal, Shelter } = require('./models');
        
        // 테스트 보호소 추가
        const testShelter = await Shelter.create({
            shelter_name: '서울시 동물보호센터',
            email: 'seoul@shelter.com',
            contact_number: '02-1234-5678',
            address: '서울특별시 강남구',
            region: '서울특별시',
            ext_id: 'test_shelter_001'
        });
        
        // 테스트 동물 추가
        await Animal.bulkCreate([
            {
                species: '믹스견',
                gender: 'male',
                age: '2021년생',
                image_url: '/images/dog1.jpg',
                shelter_id: testShelter.shelter_id,
                status: 'available',
                region: '서울특별시',
                rescued_at: '2023-01-15',
                ext_id: 'test_animal_001',
                colorCd: '갈색',
                specialMark: '온순한 성격'
            },
            {
                species: '고양이',
                gender: 'female',
                age: '2022년생',
                image_url: '/images/cat1.jpg',
                shelter_id: testShelter.shelter_id,
                status: 'available',
                region: '서울특별시',
                rescued_at: '2023-03-10',
                ext_id: 'test_animal_002',
                colorCd: '검정색',
                specialMark: '활발한 성격'
            },
            {
                species: '진돗개',
                gender: 'male',
                age: '2020년생',
                image_url: '/images/dog2.jpg',
                shelter_id: testShelter.shelter_id,
                status: 'available',
                region: '서울특별시',
                rescued_at: '2022-12-05',
                ext_id: 'test_animal_003',
                colorCd: '흰색',
                specialMark: '충성스러운 성격'
            }
        ]);
        
        console.log('✅ 테스트 데이터 추가 완료! (보호소 1개, 동물 3마리)');
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            console.log('ℹ️ 테스트 데이터가 이미 존재합니다.');
        } else {
            console.error('❌ 테스트 데이터 추가 실패:', error);
        }
    }
}

startServer();