#!/usr/bin/env python3
"""
🐕 수정된 동물 얼굴 탐지기
문제 해결된 안정적인 버전
"""

import cv2
import numpy as np
from pathlib import Path
import argparse
import os

def check_requirements():
    """필요한 패키지 확인"""
    try:
        from ultralytics import YOLO
        print("✅ YOLO 사용 가능")
        return True
    except ImportError:
        print("❌ YOLO 설치 필요: pip install ultralytics torch")
        return False

class SimpleFaceDetector:
    """간단하고 안정적인 얼굴 탐지기"""
    
    # COCO 동물 클래스
    ANIMAL_CLASSES = {
        15: 'cat',
        16: 'dog',
        17: 'horse',
        18: 'sheep',
        19: 'cow',
        20: 'elephant',
        21: 'bear',
        22: 'zebra',
        23: 'giraffe'
    }
    
    def __init__(self, model_size='n', confidence=0.5):
        """탐지기 초기화"""
        from ultralytics import YOLO
        
        self.confidence = confidence
        print(f"🚀 YOLO{model_size} 로딩 중...")
        self.yolo_model = YOLO(f'yolov8{model_size}.pt')
        print("✅ YOLO 로드 완료!")
        
        # Haar Cascade (선택적)
        self.use_haar = False
        try:
            # OpenCV 기본 고양이 얼굴 탐지기
            cat_path = cv2.data.haarcascades + 'haarcascade_frontalcatface_extended.xml'
            self.cat_cascade = cv2.CascadeClassifier(cat_path)
            
            if not self.cat_cascade.empty():
                print("✅ 고양이 Haar Cascade 로드됨")
                self.use_haar = True
            else:
                print("⚠️ Haar Cascade 사용 불가")
                
        except:
            print("⚠️ Haar Cascade 로드 실패")
        
        print("✅ 얼굴 탐지기 준비 완료!")
    
    def estimate_face_bbox(self, body_bbox, animal_type):
        """전신 박스에서 얼굴 영역 추정"""
        x1, y1, x2, y2 = body_bbox
        width = x2 - x1
        height = y2 - y1
        
        # 동물별 얼굴 위치 비율
        face_configs = {
            'dog': {'x_offset': 0.3, 'y_offset': 0.15, 'w_ratio': 0.4, 'h_ratio': 0.35},
            'cat': {'x_offset': 0.25, 'y_offset': 0.1, 'w_ratio': 0.5, 'h_ratio': 0.4},
            'horse': {'x_offset': 0.2, 'y_offset': 0.05, 'w_ratio': 0.6, 'h_ratio': 0.3},
            'default': {'x_offset': 0.25, 'y_offset': 0.1, 'w_ratio': 0.5, 'h_ratio': 0.4}
        }
        
        config = face_configs.get(animal_type, face_configs['default'])
        
        # 얼굴 박스 계산
        face_x1 = int(x1 + width * config['x_offset'])
        face_y1 = int(y1 + height * config['y_offset'])
        face_x2 = int(face_x1 + width * config['w_ratio'])
        face_y2 = int(face_y1 + height * config['h_ratio'])
        
        # 이미지 경계 확인은 호출하는 곳에서 처리
        return (face_x1, face_y1, face_x2, face_y2)
    
    def detect_faces(self, image_path):
        """이미지에서 동물 얼굴 탐지"""
        # 경로 정규화
        image_path = str(image_path).strip()
        
        # 파일 존재 및 유형 확인
        if not os.path.exists(image_path):
            print(f"❌ 파일을 찾을 수 없습니다: {image_path}")
            return [], None
        
        # 폴더인지 확인
        if os.path.isdir(image_path):
            print(f"❌ 폴더가 아닌 이미지 파일을 지정하세요: {image_path}")
            print("폴더 내 이미지 파일들:")
            try:
                image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'}
                image_files = [f for f in os.listdir(image_path) 
                             if Path(f).suffix.lower() in image_extensions]
                for img_file in image_files[:5]:  # 최대 5개만 표시
                    print(f"  - {os.path.join(image_path, img_file)}")
                if len(image_files) > 5:
                    print(f"  ... 그 외 {len(image_files) - 5}개 파일")
            except:
                pass
            return [], None
        
        # 파일인지 확인
        if not os.path.isfile(image_path):
            print(f"❌ 유효한 파일이 아닙니다: {image_path}")
            return [], None
        
        # 이미지 파일 확장자 확인
        valid_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp', '.gif'}
        file_ext = Path(image_path).suffix.lower()
        if file_ext not in valid_extensions:
            print(f"❌ 지원하지 않는 이미지 형식: {file_ext}")
            print(f"지원 형식: {', '.join(valid_extensions)}")
            return [], None
        
        # 이미지 로드
        try:
            image = cv2.imread(image_path, cv2.IMREAD_COLOR)
            if image is None:
                print(f"❌ 이미지 로드 실패 - 파일이 손상되었거나 지원하지 않는 형식: {image_path}")
                return [], None
        except Exception as e:
            print(f"❌ 이미지 로드 중 오류: {e}")
            return [], None
        
        h, w = image.shape[:2]
        print(f"🔍 이미지 처리: {Path(image_path).name} ({w}x{h})")
        
        # YOLO 추론
        try:
            results = self.yolo_model(image, verbose=False)
        except Exception as e:
            print(f"❌ YOLO 추론 실패: {e}")
            return [], image
        
        faces = []
        result_image = image.copy()
        
        # 결과 처리
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    class_id = int(box.cls[0])
                    confidence = float(box.conf[0])
                    
                    # 동물이고 신뢰도 조건 만족
                    if (class_id in self.ANIMAL_CLASSES and 
                        confidence >= self.confidence):
                        
                        # 전신 박스
                        x1, y1, x2, y2 = [int(coord) for coord in box.xyxy[0].cpu().numpy()]
                        animal_type = self.ANIMAL_CLASSES[class_id]
                        
                        print(f"  📍 {animal_type} 발견 (신뢰도: {confidence:.3f})")
                        
                        # 얼굴 영역 추정
                        face_bbox = self.estimate_face_bbox((x1, y1, x2, y2), animal_type)
                        
                        # 이미지 경계 조정
                        fx1, fy1, fx2, fy2 = face_bbox
                        fx1 = max(0, min(fx1, w))
                        fy1 = max(0, min(fy1, h))
                        fx2 = max(fx1, min(fx2, w))
                        fy2 = max(fy1, min(fy2, h))
                        
                        # 유효한 크기인지 확인
                        if fx2 > fx1 and fy2 > fy1:
                            face_info = {
                                'animal': animal_type,
                                'bbox': (fx1, fy1, fx2, fy2),
                                'confidence': confidence,
                                'method': 'YOLO+Estimation'
                            }
                            faces.append(face_info)
                            
                            # 얼굴 박스 그리기 (노란색)
                            cv2.rectangle(result_image, (fx1, fy1), (fx2, fy2), 
                                        (0, 255, 255), 3)
                            
                            # 라벨
                            label = f"{animal_type} face: {confidence:.2f}"
                            cv2.putText(result_image, label, (fx1, fy1 - 10),
                                      cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
        
        # 결과 출력
        if faces:
            print(f"🎉 {len(faces)}개 얼굴 탐지됨!")
            for i, face in enumerate(faces, 1):
                bbox = face['bbox']
                print(f"  {i}. {face['animal']} 얼굴: {face['confidence']:.3f} at {bbox}")
        else:
            print("❌ 동물 얼굴이 탐지되지 않았습니다.")
        
        return faces, result_image
    
    def save_results(self, image, faces, original_path):
        """결과를 원본 이미지와 같은 폴더에 저장"""
        original_path = Path(original_path)
        
        # 원본 이미지가 있는 폴더
        source_folder = original_path.parent
        base_name = original_path.stem
        
        # 결과 이미지 저장 (같은 폴더에)
        output_filename = f"{base_name}_face_detected.jpg"
        output_path = source_folder / output_filename
        cv2.imwrite(str(output_path), image)
        print(f"💾 결과 저장: {output_path}")
        
        # 개별 얼굴 크롭 저장
        if faces:
            # 원본 폴더 내에 faces 서브폴더 생성
            faces_dir = source_folder / f"{base_name}_faces"
            faces_dir.mkdir(exist_ok=True)
            
            original_image = cv2.imread(str(original_path))
            
            for i, face in enumerate(faces, 1):
                x1, y1, x2, y2 = face['bbox']
                
                # 얼굴 크롭
                face_crop = original_image[y1:y2, x1:x2]
                
                if face_crop.size > 0:
                    face_filename = f"face_{i}_{face['animal']}.jpg"
                    face_path = faces_dir / face_filename
                    
                    cv2.imwrite(str(face_path), face_crop)
                    print(f"  💾 얼굴 {i} 저장: {face_path}")
        
        return str(output_path)
    
    def detect_webcam(self):
        """웹캠 실시간 얼굴 탐지"""
        print("📹 실시간 얼굴 탐지 시작 (ESC로 종료)")
        
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("❌ 웹캠 접근 실패")
            return
        
        frame_count = 0
        total_faces = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_count += 1
            h, w = frame.shape[:2]
            
            # 매 5프레임마다 탐지 (성능 최적화)
            if frame_count % 5 == 0:
                try:
                    results = self.yolo_model(frame, verbose=False)
                    
                    for result in results:
                        boxes = result.boxes
                        if boxes is not None:
                            for box in boxes:
                                class_id = int(box.cls[0])
                                confidence = float(box.conf[0])
                                
                                if (class_id in self.ANIMAL_CLASSES and 
                                    confidence >= self.confidence):
                                    
                                    x1, y1, x2, y2 = [int(coord) for coord in box.xyxy[0].cpu().numpy()]
                                    animal_type = self.ANIMAL_CLASSES[class_id]
                                    
                                    # 얼굴 영역 추정
                                    face_bbox = self.estimate_face_bbox((x1, y1, x2, y2), animal_type)
                                    fx1, fy1, fx2, fy2 = face_bbox
                                    
                                    # 경계 조정
                                    fx1 = max(0, min(fx1, w))
                                    fy1 = max(0, min(fy1, h))
                                    fx2 = max(fx1, min(fx2, w))
                                    fy2 = max(fy1, min(fy2, h))
                                    
                                    if fx2 > fx1 and fy2 > fy1:
                                        total_faces += 1
                                        
                                        # 얼굴 박스 (노란색)
                                        cv2.rectangle(frame, (fx1, fy1), (fx2, fy2), 
                                                    (0, 255, 255), 2)
                                        
                                        # 라벨
                                        label = f"{animal_type} face"
                                        cv2.putText(frame, label, (fx1, fy1 - 10),
                                                  cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
                except:
                    pass  # 실시간에서는 에러 무시
            
            # 정보 표시
            cv2.putText(frame, f"Faces: {total_faces}", (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
            cv2.putText(frame, "FACE DETECTION MODE", (10, 60),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
            cv2.putText(frame, "Press ESC to quit", (10, frame.shape[0] - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            
            cv2.imshow('Animal Face Detection', frame)
            
            if cv2.waitKey(1) & 0xFF == 27:  # ESC
                break
        
        cap.release()
        cv2.destroyAllWindows()
        print(f"✅ 얼굴 탐지 종료 - 총 {total_faces}개 얼굴 탐지")

def main():
    parser = argparse.ArgumentParser(description='🐕 수정된 동물 얼굴 탐지')
    parser.add_argument('--image', '-i', help='탐지할 이미지 파일')
    parser.add_argument('--webcam', '-w', action='store_true', help='웹캠 얼굴 탐지')
    parser.add_argument('--model', '-m', default='n', choices=['n', 's', 'm', 'l'],
                       help='YOLO 모델 크기')
    parser.add_argument('--confidence', '-c', type=float, default=0.5,
                       help='신뢰도 임계값')
    
    args = parser.parse_args()
    
    print("🐕 수정된 동물 얼굴 탐지 시스템")
    print("=" * 50)
    
    # 필요한 패키지 확인
    if not check_requirements():
        return
    
    # 탐지기 초기화
    try:
        detector = SimpleFaceDetector(
            model_size=args.model,
            confidence=args.confidence
        )
    except Exception as e:
        print(f"❌ 탐지기 초기화 실패: {e}")
        return
    
    # 실행
    if args.image:
        if os.path.exists(args.image):
            faces, result_img = detector.detect_faces(args.image)
            
            if result_img is not None:
                # 결과 저장
                detector.save_results(result_img, faces, args.image)
                
                # 결과 표시
                cv2.imshow('Face Detection Result', result_img)
                print("\n🖼️ 결과 창이 열렸습니다.")
                print("- 노란색 박스: 탐지된 얼굴")
                print("- extracted_faces/ 폴더에 개별 얼굴 저장됨")
                print("- 아무 키나 누르면 닫힙니다.")
                cv2.waitKey(0)
                cv2.destroyAllWindows()
        else:
            print(f"❌ 이미지 파일을 찾을 수 없습니다: {args.image}")
    
    elif args.webcam:
        detector.detect_webcam()
    
    else:
        print("사용법:")
        print("  이미지 얼굴 탐지: python fixed_face_detector.py --image dog.jpg")
        print("  웹캠 얼굴 탐지: python fixed_face_detector.py --webcam")
        print("  고성능 모델: python fixed_face_detector.py --image dog.jpg --model s")

if __name__ == "__main__":
    main()