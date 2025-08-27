/**
 * Node.js에서 DALL-E 케어 이미지 합성 Python CLI 호출 예제
 * 실제 백엔드 서버에서 이 코드를 참고하여 구현
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class CareImageSynthesizer {
    constructor(pythonPath = 'python', scriptsDir = './dalle') {
        this.pythonPath = pythonPath;
        this.scriptsDir = scriptsDir;
        this.cliScript = path.join(scriptsDir, 'care_synthesizer_cli.py');
    }

    /**
     * 지원되는 케어 활동 목록 가져오기
     */
    async getSupportedActivities() {
        return new Promise((resolve, reject) => {
            const process = spawn(this.pythonPath, [this.cliScript, '--list-activities']);
            
            let stdout = '';
            let stderr = '';
            
            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            process.on('close', (code) => {
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
        });
    }

    /**
     * 케어 이미지 합성 실행
     * @param {string} animalImagePath - 동물 이미지 파일 경로
     * @param {string} spaceImagePath - 공간 이미지 파일 경로  
     * @param {string} activity - 케어 활동 ('밥주기', '씻기기', '미용하기')
     * @param {string} outputDir - 출력 디렉토리 (선택사항)
     */
    async synthesizeImage(animalImagePath, spaceImagePath, activity, outputDir = null) {
        return new Promise((resolve, reject) => {
            const args = [
                this.cliScript,
                '--animal', animalImagePath,
                '--space', spaceImagePath,
                '--activity', activity,
                '--quiet',  // JSON 출력만 받기
                '--format', 'json'
            ];

            if (outputDir) {
                args.push('--output', outputDir);
            }

            const process = spawn(this.pythonPath, args);
            
            let stdout = '';
            let stderr = '';
            
            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            process.on('close', (code) => {
                try {
                    const result = JSON.parse(stdout);
                    if (result.success) {
                        resolve(result);
                    } else {
                        reject(new Error(result.error || '알 수 없는 오류'));
                    }
                } catch (e) {
                    reject(new Error(`JSON 파싱 오류: ${e.message}\nStdout: ${stdout}\nStderr: ${stderr}`));
                }
            });

            process.on('error', (error) => {
                reject(new Error(`프로세스 시작 오류: ${error.message}`));
            });
        });
    }

    /**
     * 이미지 파일 존재 여부 확인
     */
    async checkImageExists(imagePath) {
        try {
            await fs.access(imagePath);
            return true;
        } catch {
            return false;
        }
    }
}

// Express.js 라우터 예제
function createExpressRoutes(app) {
    const synthesizer = new CareImageSynthesizer();

    // 지원 활동 목록 API
    app.get('/api/care/activities', async (req, res) => {
        try {
            const activities = await synthesizer.getSupportedActivities();
            res.json(activities);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // 이미지 합성 API
    app.post('/api/care/synthesize', async (req, res) => {
        try {
            const { animalImagePath, spaceImagePath, activity, outputDir } = req.body;

            // 입력 검증
            if (!animalImagePath || !spaceImagePath || !activity) {
                return res.status(400).json({
                    success: false,
                    error: '필수 매개변수가 누락되었습니다'
                });
            }

            // 파일 존재 여부 확인
            const animalExists = await synthesizer.checkImageExists(animalImagePath);
            const spaceExists = await synthesizer.checkImageExists(spaceImagePath);

            if (!animalExists) {
                return res.status(400).json({
                    success: false,
                    error: '동물 이미지 파일을 찾을 수 없습니다'
                });
            }

            if (!spaceExists) {
                return res.status(400).json({
                    success: false,
                    error: '공간 이미지 파일을 찾을 수 없습니다'
                });
            }

            // 합성 실행
            const result = await synthesizer.synthesizeImage(
                animalImagePath,
                spaceImagePath, 
                activity,
                outputDir
            );

            res.json(result);

        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
}

// 사용 예제
async function example() {
    const synthesizer = new CareImageSynthesizer();
    
    try {
        // 지원 활동 목록 확인
        console.log('지원되는 활동 확인 중...');
        const activities = await synthesizer.getSupportedActivities();
        console.log('지원 활동:', activities.activities);
        
        // 이미지 합성 실행 (예제)
        console.log('\n이미지 합성 실행 중...');
        const result = await synthesizer.synthesizeImage(
            './data/animal.jpg',      // 동물 이미지
            './data/custom_space.jpg', // 공간 이미지
            '밥주기'                   // 케어 활동
        );
        
        console.log('합성 결과:', result);
        console.log('생성된 파일:', result.filename);
        
    } catch (error) {
        console.error('오류:', error.message);
    }
}

module.exports = {
    CareImageSynthesizer,
    createExpressRoutes
};

// 직접 실행 시 예제 실행
if (require.main === module) {
    example();
}