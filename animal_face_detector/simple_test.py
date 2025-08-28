#!/usr/bin/env python3
"""
🐕 간단한 동물 탐지 테스트 스크립트
최소한의 의존성으로 Haar Cascade 탐지만 테스트
"""

import cv2
import numpy as np
import sys
from pathlib import Path

def test_opencv():
    """OpenCV 설치 및 작동 테스트"""
    try:
        print(f"✅ OpenCV 버전: {cv2.__version__}")
        
        # 간단한 이미지 생성 테스트
        test_img = np.zeros((100, 100, 3), dtype=np.uint8)
        cv2.rectangle(test_img, (10, 10), (90, 90), (255, 255, 255), -1)
        
        print("✅ OpenCV 기본 기능 작동")
        return True
        
    except Exception as e:
        print(f"❌ OpenCV 테스트 실패: {e}")
        return False

def test_haar_cascade():
    """Haar Cascade 기본 테스트"""
    try:
        # OpenCV 기본 얼굴 탐지기 (사람용)
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        if face_cascade.empty():
            print("❌ 기본 Haar Cascade 로드 실패")
            return False
        
        print("✅ Haar Cascade 기본 기능 작동")
        return True
        
    except Exception as e:
        print(f"❌ Haar Cascade 테스트 실패: {e}")
        return False

def simple_detection_test():
    """간단한 탐지 테스트"""
    try:
        from models.haar_detector import HaarDogDetector
        
        # 개 얼굴 탐지기 생성
        detector = HaarDogDetector(model_type='frontal_dog')
        
        # 테스트 이미지 생성 (실제로는 개 이미지가 있어야 함)
        test_image = np.zeros((200, 200, 3), dtype=np.uint8)
        cv2.circle(test_image, (100, 100), 50, (128, 128, 128), -1)
        
        # 탐지 실행
        results = detector.detect(test_image)
        
        print(f"✅ 탐지 기능 작동 - 결과: {len(results)}개")
        return True
        
    except Exception as e:
        print(f"❌ 탐지 테스트 실패: {e}")
        return False

def main():
    """메인 테스트"""
    print("🐕 Animal Face Detection - 간단한 기능 테스트")
    print("=" * 50)
    
    tests = [
        ("OpenCV 설치 테스트", test_opencv),
        ("Haar Cascade 기본 테스트", test_haar_cascade),
        ("간단한 탐지 테스트", simple_detection_test)
    ]
    
    success_count = 0
    for test_name, test_func in tests:
        print(f"\n🔍 {test_name}...")
        try:
            if test_func():
                success_count += 1
        except Exception as e:
            print(f"❌ {test_name} 중 오류: {e}")
    
    print(f"\n📊 테스트 결과: {success_count}/{len(tests)} 성공")
    
    if success_count >= 2:
        print("✅ 기본 기능이 작동합니다!")
        print("\n🚀 다음 명령어로 실행해보세요:")
        print("python -c \"from models.haar_detector import HaarDogDetector; print('모듈 import 성공!')\"")
    else:
        print("❌ 기본 설정에 문제가 있습니다.")
        print("pip install opencv-python numpy pillow 를 실행해보세요.")

if __name__ == "__main__":
    main()