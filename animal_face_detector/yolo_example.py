#!/usr/bin/env python3
"""
🐕 YOLO 동물 탐지 예제
Ultralytics YOLO를 사용한 실시간 동물 탐지
"""

import cv2
import numpy as np
from pathlib import Path

def test_yolo_installation():
    """YOLO 설치 확인"""
    try:
        from ultralytics import YOLO
        print("✅ YOLO 설치 확인됨")
        return True
    except ImportError:
        print("❌ YOLO가 설치되지 않았습니다.")
        print("다음 명령어로 설치하세요:")
        print("pip install ultralytics torch torchvision")
        return False

def simple_yolo_detection(image_path):
    """간단한 YOLO 동물 탐지"""
    try:
        from ultralytics import YOLO
        
        # YOLO 모델 로드 (처음 실행시 자동 다운로드)
        print("🚀 YOLO 모델 로딩 중...")
        model = YOLO('yolov8n.pt')  # nano 버전 (가장 빠름)
        
        # 이미지 로드
        image = cv2.imread(image_path)
        if image is None:
            print(f"❌ 이미지를 찾을 수 없습니다: {image_path}")
            return
        
        print(f"📸 이미지 처리 중: {image_path}")
        
        # YOLO 추론 실행
        results = model(image)
        
        # COCO 데이터셋의 동물 클래스 ID
        animal_classes = {
            15: 'cat',      # 고양이
            16: 'dog',      # 개  
            17: 'horse',    # 말
            18: 'sheep',    # 양
            19: 'cow',      # 소
            20: 'elephant', # 코끼리
            21: 'bear',     # 곰
            22: 'zebra',    # 얼룩말
            23: 'giraffe'   # 기린
        }
        
        # 결과 처리
        detected_animals = []
        
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    class_id = int(box.cls[0])
                    confidence = float(box.conf[0])
                    
                    # 동물 클래스이고 신뢰도가 0.5 이상인 경우
                    if class_id in animal_classes and confidence >= 0.5:
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        
                        animal_info = {
                            'animal': animal_classes[class_id],
                            'confidence': confidence,
                            'bbox': (int(x1), int(y1), int(x2), int(y2))
                        }
                        detected_animals.append(animal_info)
                        
                        # 바운딩 박스 그리기
                        cv2.rectangle(image, (int(x1), int(y1)), (int(x2), int(y2)), 
                                    (0, 255, 0), 2)
                        
                        # 라벨 텍스트
                        label = f"{animal_classes[class_id]}: {confidence:.2f}"
                        cv2.putText(image, label, (int(x1), int(y1) - 10),
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        
        # 결과 출력
        if detected_animals:
            print(f"🎉 {len(detected_animals)}마리 동물 탐지됨!")
            for i, animal in enumerate(detected_animals, 1):
                print(f"  {i}. {animal['animal']}: {animal['confidence']:.3f}")
        else:
            print("❌ 동물이 탐지되지 않았습니다.")
        
        # 결과 이미지 저장
        output_path = f"yolo_result_{Path(image_path).name}"
        cv2.imwrite(output_path, image)
        print(f"💾 결과 저장: {output_path}")
        
        # 결과 이미지 표시 (선택사항)
        cv2.imshow('YOLO Animal Detection', image)
        print("🖼️ 결과 창이 열렸습니다. 아무 키나 누르면 닫힙니다.")
        cv2.waitKey(0)
        cv2.destroyAllWindows()
        
        return detected_animals
        
    except Exception as e:
        print(f"❌ YOLO 탐지 중 오류: {e}")
        return None

def yolo_webcam_detection():
    """YOLO 실시간 웹캠 탐지"""
    try:
        from ultralytics import YOLO
        
        print("🚀 YOLO 웹캠 탐지 시작...")
        model = YOLO('yolov8n.pt')
        
        # 웹캠 열기
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("❌ 웹캠을 열 수 없습니다.")
            return
        
        animal_classes = {
            15: 'cat', 16: 'dog', 17: 'horse', 18: 'sheep', 19: 'cow',
            20: 'elephant', 21: 'bear', 22: 'zebra', 23: 'giraffe'
        }
        
        print("📹 웹캠 탐지 실행 중... (ESC 키로 종료)")
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # YOLO 추론 (매 5프레임마다 실행으로 성능 최적화)
            results = model(frame, verbose=False)
            
            # 결과 그리기
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        class_id = int(box.cls[0])
                        confidence = float(box.conf[0])
                        
                        if class_id in animal_classes and confidence >= 0.5:
                            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                            
                            # 바운딩 박스
                            cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), 
                                        (0, 255, 0), 2)
                            
                            # 라벨
                            label = f"{animal_classes[class_id]}: {confidence:.2f}"
                            cv2.putText(frame, label, (int(x1), int(y1) - 10),
                                      cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            
            # 화면에 표시
            cv2.imshow('YOLO Animal Detection - Webcam', frame)
            
            # ESC 키로 종료
            if cv2.waitKey(1) & 0xFF == 27:
                break
        
        cap.release()
        cv2.destroyAllWindows()
        print("✅ 웹캠 탐지 종료")
        
    except Exception as e:
        print(f"❌ 웹캠 탐지 중 오류: {e}")

def yolo_batch_detection(image_folder):
    """폴더 내 모든 이미지에서 동물 탐지"""
    try:
        from ultralytics import YOLO
        
        model = YOLO('yolov8n.pt')
        image_folder = Path(image_folder)
        
        if not image_folder.exists():
            print(f"❌ 폴더를 찾을 수 없습니다: {image_folder}")
            return
        
        # 지원하는 이미지 형식
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}
        image_files = [f for f in image_folder.iterdir() 
                      if f.suffix.lower() in image_extensions]
        
        if not image_files:
            print(f"❌ {image_folder}에서 이미지를 찾을 수 없습니다.")
            return
        
        print(f"📁 {len(image_files)}개 이미지 처리 시작...")
        
        animal_classes = {
            15: 'cat', 16: 'dog', 17: 'horse', 18: 'sheep', 19: 'cow',
            20: 'elephant', 21: 'bear', 22: 'zebra', 23: 'giraffe'
        }
        
        total_animals = 0
        
        for i, image_file in enumerate(image_files, 1):
            print(f"\n🔍 처리 중 ({i}/{len(image_files)}): {image_file.name}")
            
            # YOLO 추론
            results = model(str(image_file))
            
            detected_count = 0
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        class_id = int(box.cls[0])
                        confidence = float(box.conf[0])
                        
                        if class_id in animal_classes and confidence >= 0.5:
                            animal_name = animal_classes[class_id]
                            print(f"  ✅ {animal_name}: {confidence:.3f}")
                            detected_count += 1
            
            if detected_count == 0:
                print("  ❌ 동물 없음")
            
            total_animals += detected_count
        
        print(f"\n🎉 처리 완료! 총 {total_animals}마리 동물 탐지됨")
        
    except Exception as e:
        print(f"❌ 배치 처리 중 오류: {e}")

def main():
    """메인 실행 함수"""
    print("🐕 YOLO 동물 탐지 예제")
    print("=" * 40)
    
    # YOLO 설치 확인
    if not test_yolo_installation():
        return
    
    while True:
        print("\n선택하세요:")
        print("1. 이미지 파일 탐지")
        print("2. 실시간 웹캠 탐지") 
        print("3. 폴더 일괄 처리")
        print("4. 종료")
        
        choice = input("\n번호 입력: ").strip()
        
        if choice == '1':
            image_path = input("이미지 파일 경로 입력: ").strip()
            if Path(image_path).exists():
                simple_yolo_detection(image_path)
            else:
                print("❌ 파일을 찾을 수 없습니다.")
        
        elif choice == '2':
            yolo_webcam_detection()
        
        elif choice == '3':
            folder_path = input("이미지 폴더 경로 입력: ").strip()
            yolo_batch_detection(folder_path)
        
        elif choice == '4':
            print("👋 종료합니다.")
            break
        
        else:
            print("❌ 잘못된 선택입니다.")

if __name__ == "__main__":
    main()