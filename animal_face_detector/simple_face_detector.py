#!/usr/bin/env python3
"""
🐕 간단한 동물 얼굴 탐지기
YOLO + 얼굴 영역 추정만으로 빠르고 간단하게
"""

import cv2
import numpy as np
from pathlib import Path

def detect_animal_faces(image_path, show_result=True):
    """
    간단한 동물 얼굴 탐지 함수
    
    Args:
        image_path: 이미지 파일 경로
        show_result: 결과 표시 여부
    
    Returns:
        얼굴 좌표 리스트
    """
    try:
        from ultralytics import YOLO
    except ImportError:
        print("❌ YOLO 설치 필요: pip install ultralytics")
        return []
    
    # 이미지 로드
    image = cv2.imread(image_path)
    if image is None:
        print(f"❌ 이미지 로드 실패: {image_path}")
        return []
    
    # YOLO 모델 로드
    model = YOLO('yolov8n.pt')
    
    # 동물 클래스 정의
    animals = {15: 'cat', 16: 'dog', 17: 'horse', 18: 'sheep', 19: 'cow'}
    
    # YOLO 추론
    results = model(image, verbose=False)
    
    faces = []
    result_image = image.copy()
    
    for result in results:
        boxes = result.boxes
        if boxes is not None:
            for box in boxes:
                class_id = int(box.cls[0])
                confidence = float(box.conf[0])
                
                # 동물이고 신뢰도가 0.5 이상
                if class_id in animals and confidence >= 0.5:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    animal_name = animals[class_id]
                    
                    # 얼굴 영역 추정 (상단 중앙 부분)
                    body_width = x2 - x1
                    body_height = y2 - y1
                    
                    # 동물별 얼굴 위치 (경험적 비율)
                    if animal_name == 'dog':
                        face_x1 = int(x1 + body_width * 0.3)
                        face_y1 = int(y1 + body_height * 0.15)
                        face_x2 = int(x1 + body_width * 0.7)
                        face_y2 = int(y1 + body_height * 0.5)
                    elif animal_name == 'cat':
                        face_x1 = int(x1 + body_width * 0.25)
                        face_y1 = int(y1 + body_height * 0.1)
                        face_x2 = int(x1 + body_width * 0.75)
                        face_y2 = int(y1 + body_height * 0.5)
                    else:  # 기타 동물
                        face_x1 = int(x1 + body_width * 0.25)
                        face_y1 = int(y1 + body_height * 0.1)
                        face_x2 = int(x1 + body_width * 0.75)
                        face_y2 = int(y1 + body_height * 0.4)
                    
                    # 경계 확인
                    face_x1 = max(0, face_x1)
                    face_y1 = max(0, face_y1)
                    face_x2 = min(image.shape[1], face_x2)
                    face_y2 = min(image.shape[0], face_y2)
                    
                    face_info = {
                        'animal': animal_name,
                        'bbox': (face_x1, face_y1, face_x2, face_y2),
                        'confidence': confidence
                    }
                    faces.append(face_info)
                    
                    # 시각화
                    if show_result:
                        # 얼굴 박스 (노란색)
                        cv2.rectangle(result_image, (face_x1, face_y1), 
                                    (face_x2, face_y2), (0, 255, 255), 3)
                        
                        # 라벨
                        label = f"{animal_name} face: {confidence:.2f}"
                        cv2.putText(result_image, label, (face_x1, face_y1 - 10),
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
    
    # 결과 출력
    print(f"🎉 {len(faces)}개 얼굴 탐지됨!")
    for i, face in enumerate(faces, 1):
        print(f"  {i}. {face['animal']} 얼굴: {face['confidence']:.3f}")
    
    # 결과 표시
    if show_result and faces:
        # 결과 저장
        output_path = f"face_detected_{Path(image_path).name}"
        cv2.imwrite(output_path, result_image)
        print(f"💾 결과 저장: {output_path}")
        
        # 화면 표시
        cv2.imshow('Animal Face Detection', result_image)
        print("🖼️ 노란색 박스가 탐지된 얼굴입니다. 아무 키나 누르세요.")
        cv2.waitKey(0)
        cv2.destroyAllWindows()
    
    return faces

def main():
    """간단한 테스트"""
    import sys
    
    if len(sys.argv) < 2:
        print("사용법: python simple_face_detector.py [이미지파일]")
        print("예시: python simple_face_detector.py dog.jpg")
        return
    
    image_path = sys.argv[1]
    
    if not Path(image_path).exists():
        print(f"❌ 파일을 찾을 수 없습니다: {image_path}")
        return
    
    print("🐕 간단한 동물 얼굴 탐지")
    print("=" * 30)
    
    faces = detect_animal_faces(image_path)
    
    if faces:
        print(f"\n✅ 성공적으로 {len(faces)}개 얼굴을 탐지했습니다!")
    else:
        print("\n❌ 얼굴을 찾지 못했습니다.")

if __name__ == "__main__":
    main()