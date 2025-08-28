#!/usr/bin/env python3
"""
Enhanced Detection Test - Windows Compatible
"""
import sys
from pathlib import Path

def test_enhanced_detection():
    """Enhanced Detection 테스트"""
    try:
        # 모듈 import 테스트
        print("Testing enhanced_animal_detector import...")
        from enhanced_animal_detector import EnhancedAnimalDetector
        print("SUCCESS: enhanced_animal_detector imported")
        
        # 탐지기 초기화
        print("Initializing detector...")
        detector = EnhancedAnimalDetector()
        print("SUCCESS: Detector initialized")
        
        # 테스트 이미지 찾기
        test_image = None
        for pattern in ['*.jpg', 'sample_animals/*.jpg', 'test*.jpg']:
            files = list(Path('.').glob(pattern))
            if files:
                test_image = str(files[0])
                break
        
        if not test_image:
            print("No test image found. Creating one...")
            # 이전에 생성한 테스트 이미지 사용
            test_image = 'test_face.jpg'
            if not Path(test_image).exists():
                print("Please run simple_test.py first to create test image")
                return False
        
        print(f"Using test image: {test_image}")
        
        # Ensemble 탐지 수행
        print("Running ensemble detection...")
        final_image, detections, method_images = detector.ensemble_detection(test_image)
        
        print(f"Detections found: {len(detections)}")
        for i, det in enumerate(detections, 1):
            method = det.get('method', 'Unknown')
            conf = det.get('confidence', 0)
            bbox = det.get('bbox', (0,0,0,0))
            print(f"  {i}. {method}: confidence={conf:.3f}, bbox={bbox}")
        
        # 결과 저장
        print("Saving results...")
        detector.save_results(final_image, detections, 'enhanced_test_result.jpg')
        print("SUCCESS: Results saved to enhanced_test_result.jpg")
        
        return True
        
    except ImportError as e:
        print(f"IMPORT ERROR: {e}")
        print("Some packages may be missing. Try:")
        print("  pip install scikit-learn")
        return False
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_basic_features():
    """기본 기능 테스트"""
    print("Testing basic OpenCV detection...")
    
    try:
        import cv2
        import numpy as np
        
        # Cascade 테스트
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        cascade = cv2.CascadeClassifier(cascade_path)
        
        if cascade.empty():
            print("ERROR: Could not load cascade")
            return False
            
        print("SUCCESS: Basic cascade works")
        
        # 간단한 전처리 테스트
        test_img = np.ones((100, 100), dtype=np.uint8) * 128
        
        # CLAHE
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced = clahe.apply(test_img)
        print("SUCCESS: CLAHE preprocessing works")
        
        # Gaussian blur
        blurred = cv2.GaussianBlur(test_img, (5, 5), 0)
        print("SUCCESS: Gaussian blur works")
        
        return True
        
    except Exception as e:
        print(f"ERROR in basic test: {e}")
        return False

def main():
    print("Enhanced Animal Detection - Compatibility Test")
    print("=" * 50)
    
    # 기본 기능 테스트
    print("\n1. Testing basic features...")
    if not test_basic_features():
        print("Basic features failed")
        return
    
    # Enhanced 기능 테스트
    print("\n2. Testing enhanced detection...")
    if test_enhanced_detection():
        print("\nSUCCESS: Enhanced detection works!")
        print("\nYou can now use:")
        print("  - Basic GUI: python integrated_animal_gui.py")
        print("  - Enhanced features with available packages")
    else:
        print("\nPartial success: Basic detection works, enhanced features need more packages")
        print("To get full functionality, install:")
        print("  pip install scikit-learn ultralytics torch")

if __name__ == "__main__":
    main()