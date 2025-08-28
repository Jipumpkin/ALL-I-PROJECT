#!/usr/bin/env python3
"""
ASCII-only test script for animal face detection
Avoids Unicode encoding issues on Windows
"""

import cv2
import numpy as np
import os

def test_opencv():
    """Test OpenCV basic functionality"""
    print("Testing OpenCV...")
    try:
        print("OpenCV version:", cv2.__version__)
        
        # Create test image using numpy
        test_img = np.zeros((100, 100, 3), dtype=np.uint8)
        cv2.rectangle(test_img, (10, 10), (90, 90), (255, 255, 255), -1)
        cv2.imwrite("test_output.jpg", test_img)
        
        if os.path.exists("test_output.jpg"):
            print("OK - Image save/load works")
            os.remove("test_output.jpg")
            return True
        else:
            print("FAIL - Image save failed")
            return False
            
    except Exception as e:
        print("FAIL - OpenCV error:", str(e))
        return False

def test_yolo():
    """Test YOLO"""
    print("Testing YOLO...")
    try:
        from ultralytics import YOLO
        print("OK - YOLO import successful")
        
        model = YOLO('yolov8n.pt')
        print("OK - YOLO model loaded")
        return True
        
    except ImportError:
        print("FAIL - YOLO not installed")
        return False
    except Exception as e:
        print("FAIL - YOLO error:", str(e))
        return False

def test_detector_import():
    """Test our custom detector import"""
    print("Testing face detector import...")
    try:
        # Try importing without initializing (to avoid model loading)
        import importlib.util
        spec = importlib.util.spec_from_file_location("fixed_face_detector", "fixed_face_detector.py")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        print("OK - Face detector module imported")
        return True
        
    except Exception as e:
        print("FAIL - Face detector import error:", str(e))
        return False

def main():
    print("Animal Face Detection Test")
    print("=" * 30)
    
    opencv_ok = test_opencv()
    yolo_ok = test_yolo()
    detector_ok = test_detector_import()
    
    print("\nResults:")
    print("OpenCV:", "OK" if opencv_ok else "FAIL")
    print("YOLO:", "OK" if yolo_ok else "FAIL")
    print("Detector:", "OK" if detector_ok else "FAIL")
    
    total_ok = sum([opencv_ok, yolo_ok, detector_ok])
    print("Total:", f"{total_ok}/3 systems ready")
    
    if total_ok >= 2:
        print("\nSystem is mostly ready!")
        print("Try: python fixed_face_detector.py --help")
    else:
        print("\nSome components failed")
        print("Install: pip install ultralytics opencv-python torch")

if __name__ == "__main__":
    main()