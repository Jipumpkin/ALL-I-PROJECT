#!/usr/bin/env python3
"""
Enhanced Animal Detection - Main Runner
개선된 동물 얼굴 탐지 시스템 통합 실행기
"""
import sys
import argparse
from pathlib import Path
import subprocess

def check_requirements():
    """필수 패키지 확인"""
    required_packages = {
        'cv2': 'opencv-python',
        'numpy': 'numpy',
        'PIL': 'Pillow',
        'torch': 'torch',
        'sklearn': 'scikit-learn'
    }
    
    optional_packages = {
        'ultralytics': 'ultralytics',
        'mediapipe': 'mediapipe',
        'psutil': 'psutil',
        'matplotlib': 'matplotlib',
        'seaborn': 'seaborn'
    }
    
    missing_required = []
    missing_optional = []
    
    # 필수 패키지 체크
    for module, package in required_packages.items():
        try:
            __import__(module)
        except ImportError:
            missing_required.append(package)
    
    # 선택적 패키지 체크
    for module, package in optional_packages.items():
        try:
            __import__(module)
        except ImportError:
            missing_optional.append(package)
    
    return missing_required, missing_optional

def install_packages(packages):
    """패키지 설치"""
    for package in packages:
        print(f"Installing {package}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])

def run_enhanced_gui():
    """Enhanced GUI 실행"""
    try:
        from enhanced_gui import main as gui_main
        print("🚀 Starting Enhanced Animal Detection GUI...")
        gui_main()
    except ImportError as e:
        print(f"❌ Enhanced GUI를 실행할 수 없습니다: {e}")
        print("enhanced_gui.py 파일이 있는지 확인하세요.")

def run_realtime_detection(mode="gui", **kwargs):
    """실시간 탐지 실행"""
    try:
        if mode == "gui":
            from realtime_animal_detector import RealTimeGUI
            print("🎥 Starting Real-time Detection GUI...")
            gui = RealTimeGUI()
            gui.run()
        elif mode == "webcam":
            from realtime_animal_detector import RealTimeAnimalDetector
            print("📹 Starting webcam detection...")
            detector = RealTimeAnimalDetector()
            detector.start_webcam_detection(kwargs.get('camera', 0))
        elif mode == "video":
            from realtime_animal_detector import RealTimeAnimalDetector
            video_path = kwargs.get('video')
            if not video_path:
                print("❌ 비디오 경로가 필요합니다.")
                return
            print(f"🎬 Starting video detection: {video_path}")
            detector = RealTimeAnimalDetector()
            detector.start_video_detection(video_path)
    except ImportError as e:
        print(f"❌ 실시간 탐지를 실행할 수 없습니다: {e}")

def run_performance_benchmark():
    """성능 벤치마크 실행"""
    try:
        from performance_optimizer import main as benchmark_main
        print("📊 Starting Performance Benchmark...")
        benchmark_main()
    except ImportError as e:
        print(f"❌ 성능 벤치마크를 실행할 수 없습니다: {e}")

def run_basic_test(image_path):
    """기본 탐지 테스트"""
    try:
        from enhanced_animal_detector import EnhancedAnimalDetector
        
        if not Path(image_path).exists():
            print(f"❌ 이미지 파일을 찾을 수 없습니다: {image_path}")
            return
        
        print(f"🧪 Testing enhanced detection on: {image_path}")
        
        detector = EnhancedAnimalDetector()
        final_image, detections, method_images = detector.ensemble_detection(image_path)
        
        if detections:
            print(f"✅ Found {len(detections)} detections:")
            for i, det in enumerate(detections, 1):
                method = det.get('method', 'Unknown')
                conf = det['confidence']
                bbox = det['bbox']
                print(f"   {i}. {method}: {conf:.3f} at {bbox}")
        else:
            print("⚠️ No detections found")
        
        # 결과 저장
        output_path = "test_result.jpg"
        detector.save_results(final_image, detections, output_path)
        print(f"💾 Results saved: {output_path}")
        
    except ImportError as e:
        print(f"❌ Enhanced detector를 실행할 수 없습니다: {e}")
    except Exception as e:
        print(f"❌ 테스트 중 오류 발생: {e}")

def main():
    """메인 실행 함수"""
    parser = argparse.ArgumentParser(
        description="Enhanced Animal Detection System",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_enhanced_detection.py --mode gui              # GUI 실행
  python run_enhanced_detection.py --mode realtime        # 실시간 탐지 GUI
  python run_enhanced_detection.py --mode webcam          # 웹캠 탐지
  python run_enhanced_detection.py --mode video --video path/to/video.mp4
  python run_enhanced_detection.py --mode benchmark       # 성능 벤치마크
  python run_enhanced_detection.py --mode test --image path/to/image.jpg
  python run_enhanced_detection.py --install              # 패키지 설치
        """
    )
    
    parser.add_argument('--mode', 
                       choices=['gui', 'realtime', 'webcam', 'video', 'benchmark', 'test'],
                       default='gui',
                       help='실행 모드')
    
    parser.add_argument('--image', type=str,
                       help='테스트할 이미지 경로 (test 모드)')
    
    parser.add_argument('--video', type=str,
                       help='비디오 파일 경로 (video 모드)')
    
    parser.add_argument('--camera', type=int, default=0,
                       help='카메라 ID (webcam 모드)')
    
    parser.add_argument('--install', action='store_true',
                       help='필수 패키지 설치')
    
    parser.add_argument('--check', action='store_true',
                       help='패키지 상태 확인')
    
    args = parser.parse_args()
    
    print("🐕 Enhanced Animal Detection System v2.0")
    print("="*50)
    
    # 패키지 설치
    if args.install:
        print("📦 Checking and installing required packages...")
        missing_required, missing_optional = check_requirements()
        
        if missing_required:
            print(f"Installing required packages: {missing_required}")
            install_packages(missing_required)
        
        if missing_optional:
            print(f"\nOptional packages available: {missing_optional}")
            response = input("Install optional packages? [y/N]: ")
            if response.lower() == 'y':
                install_packages(missing_optional)
        
        print("✅ Package installation complete!")
        return
    
    # 패키지 상태 확인
    if args.check:
        missing_required, missing_optional = check_requirements()
        
        print("📋 Package Status:")
        if not missing_required and not missing_optional:
            print("✅ All packages are installed!")
        else:
            if missing_required:
                print(f"❌ Missing required: {missing_required}")
            if missing_optional:
                print(f"⚠️ Missing optional: {missing_optional}")
            print("\nRun with --install to install missing packages")
        return
    
    # 패키지 상태 확인
    missing_required, missing_optional = check_requirements()
    if missing_required:
        print(f"❌ Missing required packages: {missing_required}")
        print("Run with --install to install them")
        return
    
    # 모드별 실행
    try:
        if args.mode == 'gui':
            run_enhanced_gui()
        
        elif args.mode == 'realtime':
            run_realtime_detection(mode="gui")
        
        elif args.mode == 'webcam':
            run_realtime_detection(mode="webcam", camera=args.camera)
        
        elif args.mode == 'video':
            if not args.video:
                print("❌ --video 인자가 필요합니다")
                return
            run_realtime_detection(mode="video", video=args.video)
        
        elif args.mode == 'benchmark':
            run_performance_benchmark()
        
        elif args.mode == 'test':
            if not args.image:
                # 기본 테스트 이미지 찾기
                test_images = []
                for pattern in ['sample_animals/*.jpg', 'test_images/*.jpg', '*.jpg']:
                    test_images.extend(Path('.').glob(pattern))
                
                if test_images:
                    args.image = str(test_images[0])
                    print(f"Using default test image: {args.image}")
                else:
                    print("❌ --image 인자가 필요합니다")
                    return
            
            run_basic_test(args.image)
    
    except KeyboardInterrupt:
        print("\n⏸️ Interrupted by user")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()