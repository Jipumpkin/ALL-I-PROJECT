#!/usr/bin/env python3
"""
🐕 빠른 테스트 스크립트
문제 해결 확인용
"""

import cv2
import os

def test_opencv():
    """OpenCV 기본 테스트"""
    print("1️⃣ OpenCV 테스트...")
    try:
        print(f"✅ OpenCV 버전: {cv2.__version__}")
        
        # 테스트 이미지 생성
        test_img = cv2.zeros((100, 100, 3), dtype=cv2.uint8)
        cv2.rectangle(test_img, (10, 10), (90, 90), (255, 255, 255), -1)
        cv2.imwrite("test_output.jpg", test_img)
        
        if os.path.exists("test_output.jpg"):
            print("✅ 이미지 저장/로드 작동")
            os.remove("test_output.jpg")
            return True
        else:
            print("❌ 이미지 저장 실패")
            return False
            
    except Exception as e:
        print(f"❌ OpenCV 오류: {e}")
        return False

def test_yolo():
    """YOLO 설치 테스트"""
    print("\n2️⃣ YOLO 테스트...")
    try:
        from ultralytics import YOLO
        print("✅ YOLO import 성공")
        
        # 모델 로드 테스트
        model = YOLO('yolov8n.pt')
        print("✅ YOLO 모델 로드 성공")
        return True
        
    except ImportError:
        print("❌ YOLO 설치 필요: pip install ultralytics")
        return False
    except Exception as e:
        print(f"❌ YOLO 오류: {e}")
        return False

def test_face_detector():
    """얼굴 탐지기 테스트"""
    print("\n3️⃣ 얼굴 탐지기 테스트...")
    try:
        from fixed_face_detector import SimpleFaceDetector
        
        detector = SimpleFaceDetector()
        print("✅ 얼굴 탐지기 초기화 성공")
        return True
        
    except Exception as e:
        print(f"❌ 얼굴 탐지기 오류: {e}")
        return False

def main():
    print("🐕 동물 얼굴 탐지 - 빠른 테스트")
    print("=" * 40)
    
    tests = [
        test_opencv,
        test_yolo,
        test_face_detector
    ]
    
    success = 0
    for test in tests:
        if test():
            success += 1
    
    print(f"\n📊 테스트 결과: {success}/{len(tests)} 성공")
    
    if success == len(tests):
        print("\n🎉 모든 테스트 통과!")
        print("\n다음 명령어로 실제 테스트하세요:")
        print("python fixed_face_detector.py --image your_pet.jpg")
    else:
        print("\n❌ 일부 테스트 실패. 패키지 설치를 확인하세요.")
        print("pip install ultralytics opencv-python torch")

if __name__ == "__main__":
    main()