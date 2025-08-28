const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

const app = express();
const port = 3001;

// CORS 설정 (프론트엔드와 통신)
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 임시 파일 저장을 위한 multer 설정
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// AI 케어 합성 API
app.post('/api/ai/care-synthesis', upload.fields([
  { name: 'dogImage', maxCount: 1 },
  { name: 'spaceImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const { activity = 'food' } = req.body;
    const dogImageFile = req.files?.dogImage?.[0];
    const spaceImageFile = req.files?.spaceImage?.[0];

    if (!dogImageFile || !spaceImageFile) {
      return res.status(400).json({
        success: false,
        error: '동물 이미지와 공간 이미지가 모두 필요합니다.'
      });
    }

    console.log(`🎨 AI 케어 합성 시작 - 활동: ${activity}`);

    // 임시 파일로 저장
    const tempDir = path.join(__dirname, 'temp');
    await fs.mkdir(tempDir, { recursive: true });

    const dogImageId = crypto.randomUUID();
    const spaceImageId = crypto.randomUUID();
    
    const dogImagePath = path.join(tempDir, `dog_${dogImageId}.jpg`);
    const spaceImagePath = path.join(tempDir, `space_${spaceImageId}.jpg`);

    await fs.writeFile(dogImagePath, dogImageFile.buffer);
    await fs.writeFile(spaceImagePath, spaceImageFile.buffer);

    // Python AI 스크립트 실행
    const result = await runAISynthesis(dogImagePath, spaceImagePath, activity);

    // 임시 파일 정리
    await Promise.all([
      fs.unlink(dogImagePath).catch(() => {}),
      fs.unlink(spaceImagePath).catch(() => {})
    ]);

    if (result.success) {
      res.json({
        success: true,
        data: {
          resultImage: result.imageData,
          activity: activity,
          breedInfo: result.breedInfo,
          prompt: result.prompt,
          processingTime: result.processingTime
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('AI 합성 오류:', error);
    res.status(500).json({
      success: false,
      error: 'AI 합성 처리 중 오류가 발생했습니다.'
    });
  }
});

// URL 이미지로 AI 합성
app.post('/api/ai/care-synthesis-url', async (req, res) => {
  try {
    const { dogImageUrl, spaceImageUrl, activity = 'food' } = req.body;

    if (!dogImageUrl || !spaceImageUrl) {
      return res.status(400).json({
        success: false,
        error: '동물 이미지 URL과 공간 이미지 URL이 모두 필요합니다.'
      });
    }

    console.log(`🎨 AI 케어 합성 시작 (URL) - 활동: ${activity}`);

    // Python AI 스크립트 실행 (URL 버전)
    const result = await runAISynthesisWithUrls(dogImageUrl, spaceImageUrl, activity);

    if (result.success) {
      res.json({
        success: true,
        data: {
          resultImage: result.imageData,
          activity: activity,
          breedInfo: result.breedInfo,
          prompt: result.prompt,
          processingTime: result.processingTime
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('AI 합성 오류 (URL):', error);
    res.status(500).json({
      success: false,
      error: 'AI 합성 처리 중 오류가 발생했습니다.'
    });
  }
});

// Python AI 스크립트 실행 함수 (파일 경로)
function runAISynthesis(dogImagePath, spaceImagePath, activity) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    // 활동 매핑
    const activityMap = {
      'food': '밥주기',
      'shower': '목욕하기',
      'grooming': '씻기기'
    };
    const koreanActivity = activityMap[activity] || '밥주기';

    console.log(`🐍 Python 스크립트 실행 중... 활동: ${koreanActivity}`);

    // Python 스크립트에 전달할 인자
    const pythonProcess = spawn('python', [
      path.join(__dirname, 'care-synthesis.py'),
      dogImagePath,
      spaceImagePath,
      koreanActivity
    ], {
      cwd: __dirname
    });

    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
      console.log(`Python 오류: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      const processingTime = Date.now() - startTime;
      
      if (code === 0) {
        try {
          // Python 스크립트 출력 파싱
          const result = JSON.parse(outputData);
          resolve({
            success: true,
            imageData: result.imageData,
            breedInfo: result.breedInfo,
            prompt: result.prompt,
            processingTime: processingTime
          });
        } catch (parseError) {
          console.error('Python 출력 파싱 오류:', parseError);
          resolve({
            success: false,
            error: 'AI 합성 결과 처리 중 오류가 발생했습니다.'
          });
        }
      } else {
        console.error(`Python 스크립트 오류 (코드 ${code}):`, errorData);
        resolve({
          success: false,
          error: `AI 합성 실패: ${errorData}`
        });
      }
    });

    pythonProcess.on('error', (error) => {
      console.error('Python 프로세스 실행 오류:', error);
      resolve({
        success: false,
        error: 'Python AI 스크립트 실행에 실패했습니다.'
      });
    });
  });
}

// Python AI 스크립트 실행 함수 (URL)
function runAISynthesisWithUrls(dogImageUrl, spaceImageUrl, activity) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    // 활동 매핑
    const activityMap = {
      'food': '밥주기',
      'shower': '목욕하기',
      'grooming': '씻기기'
    };
    const koreanActivity = activityMap[activity] || '밥주기';

    console.log(`🐍 Python 스크립트 실행 중 (URL)... 활동: ${koreanActivity}`);

    // Python 스크립트에 전달할 인자
    const pythonProcess = spawn('python', [
      path.join(__dirname, 'care-synthesis-url.py'),
      dogImageUrl,
      spaceImageUrl,
      koreanActivity
    ], {
      cwd: __dirname
    });

    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
      console.log(`Python 오류: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      const processingTime = Date.now() - startTime;
      
      if (code === 0) {
        try {
          // Python 스크립트 출력 파싱
          const result = JSON.parse(outputData);
          resolve({
            success: true,
            imageData: result.imageData,
            breedInfo: result.breedInfo,
            prompt: result.prompt,
            processingTime: processingTime
          });
        } catch (parseError) {
          console.error('Python 출력 파싱 오류:', parseError);
          resolve({
            success: false,
            error: 'AI 합성 결과 처리 중 오류가 발생했습니다.'
          });
        }
      } else {
        console.error(`Python 스크립트 오류 (코드 ${code}):`, errorData);
        resolve({
          success: false,
          error: `AI 합성 실패: ${errorData}`
        });
      }
    });

    pythonProcess.on('error', (error) => {
      console.error('Python 프로세스 실행 오류:', error);
      resolve({
        success: false,
        error: 'Python AI 스크립트 실행에 실패했습니다.'
      });
    });
  });
}

// 서버 상태 확인 API
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'AI 서버가 정상 작동 중입니다.',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`🤖 AI 서버가 포트 ${port}에서 실행 중입니다.`);
  console.log(`💡 프론트엔드에서 http://localhost:${port}/api/ai/care-synthesis 로 호출하세요.`);
});

module.exports = app;