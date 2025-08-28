// server/scripts/manualSync.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { syncAnimalData } = require('../services/animalSync');
const { getPool } = require('../config/database');

async function runSync() {
  try {
    console.log('🚀 수동 데이터 동기화를 시작합니다...');
    // getPool을 호출하여 데이터베이스 연결을 활성화합니다.
    // syncAnimalData 내부에서도 getPool을 호출하므로, 여기서의 호출은 연결을 보장하는 역할을 합니다.
    await getPool(); 
    await syncAnimalData();
    console.log('✅ 수동 데이터 동기화가 성공적으로 완료되었습니다.');
  } catch (error) {
    console.error('💥 수동 동기화 중 심각한 오류 발생:', error);
    process.exit(1);
  } finally {
    // syncAnimalData 내부에서 연결을 해제하므로 스크립트 프로세스만 종료합니다.
    console.log('...동기화 스크립트 종료.');
    // 데이터베이스 풀을 직접 닫아주어 프로세스가 깔끔하게 종료되도록 합니다.
    const pool = await getPool();
    if (pool) {
        await pool.end();
        console.log('🔌 데이터베이스 연결 풀을 종료합니다.');
    }
    process.exit(0);
  }
}

runSync();
