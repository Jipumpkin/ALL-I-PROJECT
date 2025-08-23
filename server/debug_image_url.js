const testUrl = 'http://openapi.animal.go.kr/openapi/service/rest/fileDownloadSrvc/files/shelter/2025/08/202508231108175.jpg';
const placeholderImage = '/images/unknown_animal.png';

console.log('테스트 URL:', testUrl);
console.log('URL 존재 여부:', !!testUrl);
console.log('HTTP로 시작하는지:', testUrl.startsWith('http'));
console.log('조건 결과:', testUrl && testUrl.startsWith('http') ? testUrl : placeholderImage);

// null이나 undefined인 경우 테스트
const nullUrl = null;
console.log('\n--- null URL 테스트 ---');
console.log('null URL:', nullUrl);
console.log('조건 결과:', nullUrl && nullUrl.startsWith('http') ? nullUrl : placeholderImage);

// 빈 문자열인 경우 테스트  
const emptyUrl = '';
console.log('\n--- 빈 문자열 URL 테스트 ---');
console.log('빈 URL:', emptyUrl);
console.log('조건 결과:', emptyUrl && emptyUrl.startsWith('http') ? emptyUrl : placeholderImage);