require('dotenv').config();
const https = require('https');
const url = require('url');

const serviceKey = process.env.PUBLICDATA_API_KEY;
const today = new Date();
const oneWeekAgo = new Date(today);
oneWeekAgo.setDate(today.getDate() - 7);

const formattedStartDate = `${oneWeekAgo.getFullYear()}${String(oneWeekAgo.getMonth() + 1).padStart(2, '0')}${String(oneWeekAgo.getDate()).padStart(2, '0')}`;
const formattedEndDate = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

const apiUrl = 'https://apis.data.go.kr/1543061/abandonmentPublicService_v2/abandonmentPublic_v2';
const queryParams = {
  serviceKey: serviceKey,
  _type: 'json',
  bgnde: formattedStartDate,
  endde: formattedEndDate,
  numOfRows: 3,
  pageNo: 1,
};

const parsedUrl = url.parse(apiUrl);
const pathWithQuery = `${parsedUrl.pathname}?${Object.keys(queryParams).map(key => `${key}=${encodeURIComponent(queryParams[key])}`).join('&')}`;

const options = {
  hostname: parsedUrl.hostname,
  path: pathWithQuery,
  method: 'GET'
};

const req = https.request(options, (res) => {
  let rawData = '';
  res.on('data', (chunk) => rawData += chunk);
  res.on('end', () => {
    try {
      const data = JSON.parse(rawData);
      const items = data.response.body.items.item || [];
      console.log('📊 API에서 가져온 샘플 데이터:');
      items.slice(0, 3).forEach((item, idx) => {
        console.log(`${idx + 1}. 동물 ID: ${item.desertionNo}`);
        console.log(`   이미지 URL: ${item.popfile1}`);
        console.log(`   종류: ${item.upKindNm}`);
        console.log(`   상태: ${item.processState}`);
        console.log(`   이미지 URL 유효성: ${item.popfile1 && item.popfile1.startsWith('http') ? '✅ 유효' : '❌ 무효'}`);
        console.log('---');
      });
    } catch (e) {
      console.error('JSON 파싱 오류:', e.message);
    }
  });
});

req.on('error', (e) => console.error('API 요청 오류:', e.message));
req.end();