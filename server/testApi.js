require('dotenv').config();
const axios = require('axios');

const KEY = process.env.PUBLICDATA_API_KEY;
const BASE = 'https://apis.data.go.kr/1543061/abandonmentPublicSrvc';

async function test() {
  try {
    console.log('Requesting API with more specific parameters...');
    const { data } = await axios.get(`${BASE}/abandonmentPublic`, {
      params: {
        serviceKey: KEY,
        _type: 'json',
        bgnde: '20240101',
        endde: '20240131',
        upkind: '417000', // 축종: 개
        state: 'notice',   // 상태: 공고중
        numOfRows: 3
      },
      timeout: 10000
    });
    console.log('API Response:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("API request failed:", error.response ? error.response.data : error.message);
  }
}

test();