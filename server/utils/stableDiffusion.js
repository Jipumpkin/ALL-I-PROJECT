// AI 이미지 생성 유틸리티 (여러 서비스 지원)
const { HfInference } = require('@huggingface/inference');
const axios = require('axios');

// Hugging Face 클라이언트 초기화
const hf = new HfInference(process.env.HUGGING_FACE_API_KEY);

// 무료로 사용할 수 있는 Stable Diffusion 모델들
const MODELS = {
    // 가장 인기있는 무료 모델
    stable_diffusion: "stabilityai/stable-diffusion-2-1",
    // 더 빠른 속도의 모델
    stable_diffusion_xl: "stabilityai/stable-diffusion-xl-base-1.0",
    // 애니메이션 스타일에 특화된 모델
    anime_style: "Linaqruf/anything-v3.0",
    // 사실적인 이미지에 특화된 모델
    realistic: "runwayml/stable-diffusion-v1-5"
};

/**
 * 무료 AI 이미지 생성 (Pollinations AI 사용)
 * @param {string} prompt - 이미지 생성 프롬프트 (영어)
 * @param {Object} options - 생성 옵션
 * @returns {Promise<Buffer>} 생성된 이미지 Buffer
 */
async function generateImage(prompt, options = {}) {
    try {
        console.log('🎨 Pollinations AI 이미지 생성 시작...');
        console.log('📝 프롬프트:', prompt);

        const {
            width = 512,
            height = 512,
            model = 'flux',
            seed = Math.floor(Math.random() * 1000000),
            enhance = 'true'
        } = options;

        // Pollinations AI 무료 서비스 사용
        const pollinations_url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&model=${model}&seed=${seed}&enhance=${enhance}&nologo=true`;
        
        console.log('🌐 Pollinations AI URL:', pollinations_url);
        
        const response = await axios.get(pollinations_url, {
            responseType: 'arraybuffer',
            timeout: 30000, // 30초 타임아웃
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (response.status === 200 && response.data) {
            console.log('✅ Pollinations AI 이미지 생성 완료!');
            return Buffer.from(response.data);
        } else {
            throw new Error(`Pollinations API 응답 오류: ${response.status}`);
        }

    } catch (error) {
        console.error('❌ Pollinations AI 이미지 생성 실패:', error.message);
        
        // 폴백: 다른 무료 서비스 시도 (Hugging Face Inference API)
        try {
            console.log('🔄 Hugging Face 무료 서비스로 폴백 시도...');
            
            const fallbackPrompt = prompt.length > 77 ? prompt.substring(0, 77) : prompt;
            const response = await hf.textToImage({
                model: 'runwayml/stable-diffusion-v1-5',
                inputs: fallbackPrompt,
                parameters: {
                    num_inference_steps: 20,
                    guidance_scale: 7.5
                }
            });
            
            console.log('✅ Hugging Face 폴백 성공!');
            return response;
            
        } catch (fallbackError) {
            console.error('❌ Hugging Face 폴백도 실패:', fallbackError.message);
            throw new Error(`모든 이미지 생성 서비스 실패: ${error.message}`);
        }
    }
}

/**
 * 케어 게임용 프롬프트 생성
 * @param {Object} animalData - 동물 데이터
 * @param {string} careActivity - 케어 활동 (씻기기, 밥주기, 미용하기, 산책하기)
 * @param {Object} careStats - 케어 스탯
 * @param {string} animalMood - 동물 기분
 * @returns {string} 영어 프롬프트
 */
function generateCarePrompt(animalData, careActivity, careStats, animalMood) {
    // 동물 종류 매핑
    const speciesMap = {
        '개': 'cute dog',
        '고양이': 'adorable cat',
        '기타': 'cute pet animal'
    };

    // 케어 활동별 프롬프트
    const carePrompts = {
        '씻기기': {
            scene: 'taking a warm bath, soap bubbles around, clean and fluffy fur',
            mood: 'happy and content after bath, sparkling clean',
            setting: 'cozy bathroom with warm lighting'
        },
        '밥주기': {
            scene: 'eating delicious food from a bowl, visibly plump and chubby, round belly clearly visible, satisfied expression',
            mood: 'well-fed and content, noticeably fuller body, chubby cheeks, sleepy satisfied look from being overfed',
            setting: 'warm kitchen with empty food bowl, showing weight gain transformation'
        },
        '미용하기': {
            scene: 'professionally groomed, perfectly styled fur, wearing cute accessories',
            mood: 'elegant and confident, beautiful and stylish',
            setting: 'pet salon or grooming area with professional lighting'
        },
        '산책하기': {
            scene: 'running happily in a sunny park, energetic movement',
            mood: 'joyful and energetic, tail wagging, eyes full of excitement',
            setting: 'beautiful park with green grass and flowers'
        }
    };

    const species = speciesMap[animalData.species] || 'cute pet';
    const careConfig = carePrompts[careActivity] || carePrompts['씻기기'];
    
    // 기분에 따른 추가 설명
    const moodDescriptions = {
        'beautiful': 'extremely happy and radiant, glowing with health',
        'clean': 'content and well-cared for, peaceful',
        'happy': 'joyful and playful, bright expression',
        'normal': 'calm and comfortable',
        'dirty': 'getting better care, improving condition'
    };

    const moodDesc = moodDescriptions[animalMood] || 'happy and healthy';

    // 케어별 구체적인 신체 변화 추가
    let physicalChange = '';
    if (careActivity === '밥주기') {
        physicalChange = ', noticeably chubby and plump, round belly, fuller face, visibly gained weight, satisfied and sleepy expression';
    } else if (careActivity === '씻기기') {
        physicalChange = ', sparkling clean fur, fluffy and soft texture, bright and refreshed appearance';
    } else if (careActivity === '미용하기') {
        physicalChange = ', perfectly groomed coat, neat and styled fur, elegant posture, wearing cute accessories';
    } else if (careActivity === '산책하기') {
        physicalChange = ', muscular and fit body, energetic posture, bright eyes full of vitality';
    }

    // 최종 프롬프트 조합 (더 구체적인 신체 변화 포함)
    const prompt = `A ${species} ${careConfig.scene}${physicalChange}, ${careConfig.mood}, ${moodDesc}, ${careConfig.setting}, photorealistic, high quality, detailed, warm lighting, heartwarming scene, professional pet photography style`;

    return prompt;
}

/**
 * 이미지를 파일로 저장
 * @param {Buffer} imageBuffer - 이미지 버퍼
 * @param {string} filename - 저장할 파일명
 * @returns {Promise<string>} 저장된 파일 경로
 */
async function saveImage(imageBuffer, filename) {
    const fs = require('fs').promises;
    const path = require('path');
    
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    
    // uploads 디렉토리 확인 및 생성
    try {
        await fs.access(uploadsDir);
    } catch {
        await fs.mkdir(uploadsDir, { recursive: true });
    }
    
    const filePath = path.join(uploadsDir, filename);
    await fs.writeFile(filePath, imageBuffer);
    
    return `/uploads/${filename}`;
}

module.exports = {
    generateImage,
    generateCarePrompt,
    saveImage,
    MODELS
};