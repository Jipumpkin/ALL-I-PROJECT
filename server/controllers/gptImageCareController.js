const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { Animal, User } = require('../models');

class GPTImageCareImageSynthesizer {
    constructor() {
        this.pythonPath = 'python';
        this.dalleDir = path.join(__dirname, '../../dalle');
        this.cliScript = path.join(this.dalleDir, 'gpt_image_care_cli.py');
        this.tempDir = require('os').tmpdir(); // 시스템 임시 디렉토리 사용
    }

    async getSupportedActivities() {
        return new Promise((resolve, reject) => {
            const childProcess = spawn(this.pythonPath, [this.cliScript, '--list-activities'], {
                cwd: this.dalleDir,
                env: { 
                    ...require('process').env, 
                    PYTHONIOENCODING: 'utf-8',
                    PYTHONPATH: this.dalleDir 
                }
            });
            
            let stdout = '';
            let stderr = '';
            
            childProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            childProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            childProcess.on('close', (code) => {
                if (code === 0) {
                    try {
                        const result = JSON.parse(stdout.trim());
                        resolve(result);
                    } catch (parseError) {
                        console.error('JSON 파싱 오류:', parseError);
                        console.error('stdout:', stdout);
                        reject(new Error('응답 파싱 실패'));
                    }
                } else {
                    console.error('Python 스크립트 실행 실패:', stderr);
                    reject(new Error(`Python 스크립트 종료 코드: ${code}`));
                }
            });
        });
    }

    async synthesizeImage(animalImagePath, spaceImagePath, activity) {
        return new Promise((resolve, reject) => {
            const args = [
                this.cliScript,
                '--animal', animalImagePath,
                '--space', spaceImagePath, 
                '--activity', activity,
                '--format', 'json',
                '--quiet'
            ];

            console.log('🚀 GPT-Image-1 Python 스크립트 실행:', args.join(' '));

            const quotedArgs = args.map(arg => `"${arg}"`);
            const command = `chcp 65001 >nul && "${this.pythonPath}" ${quotedArgs.join(' ')}`;
            
            console.log('🚀 실행 명령어:', command);
            
            const childProcess = spawn('cmd', ['/c', command], {
                cwd: this.dalleDir,
                env: {
                    ...require('process').env,
                    PYTHONIOENCODING: 'utf-8',
                    PYTHONPATH: this.dalleDir,
                    LANG: 'ko_KR.UTF-8',
                    LC_ALL: 'ko_KR.UTF-8'
                },
                shell: true,
                timeout: 300000 // 5분 타임아웃 (GPT-Image-1은 더 빠를 것으로 예상)
            });

            let stdout = '';
            let stderr = '';

            childProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            childProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            childProcess.on('close', (code) => {
                console.log(`GPT-Image-1 스크립트 종료 코드: ${code}`);
                
                if (stderr) {
                    console.log('GPT-Image-1 stderr:', stderr);
                }

                if (code === 0) {
                    try {
                        // JSON 응답 추출 및 파싱
                        let jsonStr = stdout.trim();
                        
                        // 진행 메시지 제거하고 JSON만 추출
                        const jsonStart = jsonStr.indexOf('{');
                        const jsonEnd = jsonStr.lastIndexOf('}') + 1;
                        
                        if (jsonStart >= 0 && jsonEnd > jsonStart) {
                            jsonStr = jsonStr.substring(jsonStart, jsonEnd);
                        }
                        
                        console.log('GPT-Image-1 JSON 응답:', jsonStr.substring(0, 200) + '...');
                        
                        const result = JSON.parse(jsonStr);
                        
                        if (result.success) {
                            resolve({
                                success: true,
                                filename: result.filename,
                                image_path: result.image_path,
                                activity: result.activity,
                                model: result.model || 'gpt-image-1',
                                timestamp: result.timestamp
                            });
                        } else {
                            reject(new Error(result.error || 'GPT-Image-1 합성 실패'));
                        }
                    } catch (parseError) {
                        console.error('GPT-Image-1 JSON 파싱 오류:', parseError);
                        console.error('stdout:', stdout);
                        reject(new Error('GPT-Image-1 응답 파싱 실패'));
                    }
                } else {
                    reject(new Error(`GPT-Image-1 스크립트 실행 실패 (코드: ${code})`));
                }
            });

            childProcess.on('error', (error) => {
                console.error('GPT-Image-1 프로세스 오류:', error);
                reject(new Error('GPT-Image-1 프로세스 실행 실패'));
            });
        });
    }

