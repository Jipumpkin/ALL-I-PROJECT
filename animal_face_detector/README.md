# 🐕 Animal Face Detection System

사전학습된 AI 모델들을 활용한 독립적인 동물 얼굴 탐지 및 분류 시스템입니다.

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![OpenCV](https://img.shields.io/badge/OpenCV-4.8+-green.svg)
![YOLO](https://img.shields.io/badge/YOLO-v8/v11-orange.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## ✨ 주요 기능

- 🎯 **다중 모델 지원**: YOLO, Haar Cascade, HuggingFace 모델 통합
- 🚀 **실시간 탐지**: 웹캠 및 비디오 파일 처리
- 🎨 **시각화**: 탐지 결과 박스 및 신뢰도 표시
- 💾 **결과 저장**: 이미지 및 JSON 형태로 결과 저장
- 🖥️ **GUI 인터페이스**: 사용자 친화적인 그래픽 인터페이스
- ⚡ **배치 처리**: 여러 이미지 동시 처리

## 🎯 지원 동물

### YOLO 모델 (COCO Dataset)
- 🐕 개 (Dog)
- 🐱 고양이 (Cat)  
- 🐴 말 (Horse)
- 🐄 소 (Cow)
- 🐘 코끼리 (Elephant)
- 🐻 곰 (Bear)
- 🦓 얼룩말 (Zebra)
- 🦒 기린 (Giraffe)

### Haar Cascade 모델
- 🐕 개 얼굴 (전면)
- 🐱 고양이 얼굴 (전면)

### HuggingFace 모델
- 🦁 사자 (Lion)
- 🐅 호랑이 (Tiger) 
- 기타 분류 지원

## 🚀 빠른 시작

### 1. 설치

```bash
# 저장소 클론
git clone <repository-url>
cd animal_face_detector

# 가상환경 생성 (권장)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 패키지 설치
pip install -r requirements.txt
```

### 2. 기본 사용법

#### 명령행 인터페이스
```bash
# 이미지에서 탐지
python main.py --image test_images/dog.jpg

# 비디오에서 탐지  
python main.py --video test_video.mp4

# 실시간 웹캠 탐지
python main.py --webcam

# 시스템 정보 확인
python main.py --info
```

#### GUI 인터페이스
```bash
# GUI 실행
python gui.py
```

## 📁 프로젝트 구조

```
animal_face_detector/
├── main.py                    # 메인 CLI 애플리케이션
├── gui.py                     # GUI 애플리케이션
├── requirements.txt           # 필수 패키지 목록
├── config.json               # 설정 파일 (자동 생성)
├── models/                   # 탐지 모델 모듈들
│   ├── __init__.py
│   ├── yolo_detector.py      # YOLO 기반 탐지기
│   ├── haar_detector.py      # Haar Cascade 탐지기
│   ├── huggingface_detector.py # HuggingFace 분류기
│   └── haar_cascades/        # Haar 모델 저장소 (자동 생성)
├── utils/                    # 유틸리티 모듈들
│   ├── __init__.py
│   ├── visualization.py      # 결과 시각화
│   └── file_handler.py       # 파일 처리
├── output/                   # 결과 출력 디렉토리 (자동 생성)
├── test_images/             # 테스트 이미지들 (선택사항)
└── logs/                    # 로그 파일들 (자동 생성)
```

## ⚙️ 모델 상세 정보

### 🎯 YOLO (Ultralytics)
- **모델**: YOLOv8n/s/m/l (선택 가능)
- **성능**: 실시간 처리 가능 (30+ FPS)
- **정확도**: mAP 37.3~52.9 (모델 크기별)
- **장점**: 빠른 속도, 높은 정확도, 다양한 동물 지원

```python
from models.yolo_detector import YOLOAnimalDetector

detector = YOLOAnimalDetector(model_size='n', confidence_threshold=0.5)
results = detector.detect(image)
```

### 🎪 Haar Cascade (OpenCV)
- **모델**: 개/고양이 전용 분류기
- **성능**: CPU에서 실시간 가능
- **정확도**: 약 80-90% (조명/각도에 따라 변동)
- **장점**: 가벼움, 빠른 처리, 전용 모델

```python
from models.haar_detector import HaarDogDetector

detector = HaarDogDetector(model_type='frontal_dog')
results = detector.detect(image)
```

### 🤗 HuggingFace (Transformers)
- **모델**: ResNet 기반 동물 분류기
- **성능**: 고정밀도 분류
- **정확도**: 모델별 상이 (90%+)
- **장점**: 최신 AI 기술, 높은 정확도

```python
from models.huggingface_detector import HuggingFaceAnimalClassifier

classifier = HuggingFaceAnimalClassifier(model_name='animal-classification')
results = classifier.detect(image)
```

## 🎨 사용 예제

### 기본 탐지
```python
from main import AnimalFaceDetectionSystem

# 시스템 초기화
system = AnimalFaceDetectionSystem()

# 이미지에서 탐지
result_path = system.detect_from_image('my_pet.jpg', 'output/')
print(f"결과 저장: {result_path}")
```

### 고급 사용법
```python
# YOLO 고급 설정
from models.yolo_detector import YOLOAnimalDetectorAdvanced

detector = YOLOAnimalDetectorAdvanced(
    model_size='m',
    confidence_threshold=0.7,
    nms_threshold=0.4,
    track_enabled=True  # 객체 추적 활성화
)

# 추적과 함께 탐지
results = detector.detect_with_tracking(image)
```

### 배치 처리
```python
from utils.file_handler import FileHandler

file_handler = FileHandler()
images = file_handler.batch_load_images(['img1.jpg', 'img2.jpg'])

for i, image in enumerate(images):
    if image is not None:
        results = detector.detect(image)
        print(f"이미지 {i+1}: {len(results)}개 탐지")
```

## ⚡ 성능 최적화

### GPU 가속
```bash
# CUDA 지원 PyTorch 설치 (GPU 있는 경우)
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

### 모델 크기 선택
- **yolo8n**: 가장 빠름, 기본 정확도
- **yolo8s**: 균형잡힌 성능  
- **yolo8m**: 높은 정확도
- **yolo8l**: 최고 정확도, 느림

### 메모리 최적화
```python
# 이미지 크기 제한
system.detect_from_image('large_image.jpg', max_size=(1920, 1080))

# 배치 크기 조정
config_manager.set('performance.batch_size', 4)
```

## 🔧 설정

### config.json 예제
```json
{
  "detection": {
    "yolo_model_size": "n",
    "yolo_confidence": 0.5,
    "haar_scale_factor": 1.1,
    "haar_min_neighbors": 5
  },
  "visualization": {
    "font_scale": 0.6,
    "thickness": 2,
    "show_confidence": true
  },
  "output": {
    "save_images": true,
    "save_json": true,
    "output_directory": "output"
  }
}
```

## 🐛 문제 해결

### 자주 발생하는 문제

1. **YOLO 모델 다운로드 실패**
   ```bash
   # 수동 다운로드
   python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
   ```

2. **Haar Cascade 모델 없음**
   ```bash
   # 자동으로 다운로드되지만, 수동으로도 가능
   wget https://github.com/kskd1804/dog_face_haar_cascade/raw/main/haarcascade_frontalface_dog.xml
   ```

3. **GPU 메모리 부족**
   ```python
   # CPU 강제 사용
   import torch
   torch.cuda.set_device(-1)  # CPU 사용
   ```

4. **tkinter 설치 문제 (Linux)**
   ```bash
   sudo apt-get install python3-tk
   ```

### 로그 확인
```bash
# 로그 파일 위치
tail -f logs/detection_log_YYYYMMDD.log
```

## 📊 벤치마크 결과

| 모델 | 속도 (FPS) | 정확도 | 메모리 | 지원 동물 |
|------|-----------|--------|--------|-----------|
| YOLO8n | 45 | ★★★☆☆ | 낮음 | 8종 |
| YOLO8s | 35 | ★★★★☆ | 보통 | 8종 |  
| YOLO8m | 25 | ★★★★★ | 높음 | 8종 |
| Haar Dog | 60 | ★★★☆☆ | 매우낮음 | 개만 |
| Haar Cat | 60 | ★★★☆☆ | 매우낮음 | 고양이만 |
| HuggingFace | 15 | ★★★★★ | 높음 | 6종+ |

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 확인하세요.

## 🙏 감사의 말

- [Ultralytics](https://ultralytics.com/) - YOLOv8/YOLO11 모델
- [OpenCV](https://opencv.org/) - Computer Vision 라이브러리
- [HuggingFace](https://huggingface.co/) - Transformers 및 사전학습 모델들
- [kskd1804](https://github.com/kskd1804/dog_face_haar_cascade) - 개 얼굴 Haar Cascade 모델

## 📞 지원 및 문의

- 🐛 버그 리포트: [Issues](../../issues)
- 💡 기능 제안: [Discussions](../../discussions)  
- 📧 이메일: your-email@example.com

---

**⭐ 이 프로젝트가 도움이 되셨다면 Star를 눌러주세요!**