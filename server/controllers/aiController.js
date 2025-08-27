const openai = require('../config/createai');
const User = require('../models/User');
const Animal = require('../models/Animal');
const db = require('../config/database');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');



const aiController = {
    generateAiImage: async (req, res) => {
        let promptId = null;
        
        try {
            console.log('🤖 실제 AI 이미지 생성 시작...');
            
            // 입력 검증
            const { animal_id, user_id, style, extraImageUrl, extraImageBase64 } = req.body;
            
            if (!animal_id || !user_id || !style || !extraImageUrl) {
                return res.status(400).json({ 
                    error: '필수 파라미터가 누락되었습니다.',
                    required: ['animal_id', 'user_id', 'style', 'extraImageUrl']
                });
            }

            // 동물 이미지 가져오기
            const animal = await Animal.findById(animal_id);
            if (!animal || !animal.image_url) {
                return res.status(404).json({ error: '동물 정보를 찾을 수 없습니다.'});
            }
            const animalImageUrl = animal.image_url;

            // 사용자 이미지 처리
            let userImageUrl;
            
            if (extraImageUrl === "registered") {
                const user = await User.findById(user_id);
                if (!user || !user.image_url) {
                    return res.status(404).json({ error: "사용자 이미지를 찾을 수 없습니다."});
                }
                userImageUrl = user.image_url;
                
            } else if (extraImageUrl === "default") {
                userImageUrl = `${req.protocol}://${req.get("host")}/images/default_home.png`;
                
            } else if (extraImageUrl === "new" && extraImageBase64) {
                try {
                    // Base64 검증 및 파일 타입 확인
                    const base64Regex = /^data:image\/(png|jpeg|jpg);base64,/;
                    if (!base64Regex.test(extraImageBase64)) {
                        return res.status(400).json({ error: "지원하지 않는 이미지 형식입니다. PNG, JPEG만 가능합니다." });
                    }

                    // 파일 크기 제한 (5MB)
                    const base64Data = extraImageBase64.split(',')[1];
                    const buffer = Buffer.from(base64Data, 'base64');
                    if (buffer.length > 5 * 1024 * 1024) {
                        return res.status(400).json({ error: "이미지 크기는 5MB를 초과할 수 없습니다." });
                    }

                    // 안전한 파일명 생성
                    const fileExtension = extraImageBase64.includes('data:image/png') ? 'png' : 'jpg';
                    const fileName = `${crypto.randomUUID()}.${fileExtension}`;
                    const uploadsDir = path.join(__dirname, "../uploads");
                    
                    // uploads 디렉토리 확인 및 생성
                    try {
                        await fs.access(uploadsDir);
                    } catch {
                        await fs.mkdir(uploadsDir, { recursive: true });
                    }
                    
                    const savePath = path.join(uploadsDir, fileName);
                    await fs.writeFile(savePath, buffer);
                    userImageUrl = `${req.protocol}://${req.get("host")}/uploads/${fileName}`;
                    
                } catch (fileError) {
                    console.error('파일 저장 오류:', fileError);
                    return res.status(500).json({ error: "이미지 저장 중 오류가 발생했습니다." });
                }
            } else {
                return res.status(400).json({ 
                    error: "이미지 소스 선택이 잘못되었습니다.",
                    allowed: ['registered', 'default', 'new']
                });
            }

            // 스타일 프롬프트 설정
            const stylePrompts = {
                "bath": "A heartwarming scene of a pet being gently bathed, warm lighting, realistic style, cozy bathroom setting",
                "meal": "A delightful scene of a pet enjoying a meal, comfortable and warm atmosphere, realistic style, cozy dining area",
                "styling": "A charming scene of a pet being groomed and wearing cute clothes, bright and realistic style, professional pet salon setting"
            };
            
            const promptTemplate = stylePrompts[style];
            if (!promptTemplate) {
                return res.status(400).json({ 
                    error: "지원하지 않는 스타일입니다.",
                    allowed: Object.keys(stylePrompts)
                });
            }

            // GPT를 이용한 DALL-E 프롬프트 생성
            console.log('🧠 GPT로 DALL-E 프롬프트 생성 중...');
            const promptResponse = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "You are a DALL-E prompt expert. Create high-quality English prompts that DALL-E can understand well. Focus on creating realistic, heartwarming scenes that combine the pet and home environment naturally."
                    },
                    {
                        role: "user",
                        content: `Create a DALL-E prompt for: ${promptTemplate}. 
                        
Animal details:
- Species: ${animal.species}
- Gender: ${animal.gender} 
- Age: ${animal.age}
- Color/Description: ${animal.colorCd || 'not specified'}
- Special marks: ${animal.specialMark || 'none'}

The scene should naturally combine this rescued ${animal.species} with a loving home environment. Make it photorealistic and emotionally appealing, incorporating the animal's specific characteristics.`
                    }
                ],
                max_tokens: 150,
                temperature: 0.7
            });

            if (!promptResponse.choices?.[0]?.message?.content) {
                throw new Error('GPT 응답이 올바르지 않습니다.');
            }

            const dallePrompt = promptResponse.choices[0].message.content;

            // 프롬프트 저장
            const [promptResult] = await db.execute(
                'INSERT INTO prompts (user_id, original_prompt, final_prompt, animal_id, created_at) VALUES (?, ?, ?, ?, NOW())',
                [user_id, promptTemplate, dallePrompt, animal_id]
            );
            promptId = promptResult.insertId;

            // DALL-E로 이미지 생성
            console.log('🎨 DALL-E로 이미지 생성 중...');
            const imageResponse = await openai.images.generate({
                model: "dall-e-3",
                prompt: dallePrompt,
                size: "1024x1024",
                quality: "standard",
                n: 1
            });

            if (!imageResponse.data?.[0]?.url) {
                throw new Error('DALL-E 이미지 생성에 실패했습니다.');
            }

            const generatedImageUrl = imageResponse.data[0].url;

            // 생성된 이미지 정보 저장
            await db.execute(
                'INSERT INTO generated_images (user_id, prompt_id, image_url, created_at) VALUES (?, ?, ?, NOW())',
                [user_id, promptId, generatedImageUrl]
            );

            // 성공 응답
            console.log('🎉 실제 AI 이미지 생성 완료!');
            res.json({ 
                success: true,
                imageUrl: generatedImageUrl,
                promptId: promptId,
                usedPrompt: dallePrompt,
                mock: false,
                animalInfo: {
                    species: animal.species,
                    gender: animal.gender,
                    age: animal.age,
                    originalImageUrl: animalImageUrl,
                    colorCd: animal.colorCd,
                    specialMark: animal.specialMark
                },
                userImageUrl: userImageUrl,
                style: style
            });

        } catch (error) {
            console.error('AI 이미지 생성 오류:', error);
            
            // 에러 타입에 따른 구체적인 응답
            if (error.code === 'insufficient_quota') {
                return res.status(402).json({ error: 'OpenAI API 할당량이 부족합니다.' });
            } else if (error.code === 'content_policy_violation') {
                return res.status(400).json({ error: '콘텐츠 정책 위반: 부적절한 내용이 감지되었습니다.' });
            } else if (error.message?.includes('timeout')) {
                return res.status(408).json({ error: '요청 시간이 초과되었습니다. 다시 시도해주세요.' });
            }
            
            res.status(500).json({ 
                error: "이미지 생성 중 오류가 발생했습니다.",
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // 케어 게임용 이미지 생성
    generateCareImage: async (req, res) => {
        try {
            console.log('🎮 케어 게임 이미지 생성 시작...');
            
            // OpenAI API 키 확인
            const apiKey = process.env.OPENAI_API_KEY;
            if (!apiKey || apiKey === 'test-key-please-replace-with-real-openai-api-key') {
                return res.status(501).json({
                    success: false,
                    error: 'OpenAI API 키가 설정되지 않았습니다. 관리자에게 문의하세요.',
                    mock: true
                });
            }
            
            // 입력 검증
            const { animalData, careActivity, careStats, animalMood, completedTasks } = req.body;
            
            if (!animalData || !careActivity) {
                return res.status(400).json({ 
                    error: '필수 파라미터가 누락되었습니다.',
                    required: ['animalData', 'careActivity']
                });
            }

            // 케어 활동별 프롬프트 템플릿 (더 구체적이고 정확한 변화)
            const carePrompts = {
                '씻기기': {
                    action: 'freshly bathed and sparkling clean, fur soft, fluffy, and gleaming with cleanliness',
                    mood: '목욕 후 털이 보송보송해지고 피부가 건강해진 상태로, 만족스럽게 웃으며 꼬리를 살랑살랑 흔들고 밝고 신뢰하는 눈빛',
                    scene: 'digital art illustration style, cozy bathroom with soft misty steam and soap bubbles floating around',
                    visualChange: 'tiny water droplets catching the light on clean fur, wearing a small fluffy towel or cute bow, bright and cheerful atmosphere, smiling contentedly',
                    artStyle: 'digital art illustration, bright and cheerful style with sparkling effects'
                },
                '밥주기': {
                    action: 'well-fed, plump, and healthy-looking with a satisfied, almost sleepy expression and full belly',
                    mood: '영양가 있는 사료를 충분히 먹고 배가 든든해진 상태로, 만족스럽고 나른한 표정을 지으며 포만감에 행복해하는 모습',
                    scene: 'professional photograph with warm and soft lighting, creating cozy atmosphere',
                    visualChange: 'plump and healthy appearance with full belly, clean food bowl or half-eaten treat nearby, satisfied and content expression',
                    artStyle: 'professional photograph, warm and soft lighting highlighting plumpness and contentment'
                },
                '미용하기': {
                    action: 'beautifully groomed with perfectly trimmed and styled coat, reflecting luxurious well-cared-for appearance',
                    mood: '전문적인 그루밍을 받고 완벽하게 다듬어진 털과 우아한 자세로, 자신감 있고 품격 있는 모습을 보이며 스타일리시한 액세서리로 포인트',
                    scene: 'highly detailed cinematic portrait in clean minimalist studio setting with soft professional lighting',
                    visualChange: 'perfectly trimmed and styled coat, elegant posture, wearing stylish bandana collar or hair accessory, luxurious appearance',
                    artStyle: 'highly detailed cinematic portrait, professional studio photography style'
                }
            };
            
            // 산책하기는 별도 추가 (4가지 케어 중 하나가 아님)
            if (careActivity === '산책하기' || careActivity === 'walk') {
                carePrompts['산책하기'] = {
                    action: 'energetic and happy, running playfully through sunlit field of flowers with ears or tail in motion',
                    mood: '신나게 뛰어놀며 활기차고 행복한 모습으로, 눈에는 기쁨과 흥분이 가득하며 자유롭게 달리는 모습',
                    scene: 'vibrant painterly style action shot in sunlit field with flowers and trees casting long shadows',
                    visualChange: 'ears or tail in motion showing movement, eyes full of joy and excitement, sunlight streaming through trees creating warmth and adventure',
                    artStyle: 'vibrant painterly style, action shot with warm sunlight and sense of adventure'
                };
            }

            const promptConfig = carePrompts[careActivity];
            if (!promptConfig) {
                return res.status(400).json({ 
                    error: '지원하지 않는 케어 활동입니다.',
                    allowed: Object.keys(carePrompts)
                });
            }

            // 스탯 기반 추가 설명
            const statsDescription = [];
            if (careStats.cleanliness > 80) statsDescription.push('매우 깨끗하고');
            if (careStats.hunger > 80) statsDescription.push('만족스럽게 배부른');
            if (careStats.beauty > 80) statsDescription.push('아름답게 단정한');
            if (careStats.energy > 80) statsDescription.push('활기찬');
            
            const moodDescription = animalMood === 'beautiful' ? 'extremely happy and radiant' :
                                   animalMood === 'clean' ? 'content and satisfied' :
                                   animalMood === 'happy' ? 'joyful and playful' : 'calm and peaceful';

            // GPT를 이용한 DALL-E 프롬프트 생성
            console.log('🧠 케어 게임 DALL-E 프롬프트 생성 중...');
            const promptResponse = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "You are a DALL-E prompt expert specializing in heartwarming pet care scenes. Create realistic, emotionally appealing prompts showing rescued animals being lovingly cared for. Focus on the bond between humans and animals, warm lighting, and cozy domestic settings."
                    },
                    {
                        role: "user",
                        content: `Create a DALL-E prompt for a ${careActivity} scene with this rescued animal:
                        
Animal details:
- Species: ${animalData.species}
- Name: ${animalData.name}
- Description: ${animalData.description}
- Current mood: ${moodDescription}
- Care stats: ${statsDescription.join(', ') || '건강한'}

Scene requirements:
- Action: ${promptConfig.action}
- Mood: ${promptConfig.mood}
- Setting: ${promptConfig.scene}
- Visual Changes: ${promptConfig.visualChange}
- Style: ${promptConfig.artStyle || 'Photorealistic, warm and cozy atmosphere, soft natural lighting'}
- Emotion: Show the deep bond and trust between the animal and caregiver
- Quality: High detail, professional ${careActivity === '씻기기' ? 'digital art illustration' : 'pet photography'} style
- Specific Details: Focus on the visible transformation and improvements from the care activity

Make it heartwarming and show the specific positive changes this care activity brought to this rescued animal.`
                    }
                ],
                max_tokens: 200,
                temperature: 0.8
            });

            if (!promptResponse.choices?.[0]?.message?.content) {
                throw new Error('GPT 프롬프트 생성에 실패했습니다.');
            }

            const dallePrompt = promptResponse.choices[0].message.content;
            console.log('📝 생성된 프롬프트:', dallePrompt);

            // DALL-E로 이미지 생성
            console.log('🎨 DALL-E로 케어 이미지 생성 중...');
            const imageResponse = await openai.images.generate({
                model: "dall-e-3",
                prompt: dallePrompt,
                size: "1024x1024",
                quality: "standard",
                n: 1
            });

            if (!imageResponse.data?.[0]?.url) {
                throw new Error('DALL-E 이미지 생성에 실패했습니다.');
            }

            const generatedImageUrl = imageResponse.data[0].url;
            const imageTimestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const filename = `care_${careActivity}_${animalData.id}_${imageTimestamp}.png`;

            // 생성된 이미지 정보 저장 (옵션 - 사용자 ID가 있는 경우)
            try {
                if (req.user?.id) {
                    await db.execute(
                        'INSERT INTO generated_images (user_id, image_url, metadata, created_at) VALUES (?, ?, ?, NOW())',
                        [req.user.id, generatedImageUrl, JSON.stringify({
                            type: 'care_game',
                            animal: animalData,
                            careActivity,
                            careStats,
                            animalMood,
                            completedTasks,
                            prompt: dallePrompt
                        })]
                    );
                }
            } catch (saveError) {
                console.warn('이미지 저장 실패 (계속 진행):', saveError.message);
            }

            // 성공 응답
            console.log('🎉 케어 게임 이미지 생성 완료!');
            res.json({ 
                success: true,
                image_path: generatedImageUrl,
                filename: filename,
                timestamp: imageTimestamp,
                activity: careActivity,
                animal: animalData,
                usedPrompt: dallePrompt,
                careStats: careStats,
                animalMood: animalMood
            });

        } catch (error) {
            console.error('케어 게임 이미지 생성 오류:', error);
            
            // 에러 타입에 따른 구체적인 응답
            if (error.code === 'insufficient_quota') {
                return res.status(402).json({ 
                    success: false,
                    error: 'OpenAI API 할당량이 부족합니다. 잠시 후 다시 시도해주세요.' 
                });
            } else if (error.code === 'content_policy_violation') {
                return res.status(400).json({ 
                    success: false,
                    error: '콘텐츠 정책 위반: 부적절한 내용이 감지되었습니다.' 
                });
            } else if (error.message?.includes('timeout')) {
                return res.status(408).json({ 
                    success: false,
                    error: '요청 시간이 초과되었습니다. 다시 시도해주세요.' 
                });
            }
            
            res.status(500).json({ 
                success: false,
                error: "이미지 생성 중 오류가 발생했습니다.",
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // 사용자의 생성 이미지 히스토리 조회
    getImageHistory: async (req, res) => {
        try {
            const { user_id } = req.params;
            const { page = 1, limit = 10 } = req.query;
            
            const offset = (page - 1) * limit;
            
            const [images] = await db.execute(`
                SELECT gi.*, p.original_prompt, p.final_prompt, a.species 
                FROM generated_images gi
                LEFT JOIN prompts p ON gi.prompt_id = p.prompt_id
                LEFT JOIN animals a ON p.animal_id = a.animal_id
                WHERE gi.user_id = ?
                ORDER BY gi.created_at DESC
                LIMIT ? OFFSET ?
            `, [user_id, parseInt(limit), offset]);
            
            const [countResult] = await db.execute(
                'SELECT COUNT(*) as total FROM generated_images WHERE user_id = ?',
                [user_id]
            );
            
            res.json({
                images,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total,
                    totalPages: Math.ceil(countResult[0].total / limit)
                }
            });
        } catch (error) {
            console.error('이미지 히스토리 조회 오류:', error);
            res.status(500).json({ error: '이미지 히스토리를 불러올 수 없습니다.' });
        }
    }
};

module.exports = aiController ;