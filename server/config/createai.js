const OpenAI = require('openai');
require('dotenv').config();

// OpenAI 클라이언트 초기화 (더미 키 처리)
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey || apiKey === 'test-key-please-replace-with-real-openai-api-key') {
    console.warn('⚠️  OpenAI API 키가 설정되지 않았습니다. DALL-E 기능이 제한됩니다.');
    console.warn('   실제 OpenAI API 키를 .env 파일에 설정해주세요.');
}

const openai = new OpenAI({
    apiKey: apiKey || 'sk-fake-key-for-testing',
});

module.exports = openai; 