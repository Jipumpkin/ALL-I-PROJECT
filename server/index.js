// server/index.js

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const { syncAnimalData } = require('./services/animalSync'); // services 파일의 함수를 불러옵니다.

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/animals', require('./routes/animalRoutes'));
app.use('/api/shelters', require('./routes/shelterRoutes'));

app.get('/', (req, res) => {
    res.json({ message: 'ALL-I-PROJECT Backend Server Running' });
});

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    
    // 🚀 서버 시작과 동시에 데이터 동기화 함수를 호출합니다.
    try {
        await syncAnimalData();
    } catch (err) {
        console.error('💥 초기 데이터 동기화 실패:', err);
    }
});