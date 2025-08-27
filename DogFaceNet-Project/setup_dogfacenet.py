#!/usr/bin/env python3
"""
DogFaceNet 독립 프로젝트 설정 및 실행 스크립트
"""
import os
import sys
import subprocess
from pathlib import Path
import shutil
import urllib.request
import zipfile
import platform

class DogFaceNetSetup:
    """DogFaceNet 설정 및 실행 관리자"""
    
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.dogfacenet_dir = self.project_root / "DogFaceNet"
        self.data_dir = self.project_root / "data"
        self.dataset_dir = self.data_dir / "dogfacenet"
        
    def check_python_version(self):
        """Python 버전 확인"""
        version = sys.version_info
        print(f"Python 버전: {version.major}.{version.minor}.{version.micro}")
        
        if version < (3, 6, 4):
            print("Python 3.6.4 이상이 필요합니다!")
            return False
        return True
    
    def install_dependencies(self):
        """의존성 패키지 설치"""
        print("\n필요한 패키지들을 설치합니다...")
        
        # TensorFlow 1.12.0은 Python 3.7 이하에서만 지원
        python_version = sys.version_info
        if python_version >= (3, 8):
            print("⚠️  경고: TensorFlow 1.12.0은 Python 3.7 이하에서만 지원됩니다.")
            print("TensorFlow 2.x로 업그레이드된 버전을 사용합니다.")
            tensorflow_version = "tensorflow>=2.0.0"
        else:
            tensorflow_version = "tensorflow==1.12.0"
        
        packages = [
            tensorflow_version,
            "numpy>=1.14.0",
            "matplotlib>=2.1.2",
            "scikit-image>=0.13.1",
            "jupyter>=1.0.0",
            "tqdm>=4.23.4",
            "pillow",
            "opencv-python"
        ]
        
        for package in packages:
            try:
                print(f"설치 중: {package}")
                subprocess.check_call([sys.executable, "-m", "pip", "install", package])
            except subprocess.CalledProcessError as e:
                print(f"ERROR {package} 설치 실패: {e}")
                return False
        
        print("모든 패키지 설치 완료!")
        return True
    
    def create_directories(self):
        """필요한 디렉토리 생성"""
        print("\n디렉토리 구조를 생성합니다...")
        
        directories = [
            self.data_dir,
            self.dataset_dir,
            self.project_root / "output",
            self.project_root / "output" / "model",
            self.project_root / "output" / "history",
            self.project_root / "test_images"
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
            print(f"생성됨: {directory}")
        
        print("디렉토리 구조 생성 완료!")
    
    def download_dataset_info(self):
        """데이터셋 다운로드 안내"""
        print("\n데이터셋 정보:")
        print("=" * 50)
        print("DogFaceNet 데이터셋은 다음 위치에서 다운로드할 수 있습니다:")
        print("1. 최신 데이터셋 (8600+ 이미지):")
        print("   https://zenodo.org/records/12578449")
        print("2. 이전 데이터셋:")
        print("   https://github.com/GuillaumeMougeot/DogFaceNet/releases/")
        print("\n다운로드 후 다음 경로에 압축 해제:")
        print(f"   {self.dataset_dir}")
        print("   (폴더 구조: data/dogfacenet/[개별 개 폴더들])")
        print("=" * 50)
    
    def create_sample_script(self):
        """샘플 실행 스크립트 생성"""
        sample_script = """#!/usr/bin/env python3
\"\"\"
DogFaceNet 샘플 실행 스크립트
\"\"\"
import sys
import os
from pathlib import Path

# DogFaceNet 경로 추가
dogfacenet_path = Path(__file__).parent / "DogFaceNet"
sys.path.insert(0, str(dogfacenet_path))

def run_dogfacenet():
    \"\"\"DogFaceNet 실행\"\"\"
    try:
        print("🐕 DogFaceNet 시작!")
        print("=" * 50)
        
        # 데이터셋 존재 확인
        data_path = Path(__file__).parent / "data" / "dogfacenet"
        if not data_path.exists() or not any(data_path.iterdir()):
            print("❌ 데이터셋을 찾을 수 없습니다!")
            print(f"다음 경로에 데이터셋을 설치해주세요: {data_path}")
            print("데이터셋 다운로드: https://zenodo.org/records/12578449")
            return
        
        print(f"✅ 데이터셋 경로: {data_path}")
        
        # DogFaceNet 실행
        os.chdir(dogfacenet_path)
        
        # 기본 DogFaceNet 실행
        from dogfacenet import dogfacenet
        print("🚀 DogFaceNet 모델 훈련 시작!")
        
    except ImportError as e:
        print(f"❌ DogFaceNet 모듈을 불러올 수 없습니다: {e}")
        print("setup_dogfacenet.py를 먼저 실행해주세요.")
    except Exception as e:
        print(f"❌ 실행 중 오류: {e}")

def run_evaluation():
    \"\"\"모델 평가 실행\"\"\"
    try:
        print("📊 DogFaceNet 모델 평가!")
        print("=" * 50)
        
        # 개발 버전의 평가 도구 사용
        dev_path = Path(__file__).parent / "DogFaceNet" / "dogfacenet-dev"
        
        print("Jupyter 노트북으로 평가를 진행하려면:")
        print(f"cd {dev_path}")
        print("jupyter notebook dogfacenet_v12-dev.ipynb")
        
    except Exception as e:
        print(f"❌ 평가 실행 중 오류: {e}")

def main():
    print("🐕 DogFaceNet 독립 프로젝트")
    print("=" * 50)
    print("1. 모델 훈련")
    print("2. 모델 평가")
    print("3. 종료")
    
    choice = input("선택하세요 (1-3): ").strip()
    
    if choice == "1":
        run_dogfacenet()
    elif choice == "2":
        run_evaluation()
    elif choice == "3":
        print("👋 종료합니다.")
    else:
        print("잘못된 선택입니다.")

if __name__ == "__main__":
    main()
"""
        
        script_path = self.project_root / "run_dogfacenet.py"
        with open(script_path, 'w', encoding='utf-8') as f:
            f.write(sample_script)
        
        print(f"✅ 실행 스크립트 생성: {script_path}")
    
    def create_config_file(self):
        """DogFaceNet용 설정 파일 생성"""
        config_content = f"""# DogFaceNet 설정 파일
import os
from pathlib import Path

# 프로젝트 루트 경로
PROJECT_ROOT = Path(__file__).parent
DATA_ROOT = PROJECT_ROOT / "data" / "dogfacenet"
OUTPUT_ROOT = PROJECT_ROOT / "output"

# 데이터셋 경로
DATASET_PATH = str(DATA_ROOT)

# 모델 저장 경로
MODEL_SAVE_PATH = str(OUTPUT_ROOT / "model")

# 히스토리 저장 경로
HISTORY_SAVE_PATH = str(OUTPUT_ROOT / "history")

# 훈련 설정
BATCH_SIZE = 32
EPOCHS = 100
LEARNING_RATE = 0.001

# 이미지 크기
IMAGE_SIZE = 224

print(f"📁 데이터셋 경로: {{DATA_ROOT}}")
print(f"💾 모델 저장 경로: {{MODEL_SAVE_PATH}}")
print(f"📈 히스토리 저장 경로: {{HISTORY_SAVE_PATH}}")
"""
        
        config_path = self.project_root / "dogfacenet_config.py"
        with open(config_path, 'w', encoding='utf-8') as f:
            f.write(config_content)
        
        print(f"✅ 설정 파일 생성: {config_path}")
    
    def create_readme(self):
        """README 파일 생성"""
        readme_content = f"""# DogFaceNet 독립 프로젝트

🐕 개 얼굴 인식 및 검증을 위한 딥러닝 프로젝트

## 📋 프로젝트 구조
```
{self.project_root.name}/
├── DogFaceNet/              # 원본 DogFaceNet 소스코드
├── data/
│   └── dogfacenet/          # 데이터셋 디렉토리
├── output/
│   ├── model/               # 훈련된 모델 저장
│   └── history/             # 훈련 히스토리
├── test_images/             # 테스트용 이미지
├── setup_dogfacenet.py      # 설정 스크립트
├── run_dogfacenet.py        # 실행 스크립트
├── dogfacenet_config.py     # 설정 파일
└── README.md               # 이 파일

```

## 🚀 빠른 시작

### 1. 환경 설정
```bash
python setup_dogfacenet.py
```

### 2. 데이터셋 다운로드
- 최신 데이터셋: https://zenodo.org/records/12578449
- 이전 버전: https://github.com/GuillaumeMougeot/DogFaceNet/releases/
- 압축 해제 위치: `data/dogfacenet/`

### 3. 실행
```bash
python run_dogfacenet.py
```

## 🔧 주요 기능

- **개 얼굴 검증**: 두 이미지가 같은 개인지 판단 (92% 정확도)
- **개 얼굴 인식**: 개별 개체 식별
- **얼굴 클러스터링**: 유사한 개들을 그룹화
- **GAN 생성**: 개 얼굴 이미지 생성 (실험적)

## 📊 성능
- 오픈셋에서 92% 정확도 달성
- 8,600+ 개 이미지 데이터셋 사용
- ResNet + Triplet Loss 기반

## 🛠️ 요구사항
- Python >= 3.6.4
- TensorFlow (1.12.0 권장, 2.x도 지원)
- NumPy >= 1.14.0
- Matplotlib >= 2.1.2
- Scikit-image >= 0.13.1

## 📝 인용
```bibtex
@InProceedings{{10.1007/978-3-030-29894-4_34,
author="Mougeot, Guillaume and Li, Dewei and Jia, Shuai",
title="A Deep Learning Approach for Dog Face Verification and Recognition",
booktitle="PRICAI 2019: Trends in Artificial Intelligence",
year="2019",
publisher="Springer International Publishing",
pages="418--430"
}}
```

## 🔗 원본 저장소
https://github.com/GuillaumeMougeot/DogFaceNet
"""
        
        readme_path = self.project_root / "README.md"
        with open(readme_path, 'w', encoding='utf-8') as f:
            f.write(readme_content)
        
        print(f"✅ README 파일 생성: {readme_path}")
    
    def setup(self):
        """전체 설정 프로세스 실행"""
        print("DogFaceNet 독립 프로젝트 설정 시작!")
        print("=" * 60)
        
        # 1. Python 버전 확인
        if not self.check_python_version():
            return False
        
        # 2. 의존성 설치
        if not self.install_dependencies():
            return False
        
        # 3. 디렉토리 생성
        self.create_directories()
        
        # 4. 설정 파일들 생성
        self.create_config_file()
        self.create_sample_script()
        self.create_readme()
        
        # 5. 데이터셋 안내
        self.download_dataset_info()
        
        print("\n🎉 DogFaceNet 독립 프로젝트 설정 완료!")
        print("=" * 60)
        print("다음 단계:")
        print("1. 데이터셋 다운로드 (위의 링크 참조)")
        print("2. python run_dogfacenet.py 실행")
        print("3. 개 얼굴 인식 모델 훈련 및 테스트")
        
        return True

def main():
    setup_manager = DogFaceNetSetup()
    setup_manager.setup()

if __name__ == "__main__":
    main()