    async downloadImage(imageUrl, filename) {
        try {
            const https = require('https');
            const http = require('http');
            
            // 안전한 파일 경로 생성
            const safeFilename = `${crypto.randomUUID()}_${filename}`;
            const filePath = path.join(this.tempDir, safeFilename);
            
            return new Promise((resolve, reject) => {
                const client = imageUrl.startsWith('https:') ? https : http;
                const request = client.get(imageUrl, (response) => {
                    if (response.statusCode !== 200) {
                        reject(new Error(`HTTP 오류: ${response.statusCode}`));
                        return;
                    }
                    
                    // Content-Type 확인 (더 유연하게)
                    const contentType = response.headers['content-type'];
                    console.log(`다운로드 Content-Type: ${contentType}`);
                    console.log(`이미지 URL: ${imageUrl}`);
                    
                    // 동물보호센터 API는 application/octet-stream을 반환하므로 URL 확장자로 판단
                    const isImageByExtension = imageUrl.match(/\.(jpg|jpeg|png|gif|bmp|webp)(\?.*)?$/i);
                    const isImageByContentType = contentType && contentType.startsWith('image/');
                    const isOctetStream = contentType && contentType.includes('application/octet-stream');
                    
                    // 이미지 확장자가 있거나, image/* 타입이거나, octet-stream인 경우 허용
                    if (!isImageByExtension && !isImageByContentType && !isOctetStream) {
                        reject(new Error(`이미지가 아닌 파일입니다. Content-Type: ${contentType}`));
                        return;
                    }
                    
                    console.log(`✅ 이미지 다운로드 허용 (확장자: ${!!isImageByExtension}, ContentType: ${!!isImageByContentType}, OctetStream: ${!!isOctetStream})`);
                    
                    // 파일 크기 제한 확인 (10MB)
                    const contentLength = parseInt(response.headers['content-length'], 10);
                    if (contentLength && contentLength > 10 * 1024 * 1024) {
                        reject(new Error('이미지 크기는 10MB를 초과할 수 없습니다.'));
                        return;
                    }
                    
                    const writeStream = require('fs').createWriteStream(filePath);
                    
                    response.pipe(writeStream);
                    
                    writeStream.on('finish', () => {
                        resolve(filePath);
                    });
                    
                    writeStream.on('error', (error) => {
                        reject(new Error(`파일 쓰기 실패: ${error.message}`));
                    });
                });
                
                request.on('error', (error) => {
                    reject(new Error(`다운로드 실패: ${error.message}`));
                });
                
                // 타임아웃 설정 (30초)
                request.setTimeout(30000, () => {
                    request.destroy();
                    reject(new Error('이미지 다운로드 타임아웃'));
                });
            });
        } catch (error) {
            throw new Error(`이미지 다운로드 오류: ${error.message}`);
        }
    }
}

