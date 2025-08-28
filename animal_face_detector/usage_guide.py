#!/usr/bin/env python3
"""
🐕 동물 얼굴 탐지 사용법 가이드
올바른 사용법과 예시 제공
"""

import os
from pathlib import Path

def show_usage():
    """사용법 안내"""
    print("🐕 동물 얼굴 탐지 시스템 - 올바른 사용법")
    print("=" * 60)
    
    print("\n📖 기본 사용법:")
    print("python fixed_face_detector.py --image [이미지파일경로]")
    
    print("\n✅ 올바른 예시:")
    print("  python fixed_face_detector.py --image dog.jpg")
    print("  python fixed_face_detector.py --image photos/my_cat.png")
    print("  python fixed_face_detector.py --image \"C:/Users/사용자/Desktop/pet.jpg\"")
    
    print("\n❌ 잘못된 예시:")
    print("  python fixed_face_detector.py --image photos/          # 폴더 지정")
    print("  python fixed_face_detector.py --image document.txt    # 이미지가 아닌 파일")
    
    print("\n📁 폴더 내 모든 이미지 처리:")
    print("  python folder_detector.py photos/")
    print("  python folder_detector.py \"C:/Users/사용자/Desktop/pet_photos\"")
    
    print("\n📹 웹캠 실시간 탐지:")
    print("  python fixed_face_detector.py --webcam")
    
    print("\n⚙️ 고급 옵션:")
    print("  python fixed_face_detector.py --image dog.jpg --model s --confidence 0.7")

def check_common_paths():
    """일반적인 경로들 확인"""
    print("\n🔍 현재 폴더의 파일들 확인:")
    print("=" * 40)
    
    current_dir = Path(".")
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'}
    
    # 현재 폴더의 이미지 파일들
    image_files = [f for f in current_dir.iterdir() 
                  if f.is_file() and f.suffix.lower() in image_extensions]
    
    if image_files:
        print("📸 발견된 이미지 파일들:")
        for img_file in image_files[:10]:  # 최대 10개만 표시
            print(f"  ✅ {img_file.name}")
            print(f"     사용법: python fixed_face_detector.py --image {img_file.name}")
        
        if len(image_files) > 10:
            print(f"  ... 그 외 {len(image_files) - 10}개 파일")
    else:
        print("❌ 현재 폴더에 이미지 파일이 없습니다.")
        print("테스트용 이미지를 현재 폴더에 복사하거나 전체 경로를 지정하세요.")
    
    # 일반적인 사진 폴더들 확인
    common_folders = [
        Path.home() / "Pictures",
        Path.home() / "Desktop",  
        Path.home() / "Downloads"
    ]
    
    print("\n📁 일반적인 사진 폴더들:")
    for folder in common_folders:
        if folder.exists():
            image_count = len([f for f in folder.iterdir() 
                             if f.is_file() and f.suffix.lower() in image_extensions])
            if image_count > 0:
                print(f"  ✅ {folder}: {image_count}개 이미지")
                print(f"     폴더 처리: python folder_detector.py \"{folder}\"")
            else:
                print(f"  📁 {folder}: 이미지 없음")
        else:
            print(f"  ❌ {folder}: 폴더 없음")

def create_test_command():
    """테스트 명령어 생성"""
    print("\n🧪 테스트 명령어:")
    print("=" * 30)
    
    # 현재 폴더에서 첫 번째 이미지 파일 찾기
    current_dir = Path(".")
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'}
    
    image_files = [f for f in current_dir.iterdir() 
                  if f.is_file() and f.suffix.lower() in image_extensions]
    
    if image_files:
        first_image = image_files[0].name
        print(f"📸 테스트 이미지: {first_image}")
        print(f"🚀 실행 명령어:")
        print(f"   python fixed_face_detector.py --image {first_image}")
        print(f"\n💡 다른 명령어들:")
        print(f"   python folder_detector.py .")
        print(f"   python fixed_face_detector.py --webcam")
    else:
        print("❌ 테스트할 이미지가 없습니다.")
        print("💡 해결 방법:")
        print("1. 동물 사진을 현재 폴더에 복사")
        print("2. 전체 경로로 이미지 지정")
        print("3. 웹캠으로 테스트: python fixed_face_detector.py --webcam")

def main():
    show_usage()
    check_common_paths()
    create_test_command()
    
    print("\n💡 문제 해결:")
    print("• 파일을 찾을 수 없음 → 전체 경로 사용")
    print("• 폴더 지정 오류 → 이미지 파일 경로 확인")
    print("• 권한 오류 → 파일 접근 권한 확인")
    print("• 한글 경로 문제 → 영문 경로 사용")

if __name__ == "__main__":
    main()