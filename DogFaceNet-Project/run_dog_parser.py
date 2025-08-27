#!/usr/bin/env python3
"""
Dog Face Parser - 통합 실행기
"""
import sys
import argparse
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description="Dog Face Parser System")
    parser.add_argument('--mode', choices=['test', 'gui', 'simple-gui'], 
                       default='gui', help='실행 모드')
    parser.add_argument('--image', type=str, help='테스트할 이미지 경로')
    
    args = parser.parse_args()
    
    print("Dog Face Parser System")
    print("="*40)
    
    if args.mode == 'test':
        print("Running test mode...")
        try:
            from test_dog_parser_fixed import test_with_real_detection
            success = test_with_real_detection()
            
            if success:
                print("\nSUCCESS: Test completed successfully!")
                print("Check these files:")
                print("  - realistic_dog_face.jpg (test image)")
                print("  - dog_face_parsing_result.jpg (analysis result)")
                print("  - extracted_*.jpg (face regions)")
            else:
                print("\nFAILED: Test failed")
        except Exception as e:
            print(f"Test error: {e}")
    
    elif args.mode == 'gui':
        print("Starting advanced GUI...")
        try:
            from dog_face_parser_gui import main as gui_main
            gui_main()
        except ImportError as e:
            print(f"Advanced GUI not available: {e}")
            print("Falling back to simple GUI...")
            try:
                from simple_dog_gui import main as simple_gui_main
                simple_gui_main()
            except ImportError:
                print("No GUI available. Try --mode test")
    
    elif args.mode == 'simple-gui':
        print("Starting simple GUI...")
        try:
            from simple_dog_gui import main as simple_gui_main
            simple_gui_main()
        except ImportError as e:
            print(f"Simple GUI not available: {e}")

if __name__ == "__main__":
    main()