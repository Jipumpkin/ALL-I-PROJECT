#!/usr/bin/env python3
"""
🐕 Animal Face Detection - 빠른 시작
최소한의 설정으로 동물 얼굴 탐지 테스트
"""

import sys
import subprocess
from pathlib import Path

def install_minimal_requirements():
    """최소 요구사항만 설치"""
    minimal_packages = [
        'opencv-python', 
        'numpy', 
        'pillow',
        'requests'
    ]
    
    print("📦 최소 패키지 설치 중...")
    for package in minimal_packages:
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', package], 
                                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print(f"✅ {package} 설치됨")
        except:
            print(f"❌ {package} 설치 실패")
    
    print("설치 완료!")

def test_basic_functionality():
    """기본 기능 테스트"""
    try:
        import cv2
        import numpy as np
        print(f"✅ OpenCV 버전: {cv2.__version__}")
        
        # Haar Cascade 테스트
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        if face_cascade.empty():
            print("❌ Haar Cascade 로드 실패")
            return False
        
        print("✅ 기본 기능 모두 작동!")
        return True
        
    except Exception as e:
        print(f"❌ 테스트 실패: {e}")
        return False

def main():
    """메인 실행"""
    print("🐕 Animal Face Detection - 빠른 시작")
    print("=" * 40)
    
    # 1. 최소 패키지 설치
    install_minimal_requirements()
    
    # 2. 기본 기능 테스트
    if test_basic_functionality():
        print("\n🎉 준비 완료!")
        print("\n다음 명령어로 테스트해보세요:")
        print("python simple_test.py")
        print("\n또는 OpenCV만으로 간단히:")
        print("python -c \"import cv2; print(f'OpenCV {cv2.__version__} 설치됨!')\"")
    else:
        print("\n❌ 설정에 문제가 있습니다.")
        print("pip install opencv-python numpy pillow 를 직접 실행해보세요.")

if __name__ == "__main__":
    main()