const gptImageCareController = {
    synthesizeCareImage: async (req, res) => {
        let animalImagePath, spaceImagePath;
        
        try {
            console.log('🚀 GPT-Image-1 케어 이미지 합성 요청 시작');
            
            const { user_id, care_activity, animal_id, animal_image_url } = req.body;
            const spaceImageFile = req.files?.find(file => file.fieldname === 'space_image');
            
            // 입력 데이터 검증
            if (!care_activity) {
                return res.status(400).json({
                    success: false,
                    error: '케어 활동이 누락되었습니다. (care_activity 필요)'
                });
            }

            if (!animal_image_url || !spaceImageFile) {
                return res.status(400).json({
                    success: false,
                    error: '동물 이미지 URL과 공간 이미지 파일이 모두 필요합니다.'
                });
            }

            const synthesizer = new GPTImageCareImageSynthesizer();

            console.log('🐕 동물 이미지 다운로드 및 공간 이미지 처리');

            // 동물 이미지 다운로드 (백엔드에서 CORS 우회)
            try {
                animalImagePath = await synthesizer.downloadImage(animal_image_url, `animal_${animal_id || Date.now()}.jpg`);
                console.log(`📸 동물 이미지 다운로드 완료: ${animalImagePath}`);
            } catch (downloadError) {
                console.error('동물 이미지 다운로드 실패:', downloadError);
                return res.status(400).json({
                    success: false,
                    error: '동물 이미지 다운로드에 실패했습니다.'
                });
            }

            // 공간 이미지 파일 경로
            spaceImagePath = spaceImageFile.path;
            
            console.log(`🏠 공간 이미지: ${spaceImagePath}`);

            // 파일 존재 확인
            try {
                await fs.access(animalImagePath);
            } catch {
                return res.status(404).json({
                    success: false,
                    error: '동물 이미지 파일을 찾을 수 없습니다.'
                });
            }

            // 공간 이미지 파일 존재 확인
            if (spaceImagePath) {
                try {
                    await fs.access(spaceImagePath);
                } catch {
                    return res.status(404).json({
                        success: false,
                        error: '공간 이미지 파일을 찾을 수 없습니다.'
                    });
                }
            }

            // 한글-영어 매핑 (인코딩 문제 해결)
            const activityMapping = {
                '밥주기': 'feeding',
                '씻기기': 'bathing',
                '미용하기': 'grooming'
            };
            
            const englishActivity = activityMapping[care_activity] || care_activity;
            
            // GPT-Image-1 케어 이미지 합성 실행
            console.log(`🎨 GPT-Image-1로 케어 활동 "${care_activity}" (${englishActivity}) 이미지 합성 시작`);
            const synthesisResult = await synthesizer.synthesizeImage(
                animalImagePath,
                spaceImagePath,
                englishActivity
            );

            console.log('🎯 GPT-Image-1 합성 결과:', {
                filename: synthesisResult.filename,
                image_path: synthesisResult.image_path,
                activity: synthesisResult.activity,
                model: synthesisResult.model
            });

            // 생성된 이미지를 Base64로 읽어서 응답에 포함
            let imageBase64 = null;
            try {
                if (synthesisResult.image_path) {
                    // Python 스크립트는 dalle/ 디렉토리에서 실행되므로 경로 보정 필요
                    const dalleDir = path.join(__dirname, '../../dalle');
                    const fullImagePath = path.join(dalleDir, synthesisResult.image_path);
                    
                    console.log(`📖 이미지 파일 읽기 시도: ${fullImagePath}`);
                    const imageBuffer = await fs.readFile(fullImagePath);
                    imageBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;
                    console.log('✅ GPT-Image-1 생성 이미지를 Base64로 인코딩 완료');
                }
            } catch (imageReadError) {
                console.error('이미지 파일 읽기 실패:', imageReadError);
            }

            // 성공 응답
            res.json({
                success: true,
                message: `GPT-Image-1으로 ${care_activity} 케어 이미지 합성이 완료되었습니다.`,
                activity: care_activity,
                model: synthesisResult.model || 'gpt-image-1',
                filename: synthesisResult.filename,
                timestamp: synthesisResult.timestamp,
                image_base64: imageBase64,
                image_url: imageBase64, // 호환성을 위해 동일한 값 제공
                animal_info: {
                    id: animal_id,
                    url: animal_image_url
                }
            });

        } catch (error) {
            console.error('❌ GPT-Image-1 케어 이미지 합성 오류:', error);
            
            // 구체적인 에러 처리
            if (error.message?.includes('timeout') || error.message?.includes('시간 초과')) {
                return res.status(408).json({
                    success: false,
                    error: 'GPT-Image-1 케어 이미지 합성 시간이 초과되었습니다. 다시 시도해주세요.',
                    model: 'gpt-image-1'
                });
            } else if (error.message?.includes('OPENAI_API_KEY')) {
                return res.status(500).json({
                    success: false,
                    error: 'AI 서비스 설정 오류가 발생했습니다.',
                    model: 'gpt-image-1'
                });
            } else if (error.message?.includes('insufficient_quota')) {
                return res.status(402).json({
                    success: false,
                    error: 'AI 서비스 할당량이 부족합니다.',
                    model: 'gpt-image-1'
                });
            }
            
            res.status(500).json({
                success: false,
                error: 'GPT-Image-1 케어 이미지 합성 중 오류가 발생했습니다.',
                model: 'gpt-image-1',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        } finally {
            // 임시 파일 정리
            try {
                const synthesizer = new GPTImageCareImageSynthesizer();
                if (animalImagePath && animalImagePath.includes(synthesizer.tempDir)) {
                    await fs.unlink(animalImagePath);
                    console.log(`🗑️ 동물 임시 파일 삭제: ${animalImagePath}`);
                }
                if (spaceImagePath && spaceImagePath.includes(synthesizer.tempDir)) {
                    await fs.unlink(spaceImagePath);
                    console.log(`🗑️ 공간 임시 파일 삭제: ${spaceImagePath}`);
                }
            } catch (cleanupError) {
                console.warn('임시 파일 삭제 실패:', cleanupError.message);
            }
        }
    },

    getCareActivities: async (req, res) => {
        try {
            console.log('📋 GPT-Image-1 지원하는 케어 활동 목록 요청');
            
            const synthesizer = new GPTImageCareImageSynthesizer();
            const activities = await synthesizer.getSupportedActivities();
            
            res.json({
                success: true,
                model: 'gpt-image-1',
                ...activities,
                descriptions: {
                    "밥주기": "동물이 음식을 먹거나 음식 그릇 근처에서 행복해하는 모습",
                    "씻기기": "동물이 목욕하거나 목욕 후 깔끔한 상태의 행복한 모습",
                    "미용하기": "동물이 그루밍을 받거나 그루밍 후 아름다운 모습"
                }
            });
        } catch (error) {
            console.error('GPT-Image-1 케어 활동 목록 조회 오류:', error);
            
            res.status(500).json({
                success: false,
                model: 'gpt-image-1',
                error: '케어 활동 목록을 불러올 수 없습니다.',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    getCareHistory: async (req, res) => {
        // GPT-Image-1 케어 이미지는 임시로만 보여주고 DB에 저장하지 않으므로 히스토리 기능 비활성화
        res.json({
            success: true,
            model: 'gpt-image-1',
            message: 'GPT-Image-1 케어 이미지는 임시 생성되며 히스토리에 저장되지 않습니다.',
            images: [],
            pagination: {
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 0
            }
        });
    }
};

module.exports = gptImageCareController;