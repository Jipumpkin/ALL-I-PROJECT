const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { Animal, User } = require('../models');

class CareImageSynthesizer {
    constructor() {
        this.pythonPath = 'python';
        this.dalleDir = path.join(__dirname, '../../dalle');
        this.cliScript = path.join(this.dalleDir, 'care_synthesizer_cli.py');
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
                        const result = JSON.parse(stdout);
                        resolve(result);
                    } catch (e) {
                        reject(new Error(`JSON 파싱 오류: ${e.message}`));
                    }
                } else {
                    reject(new Error(`프로세스 종료 오류 (코드: ${code}): ${stderr}`));
                }
            });

            childProcess.on('error', (error) => {
                reject(new Error(`Python 프로세스 시작 실패: ${error.message}`));
            });
        });
    }

    async synthesizeImage(animalImagePath, spaceImagePath, activity) {
        return new Promise((resolve, reject) => {
            const timeout = 120000; // 2분 타임아웃
            
            const args = [
                this.cliScript,
                '--animal', animalImagePath,
                '--space', spaceImagePath,
                '--activity', activity,
                '--quiet',
                '--format', 'json',
                '--output', path.join(this.dalleDir, 'results')
            ];

            const childProcess = spawn(this.pythonPath, args, {
                cwd: this.dalleDir,
                env: { 
                    ...require('process').env, 
                    PYTHONIOENCODING: 'utf-8',
                    PYTHONPATH: this.dalleDir 
                }
            });
            
            let stdout = '';
            let stderr = '';
            
            const timer = setTimeout(() => {
                childProcess.kill('SIGKILL');
                reject(new Error('케어 이미지 합성 시간 초과 (2분)'));
            }, timeout);
            
            childProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            childProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            childProcess.on('close', (code) => {
                clearTimeout(timer);
                try {
                    if (code !== 0) {
                        reject(new Error(`Python 프로세스 실패 (코드: ${code}): ${stderr}`));
                        return;
                    }

                    // stdout에서 JSON 부분만 추출 (마지막 중괄호로 끝나는 부분)
                    let jsonStr = stdout.trim();
                    
                    // JSON이 시작되는 위치를 찾기
                    const jsonStart = jsonStr.indexOf('{');
                    if (jsonStart !== -1) {
                        jsonStr = jsonStr.substring(jsonStart);
                    }
                    
                    console.log(`Python 스크립트 JSON 응답: ${jsonStr}`);
                    
                    const result = JSON.parse(jsonStr);
                    if (result.success) {
                        resolve(result);
                    } else {
                        reject(new Error(result.error || '알 수 없는 케어 합성 오류'));
                    }
                } catch (e) {
                    reject(new Error(`JSON 파싱 오류: ${e.message}\nStdout: ${stdout}\nStderr: ${stderr}`));
                }
            });

            childProcess.on('error', (error) => {
                clearTimeout(timer);
                reject(new Error(`Python 프로세스 시작 오류: ${error.message}`));
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
                    
                    writeStream.on('error', (err) => {
                        reject(new Error(`파일 쓰기 오류: ${err.message}`));
                    });
                });
                
                request.on('error', (err) => {
                    reject(new Error(`다운로드 오류: ${err.message}`));
                });
                
                request.setTimeout(30000, () => {
                    reject(new Error('다운로드 시간 초과'));
                });
            });
        } catch (error) {
            throw new Error(`이미지 다운로드 실패: ${error.message}`);
        }
    }
}

