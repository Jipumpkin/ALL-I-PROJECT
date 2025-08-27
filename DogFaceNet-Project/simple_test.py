#!/usr/bin/env python3
"""
Simple Animal Detection Test - Windows Compatible
"""
import sys
import os
from pathlib import Path

def check_packages():
    """패키지 확인"""
    required = ['cv2', 'numpy', 'PIL']
    missing = []
    
    print("Checking required packages...")
    for module in required:
        try:
            __import__(module)
            print(f"OK: {module}")
        except ImportError:
            print(f"MISSING: {module}")
            missing.append(module)
    
    return missing

def simple_detection_test():
    """간단한 탐지 테스트"""
    try:
        import cv2
        import numpy as np
        
        print("\nRunning detection test...")
        
        # Haar cascade 로드
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        cascade = cv2.CascadeClassifier(cascade_path)
        
        if cascade.empty():
            print("ERROR: Could not load cascade")
            return False
        
        print("SUCCESS: Cascade loaded")
        
        # 테스트용 이미지 생성
        print("Creating test image...")
        test_img = np.ones((400, 400, 3), dtype=np.uint8) * 128
        cv2.circle(test_img, (200, 150), 50, (255, 255, 255), -1)  # 얼굴 모양
        cv2.circle(test_img, (180, 130), 8, (0, 0, 0), -1)        # 눈
        cv2.circle(test_img, (220, 130), 8, (0, 0, 0), -1)        # 눈
        cv2.ellipse(test_img, (200, 170), (15, 8), 0, 0, 360, (0, 0, 0), -1)  # 코
        
        cv2.imwrite('test_face.jpg', test_img)
        print("Test image saved: test_face.jpg")
        
        # 탐지 수행
        gray = cv2.cvtColor(test_img, cv2.COLOR_BGR2GRAY)
        faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4)
        
        print(f"Detections found: {len(faces)}")
        
        # 결과 저장
        result = test_img.copy()
        for (x, y, w, h) in faces:
            cv2.rectangle(result, (x, y), (x+w, y+h), (0, 255, 0), 2)
        
        cv2.imwrite('detection_result.jpg', result)
        print("Result saved: detection_result.jpg")
        
        return True
        
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def main():
    print("Enhanced Animal Detection - Simple Test")
    print("="*45)
    
    # 패키지 확인
    missing = check_packages()
    
    if missing:
        print(f"\nMissing packages: {', '.join(missing)}")
        print("\nTo install:")
        for pkg in missing:
            if pkg == 'cv2':
                print("  pip install opencv-python")
            elif pkg == 'PIL':
                print("  pip install Pillow") 
            else:
                print(f"  pip install {pkg}")
        
        print("\nOr run: install_packages.bat")
        return
    
    # 탐지 테스트
    if simple_detection_test():
        print("\nSUCCESS: Basic detection works!")
        print("\nNext steps:")
        print("1. python run_enhanced_detection.py --mode gui")
        print("2. python run_enhanced_detection.py --mode test")
    else:
        print("\nFAILED: Detection test failed")

if __name__ == "__main__":
    main()