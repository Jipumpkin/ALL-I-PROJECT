#!/usr/bin/env python3
"""
🐕 Animal Face Detection System - 빠른 설정 스크립트
필요한 패키지 설치 및 환경 설정을 자동으로 수행합니다.
"""

import sys
import subprocess
import os
from pathlib import Path
import urllib.request

def check_python_version():
    """Python 버전 확인"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 이상이 필요합니다.")
        print(f"현재 버전: {sys.version}")
        return False
    
    print(f"✅ Python 버전 확인: {sys.version}")
    return True

def install_packages():
    """필수 패키지 설치"""
    print("\n📦 필수 패키지 설치 중...")
    
    try:
        # 최소 요구사항부터 설치
        minimal_packages = [
            'opencv-python>=4.5.0',
            'numpy>=1.19.0',
            'pillow>=8.0.0',
            'requests>=2.25.0',
            'matplotlib>=3.3.0'
        ]
        
        # pip 업그레이드
        print("⬆️ pip 업그레이드 중...")
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '--upgrade', 'pip'])
        
        # 최소 패키지 먼저 설치
        print("📦 기본 패키지 설치 중...")
        for package in minimal_packages:
            try:
                subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])
                print(f"✅ {package.split('>=')[0]} 설치 완료")
            except subprocess.CalledProcessError:
                print(f"⚠️ {package.split('>=')[0]} 설치 실패 - 계속 진행")
        
        # 선택적 패키지 설치 (실패해도 계속 진행)
        optional_packages = [
            'torch>=1.12.0',
            'torchvision>=0.13.0', 
            'ultralytics>=8.0.0',
            'transformers>=4.20.0'
        ]
        
        print("\n📦 고급 패키지 설치 중 (실패해도 괜찮습니다)...")
        for package in optional_packages:
            try:
                subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])
                print(f"✅ {package.split('>=')[0]} 설치 완료")
            except subprocess.CalledProcessError:
                print(f"⚠️ {package.split('>=')[0]} 설치 실패 - Haar Cascade 모드만 사용 가능")
        
        print("✅ 패키지 설치 완료!")
        return True
        
    except Exception as e:
        print(f"❌ 패키지 설치 실패: {e}")
        print("수동으로 pip install opencv-python numpy pillow 를 실행해보세요.")
        return False

def setup_directories():
    """필요한 디렉토리 생성"""
    print("\n📁 디렉토리 설정 중...")
    
    directories = [
        'output',
        'logs', 
        'models/haar_cascades',
        'test_images'
    ]
    
    for dir_name in directories:
        dir_path = Path(__file__).parent / dir_name
        dir_path.mkdir(parents=True, exist_ok=True)
        print(f"✅ 디렉토리 생성: {dir_path}")
    
    return True

def test_imports():
    """모듈 import 테스트"""
    print("\n🧪 모듈 import 테스트 중...")
    
    test_modules = [
        'cv2',
        'numpy', 
        'PIL',
        'torch',
        'ultralytics'
    ]
    
    failed_modules = []
    
    for module_name in test_modules:
        try:
            __import__(module_name)
            print(f"✅ {module_name}")
        except ImportError:
            print(f"❌ {module_name}")
            failed_modules.append(module_name)
    
    if failed_modules:
        print(f"\n⚠️ 다음 모듈들이 설치되지 않았습니다: {failed_modules}")
        print("pip install -r requirements.txt 를 다시 실행해보세요.")
        return False
    
    return True

def download_test_image():
    """테스트 이미지 다운로드"""
    print("\n🖼️ 테스트 이미지 다운로드 중...")
    
    test_image_url = "https://images.unsplash.com/photo-1551717743-49959800b1f6?w=800"
    test_image_path = Path(__file__).parent / 'test_images' / 'sample_dog.jpg'
    
    try:
        if not test_image_path.exists():
            urllib.request.urlretrieve(test_image_url, str(test_image_path))
            print(f"✅ 테스트 이미지 다운로드 완료: {test_image_path}")
        else:
            print("✅ 테스트 이미지가 이미 있습니다.")
        
        return True
        
    except Exception as e:
        print(f"⚠️ 테스트 이미지 다운로드 실패: {e}")
        print("수동으로 테스트 이미지를 test_images/ 폴더에 넣어주세요.")
        return True  # 실패해도 계속 진행

def test_yolo_model():
    """YOLO 모델 다운로드 및 테스트"""
    print("\n🚀 YOLO 모델 테스트 중...")
    
    try:
        from ultralytics import YOLO
        
        print("YOLO 모델 다운로드 중... (처음 실행시만)")
        model = YOLO('yolov8n.pt')  # 가장 작은 모델로 테스트
        print("✅ YOLO 모델 로드 성공!")
        
        return True
        
    except Exception as e:
        print(f"❌ YOLO 모델 테스트 실패: {e}")
        return False

def create_sample_config():
    """샘플 설정 파일 생성"""
    print("\n⚙️ 설정 파일 생성 중...")
    
    config_path = Path(__file__).parent / 'config.json'
    
    if config_path.exists():
        print("✅ 설정 파일이 이미 있습니다.")
        return True
    
    sample_config = {
        "detection": {
            "yolo_model_size": "n",
            "yolo_confidence": 0.5,
            "haar_scale_factor": 1.1,
            "haar_min_neighbors": 5,
            "haar_min_size": [50, 50],
            "huggingface_model": "animal-classification", 
            "huggingface_confidence": 0.5
        },
        "visualization": {
            "font_scale": 0.6,
            "thickness": 2,
            "show_confidence": True,
            "show_detector_name": True
        },
        "output": {
            "save_images": True,
            "save_json": True,
            "output_directory": "output",
            "image_quality": 95
        },
        "performance": {
            "batch_size": 8,
            "max_image_size": [1920, 1080],
            "video_skip_frames": 5
        }
    }
    
    try:
        import json
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(sample_config, f, indent=2, ensure_ascii=False)
        
        print(f"✅ 설정 파일 생성 완료: {config_path}")
        return True
        
    except Exception as e:
        print(f"❌ 설정 파일 생성 실패: {e}")
        return False

def run_basic_test():
    """기본 기능 테스트"""
    print("\n🧪 기본 기능 테스트 중...")
    
    try:
        # OpenCV 기본 테스트
        import cv2
        import numpy as np
        print(f"✅ OpenCV 버전: {cv2.__version__}")
        
        # 간단한 이미지 생성 및 처리 테스트
        test_img = np.zeros((100, 100, 3), dtype=np.uint8)
        cv2.rectangle(test_img, (10, 10), (90, 90), (255, 255, 255), -1)
        print("✅ OpenCV 기본 기능 작동")
        
        # Haar Cascade 기본 테스트
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        if not face_cascade.empty():
            print("✅ Haar Cascade 기본 기능 작동")
        
        # 모듈 import 테스트 (선택적)
        try:
            sys.path.insert(0, str(Path(__file__).parent))
            from models.haar_detector import HaarDogDetector
            print("✅ 커스텀 모듈 import 성공")
        except Exception as e:
            print(f"⚠️ 커스텀 모듈 import 실패: {e} (Haar Cascade만 사용 가능)")
        
        return True
        
    except Exception as e:
        print(f"❌ 기본 테스트 실패: {e}")
        return False

def print_usage_info():
    """사용법 안내"""
    print("\n" + "="*60)
    print("🎉 Animal Face Detection System 설정 완료!")
    print("="*60)
    
    print("\n📖 사용법:")
    print("1. 명령행 인터페이스:")
    print("   python main.py --image test_images/sample_dog.jpg")
    print("   python main.py --webcam")
    print("   python main.py --info")
    
    print("\n2. GUI 인터페이스:")
    print("   python gui.py")
    
    print("\n3. 프로그래밍 사용:")
    print("   from main import AnimalFaceDetectionSystem")
    print("   system = AnimalFaceDetectionSystem()")
    print("   results = system.detect_from_image('your_image.jpg')")
    
    print("\n📁 주요 파일:")
    print("   - main.py: 명령행 인터페이스")
    print("   - gui.py: 그래픽 사용자 인터페이스")  
    print("   - config.json: 설정 파일")
    print("   - output/: 결과 저장 폴더")
    
    print("\n🔧 문제 해결:")
    print("   - 로그 확인: logs/ 폴더")
    print("   - 설정 수정: config.json 편집")
    print("   - 재설치: python setup.py")
    
    print("\n🚀 즐거운 동물 탐지 되세요!")

def main():
    """메인 설정 프로세스"""
    print("🐕 Animal Face Detection System - 자동 설정")
    print("=" * 60)
    
    # 설정 단계들
    setup_steps = [
        ("Python 버전 확인", check_python_version),
        ("필수 패키지 설치", install_packages),
        ("디렉토리 설정", setup_directories),
        ("모듈 import 테스트", test_imports),
        ("테스트 이미지 다운로드", download_test_image),
        ("YOLO 모델 테스트", test_yolo_model),
        ("설정 파일 생성", create_sample_config),
        ("기본 기능 테스트", run_basic_test)
    ]
    
    # 각 단계 실행
    success_count = 0
    for step_name, step_func in setup_steps:
        print(f"\n🔄 {step_name}...")
        try:
            if step_func():
                success_count += 1
            else:
                print(f"⚠️ {step_name} 실패 - 계속 진행합니다.")
        except KeyboardInterrupt:
            print(f"\n❌ 사용자에 의해 중단됨")
            return False
        except Exception as e:
            print(f"❌ {step_name} 중 오류: {e}")
    
    # 결과 요약
    total_steps = len(setup_steps)
    if success_count == total_steps:
        print(f"\n🎉 모든 설정 완료! ({success_count}/{total_steps})")
        print_usage_info()
        return True
    elif success_count >= total_steps * 0.7:  # 70% 이상 성공
        print(f"\n✅ 기본 설정 완료! ({success_count}/{total_steps})")
        print("일부 선택적 기능에 문제가 있을 수 있지만 기본 사용은 가능합니다.")
        print_usage_info()
        return True
    else:
        print(f"\n❌ 설정 실패 ({success_count}/{total_steps})")
        print("requirements.txt 파일과 Python 환경을 확인해주세요.")
        return False

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n❌ 설정이 중단되었습니다.")
    except Exception as e:
        print(f"\n❌ 설정 중 오류 발생: {e}")
        print("수동으로 pip install -r requirements.txt 를 실행해보세요.")