const careController = {
    synthesizeCareImage: async (req, res) => {
        
        try {
            console.log('🐕💝 케어 이미지 합성 요청 시작');
            
            const { animal_id, user_id, care_activity, space_image_base64, space_image_url } = req.body;
            
            // 입력 검증
            if (!animal_id || !user_id || !care_activity) {
                return res.status(400).json({
                    success: false,
                    error: '필수 파라미터가 누락되었습니다.',
                    required: ['animal_id', 'user_id', 'care_activity']
                });
            }

            if (!space_image_base64 && !space_image_url) {
                return res.status(400).json({
                    success: false,
                    error: '공간 이미지가 필요합니다. (space_image_base64 또는 space_image_url)'
                });
            }

            // 합성기 초기화
            const synthesizer = new CareImageSynthesizer();

            // 지원하는 케어 활동 확인
            const activitiesResponse = await synthesizer.getSupportedActivities();
            if (!activitiesResponse.activities || !activitiesResponse.activities.includes(care_activity)) {
                return res.status(400).json({
                    success: false,
                    error: `지원하지 않는 케어 활동: ${care_activity}`,
                    supported_activities: activitiesResponse.activities || ['밥주기', '씻기기', '미용하기']
                });
            }

            // 동물 정보 가져오기
            const animal = await Animal.findByIdWithDetails(animal_id);
            if (!animal || !animal.image_url) {
                return res.status(404).json({
                    success: false,
                    error: '동물 정보를 찾을 수 없습니다.'
                });
            }

            // 동물 이미지 URL이 로컬 파일인지 확인하고 처리
            let animalImagePath;
            if (animal.image_url.startsWith('http://') || animal.image_url.startsWith('https://')) {
                // 외부 URL인 경우 임시 다운로드
                try {
                    animalImagePath = await synthesizer.downloadImage(animal.image_url, `animal_${animal_id}.jpg`);
                } catch (downloadError) {
                    console.error('동물 이미지 다운로드 실패:', downloadError);
                    return res.status(400).json({
                        success: false,
                        error: '동물 이미지 다운로드에 실패했습니다.'
                    });
                }
            } else {
                // 로컬 파일 경로
                animalImagePath = path.join(__dirname, '../uploads', path.basename(animal.image_url));
            }

            // 공간 이미지 처리 (Base64를 임시 파일로 저장)
            let spaceImagePath;
            if (space_image_base64) {
                // Base64를 임시 파일로 저장
                const base64Content = space_image_base64.split(',')[1];
                const buffer = Buffer.from(base64Content, 'base64');
                const safeFilename = `${crypto.randomUUID()}_space_image.jpg`;
                spaceImagePath = path.join(synthesizer.tempDir, safeFilename);
                await fs.writeFile(spaceImagePath, buffer);
                console.log(`✅ 공간 이미지 임시 저장: ${spaceImagePath}`);
            } else if (space_image_url) {
                // URL로부터 이미지 경로 추출 (로컬 파일 가정)
                spaceImagePath = path.join(__dirname, '../uploads', path.basename(space_image_url));
            }

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

            // 케어 이미지 합성 실행
            console.log(`🎨 케어 활동 "${care_activity}" 이미지 합성 시작`);
            const synthesisResult = await synthesizer.synthesizeImage(
                animalImagePath,
                spaceImagePath,
                care_activity
            );

            // 데이터베이스 저장은 선택적으로 처리 (현재는 생략)
            // TODO: 필요시 prompt 생성 후 저장
            console.log('🎯 DALL-E 합성 결과:', {
                filename: synthesisResult.filename,
                image_path: synthesisResult.image_path,
                activity: synthesisResult.activity
            });

            // 생성된 이미지를 Base64로 읽어서 응답에 포함
            let imageBase64 = null;
            try {
                if (synthesisResult.image_path) {
                    const imageBuffer = await fs.readFile(synthesisResult.image_path);
                    imageBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;
                    console.log('✅ 생성된 이미지를 Base64로 인코딩 완료');
                }
            } catch (imageReadError) {
                console.error('이미지 파일 읽기 실패:', imageReadError);
                // Base64 변환 실패해도 계속 진행
            }

            console.log('✅ 케어 이미지 합성 완료!');
            
            // 성공 응답 (Base64 이미지 포함)
            res.json({
                success: true,
                activity: care_activity,
                image_url: imageBase64 || synthesisResult.image_path, // Base64 우선, 실패시 파일경로
                filename: synthesisResult.filename,
                timestamp: synthesisResult.timestamp,
                animal_info: {
                    species: animal.species,
                    gender: animal.gender,
                    age: animal.age,
                    originalImageUrl: animal.image_url
                },
                synthesis_metadata: synthesisResult.metadata
            });

        } catch (error) {
            console.error('❌ 케어 이미지 합성 오류:', error);
            
            // 구체적인 에러 처리
            if (error.message?.includes('timeout') || error.message?.includes('시간 초과')) {
                return res.status(408).json({
                    success: false,
                    error: '케어 이미지 합성 시간이 초과되었습니다. 다시 시도해주세요.'
                });
            } else if (error.message?.includes('OPENAI_API_KEY')) {
                return res.status(500).json({
                    success: false,
                    error: 'AI 서비스 설정 오류가 발생했습니다.'
                });
            } else if (error.message?.includes('insufficient_quota')) {
                return res.status(402).json({
                    success: false,
                    error: 'AI 서비스 할당량이 부족합니다.'
                });
            }
            
            res.status(500).json({
                success: false,
                error: '케어 이미지 합성 중 오류가 발생했습니다.',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        } finally {
            // 임시 파일 정리
            try {
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
            console.log('📋 지원하는 케어 활동 목록 요청');
            
            const synthesizer = new CareImageSynthesizer();
            const activities = await synthesizer.getSupportedActivities();
            
            res.json({
                success: true,
                ...activities,
                descriptions: {
                    "밥주기": "동물이 음식을 먹거나 음식 그릇 근처에서 행복해하는 모습",
                    "씻기기": "동물이 목욕하거나 목욕 후 깔끔한 상태의 행복한 모습",
                    "미용하기": "동물이 그루밍을 받거나 그루밍 후 아름다운 모습"
                }
            });
        } catch (error) {
            console.error('❌ 케어 활동 목록 조회 오류:', error);
            res.status(500).json({
                success: false,
                error: '케어 활동 목록을 불러올 수 없습니다.',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    getCareHistory: async (req, res) => {
        try {
            const { user_id } = req.params;
            const { page = 1, limit = 10 } = req.query;
            
            const offset = (page - 1) * limit;
            
            // 케어 이미지는 generated_images 테이블에서 조회
            // 추후 care_activity 필드 추가 또는 별도 테이블 사용 가능
            const [images] = await db.execute(`
                SELECT gi.*, 'care' as type, gi.created_at
                FROM generated_images gi
                WHERE gi.user_id = ? AND gi.prompt_id IS NULL
                ORDER BY gi.created_at DESC
                LIMIT ? OFFSET ?
            `, [user_id, parseInt(limit), offset]);
            
            const [countResult] = await db.execute(`
                SELECT COUNT(*) as total 
                FROM generated_images 
                WHERE user_id = ? AND prompt_id IS NULL
            `, [user_id]);
            
            res.json({
                success: true,
                images,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total,
                    totalPages: Math.ceil(countResult[0].total / limit)
                }
            });
        } catch (error) {
            console.error('❌ 케어 이미지 히스토리 조회 오류:', error);
            res.status(500).json({
                success: false,
                error: '케어 이미지 히스토리를 불러올 수 없습니다.'
            });
        }
    }
};

module.exports = careController;