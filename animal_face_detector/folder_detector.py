#!/usr/bin/env python3
"""
🐕 폴더 내 모든 이미지에서 동물 얼굴 탐지
여러 이미지 일괄 처리용
"""

import cv2
import os
from pathlib import Path
import argparse

def find_image_files(folder_path):
    """폴더에서 이미지 파일들 찾기"""
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp', '.gif'}
    
    image_files = []
    folder = Path(folder_path)
    
    if not folder.exists():
        print(f"❌ 폴더를 찾을 수 없습니다: {folder_path}")
        return []
    
    if not folder.is_dir():
        print(f"❌ 폴더가 아닙니다: {folder_path}")
        return []
    
    # 이미지 파일 수집
    for file_path in folder.iterdir():
        if file_path.is_file() and file_path.suffix.lower() in image_extensions:
            image_files.append(str(file_path))
    
    # 하위 폴더도 검색 (선택사항)
    for subfolder in folder.iterdir():
        if subfolder.is_dir():
            for file_path in subfolder.iterdir():
                if file_path.is_file() and file_path.suffix.lower() in image_extensions:
                    image_files.append(str(file_path))
    
    return sorted(image_files)

def process_folder(folder_path, detector=None):
    """폴더 내 모든 이미지 처리"""
    if detector is None:
        # 간단한 탐지기 사용
        try:
            from fixed_face_detector import SimpleFaceDetector
            detector = SimpleFaceDetector()
        except Exception as e:
            print(f"❌ 탐지기 로드 실패: {e}")
            return
    
    # 이미지 파일들 찾기
    image_files = find_image_files(folder_path)
    
    if not image_files:
        print(f"❌ {folder_path}에서 이미지 파일을 찾을 수 없습니다.")
        return
    
    print(f"📁 폴더: {folder_path}")
    print(f"🔍 발견된 이미지: {len(image_files)}개")
    print("=" * 50)
    
    # 원본 폴더 내에 결과 저장 폴더 생성
    source_folder = Path(folder_path)
    output_folder = source_folder / "face_detection_results"
    output_folder.mkdir(exist_ok=True)
    
    total_faces = 0
    processed_count = 0
    
    # 각 이미지 처리
    for i, image_file in enumerate(image_files, 1):
        print(f"\n📸 처리 중 ({i}/{len(image_files)}): {Path(image_file).name}")
        
        try:
            # 얼굴 탐지
            faces, result_img = detector.detect_faces(image_file)
            
            if faces:
                total_faces += len(faces)
                processed_count += 1
                
                # 결과 이미지 저장
                output_name = f"batch_{Path(image_file).stem}_faces.jpg"
                output_path = output_folder / output_name
                cv2.imwrite(str(output_path), result_img)
                
                print(f"  ✅ {len(faces)}개 얼굴 탐지됨 → {output_path}")
                
                # 개별 얼굴 저장
                original_image = cv2.imread(image_file)
                if original_image is not None:
                    faces_subfolder = output_folder / "individual_faces"
                    faces_subfolder.mkdir(exist_ok=True)
                    
                    for j, face in enumerate(faces, 1):
                        x1, y1, x2, y2 = face['bbox']
                        face_crop = original_image[y1:y2, x1:x2]
                        
                        if face_crop.size > 0:
                            face_name = f"{Path(image_file).stem}_face_{j}_{face['animal']}.jpg"
                            face_path = faces_subfolder / face_name
                            cv2.imwrite(str(face_path), face_crop)
            else:
                print("  ❌ 얼굴 없음")
                
        except Exception as e:
            print(f"  ❌ 처리 실패: {e}")
    
    # 결과 요약
    print("\n" + "=" * 50)
    print("🎉 배치 처리 완료!")
    print(f"📊 처리된 이미지: {processed_count}/{len(image_files)}")
    print(f"🐕 총 탐지된 얼굴: {total_faces}개")
    print(f"💾 결과 저장 위치: {output_folder}")
    print("=" * 50)

def main():
    parser = argparse.ArgumentParser(description='🐕 폴더 내 이미지들에서 동물 얼굴 일괄 탐지')
    parser.add_argument('folder', help='처리할 이미지 폴더 경로')
    parser.add_argument('--model', '-m', default='n', choices=['n', 's', 'm', 'l'],
                       help='YOLO 모델 크기')
    parser.add_argument('--confidence', '-c', type=float, default=0.5,
                       help='신뢰도 임계값')
    
    args = parser.parse_args()
    
    print("🐕 폴더 일괄 동물 얼굴 탐지")
    print("=" * 50)
    
    # 폴더 존재 확인
    if not os.path.exists(args.folder):
        print(f"❌ 폴더를 찾을 수 없습니다: {args.folder}")
        return
    
    if not os.path.isdir(args.folder):
        print(f"❌ 폴더가 아닙니다: {args.folder}")
        return
    
    # 탐지기 초기화
    try:
        from fixed_face_detector import SimpleFaceDetector
        detector = SimpleFaceDetector(
            model_size=args.model,
            confidence=args.confidence
        )
    except Exception as e:
        print(f"❌ 탐지기 초기화 실패: {e}")
        return
    
    # 폴더 처리 시작
    process_folder(args.folder, detector)

if __name__ == "__main__":
    main()