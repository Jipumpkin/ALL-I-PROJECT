require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3003; 

app.use(cors());
app.use(express.json());

// Mock 동물 데이터
const mockAnimals = [
    {
        animal_id: 1,
        species: '믹스견',
        age: 2021,
        gender: 'male',
        region: '서울특별시',
        image_url: '/images/dog1.jpg',
        shelter_id: 1,
        rescued_at: '2023-01-15',
        status: 'available'
    },
    {
        animal_id: 2,
        species: '고양이',
        age: 2022,
        gender: 'female',
        region: '부산광역시',
        image_url: '/images/cat1.jpg',
        shelter_id: 2,
        rescued_at: '2023-03-10',
        status: 'available'
    }
];

const mockShelters = [
    {
        shelter_id: 1,
        shelter_name: '서울시 동물보호센터'
    },
    {
        shelter_id: 2,
        shelter_name: '부산시 동물보호센터'
    }
];

// Routes
app.get('/api/test', (req, res) => {
    res.json({ message: 'API 테스트 성공!' });
});

app.get('/api/animals', (req, res) => {
    console.log('🔄 동물 목록 조회 - Mock 데이터 사용');
    res.json({ animals: mockAnimals, totalPages: 1 });
});

app.get('/api/animals/shelters', (req, res) => {
    console.log('🏠 보호소 목록 조회 - Mock 데이터 사용');
    res.json(mockShelters);
});

app.get('/api/animals/:id', (req, res) => {
    const { id } = req.params;
    console.log(`🐕 동물 상세 조회 (ID: ${id}) - Mock 데이터 사용`);
    
    const animal = mockAnimals.find(a => a.animal_id === parseInt(id));
    if (!animal) {
        return res.status(404).json({ error: 'Animal not found' });
    }
    res.json(animal);
});

app.listen(PORT, () => {
    console.log(`✅ 테스트 서버가 ${PORT}번 포트에서 시작되었습니다!`);
    console.log(`🌐 서버 주소: http://localhost:${PORT}`);
});