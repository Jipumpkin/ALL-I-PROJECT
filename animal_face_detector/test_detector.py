#!/usr/bin/env python3
"""
Simple test script for animal face detection
English version to avoid encoding issues
"""

import cv2
import os
from pathlib import Path

def test_basic_opencv():
    """Test basic OpenCV functionality"""
    print("1. Testing OpenCV...")
    try:
        print(f"OpenCV version: {cv2.__version__}")
        
        # Create test image
        test_img = cv2.zeros((100, 100, 3), dtype='uint8')
        cv2.rectangle(test_img, (10, 10), (90, 90), (255, 255, 255), -1)
        cv2.imwrite("test_output.jpg", test_img)
        
        if os.path.exists("test_output.jpg"):
            print("✓ Image save/load works")
            os.remove("test_output.jpg")
            return True
        else:
            print("✗ Image save failed")
            return False
            
    except Exception as e:
        print(f"✗ OpenCV error: {e}")
        return False

def test_yolo_import():
    """Test YOLO import"""
    print("\n2. Testing YOLO import...")
    try:
        from ultralytics import YOLO
        print("✓ YOLO import successful")
        
        # Test model loading
        model = YOLO('yolov8n.pt')
        print("✓ YOLO model load successful")
        return True
        
    except ImportError:
        print("✗ YOLO not installed: pip install ultralytics")
        return False
    except Exception as e:
        print(f"✗ YOLO error: {e}")
        return False

def test_face_detector_import():
    """Test face detector import"""
    print("\n3. Testing face detector import...")
    try:
        from fixed_face_detector import SimpleFaceDetector
        
        detector = SimpleFaceDetector()
        print("✓ Face detector initialization successful")
        return True
        
    except Exception as e:
        print(f"✗ Face detector error: {e}")
        return False

def main():
    print("Animal Face Detection - Quick Test")
    print("=" * 40)
    
    tests = [
        test_basic_opencv,
        test_yolo_import,
        test_face_detector_import
    ]
    
    success = 0
    for test in tests:
        if test():
            success += 1
    
    print(f"\nTest results: {success}/{len(tests)} successful")
    
    if success == len(tests):
        print("\n✓ All tests passed!")
        print("\nNext: Test with actual image:")
        print("python fixed_face_detector.py --image your_pet.jpg")
    else:
        print("\n✗ Some tests failed. Check package installation:")
        print("pip install ultralytics opencv-python torch")

if __name__ == "__main__":
    main()