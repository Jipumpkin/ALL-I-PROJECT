// server/scripts/sync_data_manual.js

require('dotenv').config({ path: '../.env' }); // Load .env from server directory

const { syncAnimalData } = require('../services/animalSync');
const { initializeDatabase } = require('../models'); // Assuming initializeDatabase is needed for DB connection

async function runSync() {
    console.log('🚀 수동 데이터 동기화 스크립트 시작...');
    try {
        await initializeDatabase(); // Ensure DB connection is established
        console.log('🎉 데이터베이스 초기화 완료');
        await syncAnimalData();
        console.log('✅ 수동 데이터 동기화 완료!');
    } catch (error) {
        console.error('💥 수동 데이터 동기화 중 오류 발생:', error);
        process.exit(1);
    } finally {
        // Exit process after sync, or keep alive if needed for other operations
        process.exit(0);
    }
}

runSync();
