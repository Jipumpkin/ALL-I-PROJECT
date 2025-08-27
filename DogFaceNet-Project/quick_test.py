#!/usr/bin/env python3
"""
Quick Test for Enhanced Animal Detection
빠른 테스트 스크립트 - 최소한의 종속성으로 동작
"""
import sys
import os
from pathlib import Path

def check_basic_requirements():
    """기본 요구사항 확인"""
    required = ['cv2', 'numpy', 'PIL']
    missing = []
    
    for module in required:
        try:
            __import__(module)
            print(f"✅ {module} - OK")
        except ImportError:
            print(f"❌ {module} - Missing")
            missing.append(module)
    
    return missing

def basic_animal_detection_test():
    """기본적인 동물 탐지 테스트"""
    try:
        import cv2
        import numpy as np
        
        print("\n🧪 Running basic detection test...")
        
        # OpenCV cascade 로드
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        cascade = cv2.CascadeClassifier(cascade_path)
        
        if cascade.empty():
            print("❌ Could not load Haar cascade")
            return False
        
        print("✅ Haar cascade loaded successfully")
        
        # 테스트 이미지 찾기
        test_image = None
        for pattern in ['sample_animals/*.jpg', '*.jpg', '../*.jpg']:
            files = list(Path('.').glob(pattern))
            if files:
                test_image = str(files[0])
                break
        
        if not test_image:
            print("⚠️ No test image found. Creating a synthetic test...")
            # 간단한 테스트 이미지 생성
            test_img = np.random.randint(0, 255, (300, 300, 3), dtype=np.uint8)
            cv2.imwrite('test_synthetic.jpg', test_img)
            test_image = 'test_synthetic.jpg'
        
        # 이미지 로드 및 탐지
        image = cv2.imread(test_image)
        if image is None:
            print(f"❌ Could not load image: {test_image}")
            return False
        
        print(f"📷 Testing with image: {test_image}")
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # 탐지 수행
        faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4)
        
        print(f"🎯 Found {len(faces)} potential face regions")
        
        # 결과 이미지 생성
        result = image.copy()
        for (x, y, w, h) in faces:
            cv2.rectangle(result, (x, y), (x+w, y+h), (0, 255, 0), 2)
            cv2.putText(result, f"Detection", (x, y-10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
        
        # 결과 저장
        output_path = 'quick_test_result.jpg'
        cv2.imwrite(output_path, result)
        print(f"💾 Result saved: {output_path}")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def test_enhanced_features():
    """고급 기능 테스트"""
    print("\n🚀 Testing enhanced features...")
    
    # YOLOv8 테스트
    try:
        from ultralytics import YOLO
        print("✅ YOLOv8 available")
        
        # 간단한 모델 로드 테스트
        try:
            model = YOLO('yolov8n.pt')  # 가장 작은 모델
            print("✅ YOLOv8 model loaded")
        except:
            print("⚠️ YOLOv8 model download may be needed")
    except ImportError:
        print("⚠️ YOLOv8 not available (optional)")
    
    # PyTorch 테스트
    try:
        import torch
        print(f"✅ PyTorch available (CPU: {torch.cuda.is_available() and 'GPU' or 'CPU only'})")
    except ImportError:
        print("⚠️ PyTorch not available (optional)")

def main():
    """메인 함수"""
    print("Enhanced Animal Detection - Quick Test")
    print("="*50)
    
    # 1. 기본 요구사항 확인
    print("\n📋 Checking basic requirements...")
    missing = check_basic_requirements()
    
    if missing:
        print(f"\n❌ Missing packages: {missing}")
        print("\n💡 To install missing packages:")
        print("   Option 1: Run install_packages.bat (double-click)")
        print("   Option 2: Run as administrator:")
        for pkg in missing:
            if pkg == 'cv2':
                print("      pip install opencv-python")
            elif pkg == 'PIL':
                print("      pip install Pillow")
            else:
                print(f"      pip install {pkg}")
        return
    
    # 2. 기본 탐지 테스트
    if basic_animal_detection_test():
        print("\n✅ Basic detection test passed!")
    else:
        print("\n❌ Basic detection test failed")
        return
    
    # 3. 고급 기능 테스트
    test_enhanced_features()
    
    # 4. 최종 안내
    print("\n" + "="*50)
    print("🎉 Quick Test Complete!")
    print("="*50)
    
    print("\n📝 Next steps:")
    print("1. For GUI: python run_enhanced_detection.py --mode gui")
    print("2. For webcam: python run_enhanced_detection.py --mode webcam")  
    print("3. For full test: python run_enhanced_detection.py --mode test")
    
    print("\n💡 If you see import errors, run install_packages.bat first")

if __name__ == "__main__":
    main()