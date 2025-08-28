#!/usr/bin/env python3
"""
🐕 동물 얼굴 전용 탐지 시스템
YOLO + 얼굴 영역 추출 + Haar Cascade 조합으로 얼굴만 정확히 탐지
"""

import cv2
import numpy as np
from pathlib import Path
import argparse

def check_requirements():
    """필요한 패키지 확인"""
    try:
        from ultralytics import YOLO
        import torch
        print("✅ YOLO 사용 가능")
        return True
    except ImportError:
        print("❌ YOLO 설치 필요: pip install ultralytics torch")
        return False

class AnimalFaceOnlyDetector:
    """동물 얼굴만 탐지하는 시스템"""
    
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
        """
        얼굴 탐지기 초기화
        
        Args:
            model_size: YOLO 모델 크기
            confidence: 신뢰도 임계값
        """
        from ultralytics import YOLO
        
        self.confidence = confidence
        print(f"🚀 YOLO{model_size} 로딩 중...")
        self.yolo_model = YOLO(f'yolov8{model_size}.pt')
        
        # Haar Cascade 로드 (얼굴 정제용)
        self.dog_face_cascade = None
        self.cat_face_cascade = None
        
        try:
            # 고양이 얼굴 Haar Cascade (OpenCV 기본)
            cat_cascade_path = cv2.data.haarcascades + 'haarcascade_frontalcatface_extended.xml'
            self.cat_face_cascade = cv2.CascadeClassifier(cat_cascade_path)
            
            if not self.cat_face_cascade.empty():
                print("✅ 고양이 Haar Cascade 로드 완료")
            else:
                print("⚠️ 고양이 Haar Cascade 로드 실패")
                self.cat_face_cascade = None
            
        except Exception as e:
            print(f"⚠️ Haar Cascade 로드 실패: {e}")
        
        # 개 얼굴용으로는 사람 얼굴 Haar Cascade 사용 (대안)
        try:
            human_face_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            self.dog_face_cascade = cv2.CascadeClassifier(human_face_path)
            if not self.dog_face_cascade.empty():
                print("✅ 범용 얼굴 Haar Cascade 로드 완료 (개 얼굴용 대체)")
            else:
                self.dog_face_cascade = None
        except:
            pass
        
        if self.dog_face_cascade is None and self.cat_face_cascade is None:
            print("⚠️ Haar Cascade 사용 불가 (YOLO 추정만 사용)")
        
        print("✅ 얼굴 탐지기 준비 완료!")
    
    def estimate_face_region(self, animal_bbox, animal_type):
        """
        동물 전신 박스에서 얼굴 영역 추정
        
        Args:
            animal_bbox: (x1, y1, x2, y2) 동물 전신 박스
            animal_type: 동물 종류 ('dog', 'cat', 등)
            
        Returns:
            (x1, y1, x2, y2) 추정된 얼굴 박스
        """
        x1, y1, x2, y2 = animal_bbox
        width = x2 - x1
        height = y2 - y1
        
        # 동물별 얼굴 위치 비율 (경험적 수치)
        face_ratios = {
            'dog': {'x_ratio': 0.3, 'y_ratio': 0.15, 'w_ratio': 0.4, 'h_ratio': 0.35},
            'cat': {'x_ratio': 0.25, 'y_ratio': 0.1, 'w_ratio': 0.5, 'h_ratio': 0.4},
            'horse': {'x_ratio': 0.2, 'y_ratio': 0.05, 'w_ratio': 0.6, 'h_ratio': 0.3},
            'cow': {'x_ratio': 0.25, 'y_ratio': 0.1, 'w_ratio': 0.5, 'h_ratio': 0.35},
            'default': {'x_ratio': 0.25, 'y_ratio': 0.1, 'w_ratio': 0.5, 'h_ratio': 0.4}
        }
        
        ratio = face_ratios.get(animal_type, face_ratios['default'])
        
        # 얼굴 박스 계산
        face_x1 = int(x1 + width * ratio['x_ratio'])
        face_y1 = int(y1 + height * ratio['y_ratio'])
        face_x2 = int(face_x1 + width * ratio['w_ratio'])
        face_y2 = int(face_y1 + height * ratio['h_ratio'])
        
        return (face_x1, face_y1, face_x2, face_y2)
    
    def refine_face_with_haar(self, image, face_region, animal_type):
        """
        Haar Cascade로 얼굴 영역 정제
        
        Args:
            image: 원본 이미지
            face_region: 추정된 얼굴 영역
            animal_type: 동물 종류
            
        Returns:
            정제된 얼굴 박스들
        """
        x1, y1, x2, y2 = face_region
        
        # 얼굴 영역 추출
        face_roi = image[y1:y2, x1:x2]
        if face_roi.size == 0:
            return []
        
        # 그레이스케일 변환
        gray_roi = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
        
        refined_faces = []
        
        # 동물 종류에 따른 Haar Cascade 선택
        if animal_type == 'dog' and self.dog_face_cascade is not None:
            faces = self.dog_face_cascade.detectMultiScale(
                gray_roi, scaleFactor=1.1, minNeighbors=3, minSize=(30, 30)
            )
            
            for (fx, fy, fw, fh) in faces:
                # 원본 이미지 좌표로 변환
                abs_face = (x1 + fx, y1 + fy, x1 + fx + fw, y1 + fy + fh)
                refined_faces.append({
                    'bbox': abs_face,
                    'confidence': 0.9,  # Haar는 신뢰도가 없으므로 고정값
                    'method': 'Haar+YOLO',
                    'animal': animal_type
                })
        
        elif animal_type == 'cat' and self.cat_face_cascade is not None:
            faces = self.cat_face_cascade.detectMultiScale(
                gray_roi, scaleFactor=1.1, minNeighbors=3, minSize=(30, 30)
            )
            
            for (fx, fy, fw, fh) in faces:
                abs_face = (x1 + fx, y1 + fy, x1 + fx + fw, y1 + fy + fh)
                refined_faces.append({
                    'bbox': abs_face,
                    'confidence': 0.9,
                    'method': 'Haar+YOLO',
                    'animal': animal_type
                })
        
        # Haar로 찾지 못한 경우 추정된 얼굴 영역 사용
        if not refined_faces:
            refined_faces.append({
                'bbox': face_region,
                'confidence': 0.7,
                'method': 'YOLO-Estimated',
                'animal': animal_type
            })
        
        return refined_faces
    
    def detect_faces_only(self, image_path, save_result=True):
        """
        이미지에서 동물 얼굴만 탐지
        
        Args:
            image_path: 이미지 파일 경로
            save_result: 결과 저장 여부
            
        Returns:
            얼굴 탐지 결과 리스트
        """
        # 이미지 로드 (OpenCV 직접 사용, ultralytics 패치 우회)
        try:
            import os
            if not os.path.exists(image_path):
                print(f"❌ 파일을 찾을 수 없습니다: {image_path}")
                return []
                
            # OpenCV 원본 함수 직접 사용
            image = cv2.imread(str(image_path), cv2.IMREAD_COLOR)
            if image is None:
                print(f"❌ 이미지 로드 실패: {image_path}")
                return []
        except Exception as e:
            print(f"❌ 이미지 로드 중 오류: {e}")
            return []
        
        print(f"🔍 얼굴 탐지 실행: {Path(image_path).name}")
        
        # 1단계: YOLO로 동물 전신 탐지
        yolo_results = self.yolo_model(image, verbose=False)
        
        all_faces = []
        result_image = image.copy()
        
        for result in yolo_results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    class_id = int(box.cls[0])
                    confidence = float(box.conf[0])
                    
                    # 동물 클래스이고 임계값 이상인 경우
                    if (class_id in self.ANIMAL_CLASSES and 
                        confidence >= self.confidence):
                        
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        animal_bbox = (int(x1), int(y1), int(x2), int(y2))
                        animal_type = self.ANIMAL_CLASSES[class_id]
                        
                        print(f"  📍 {animal_type} 발견 (신뢰도: {confidence:.3f})")
                        
                        # 2단계: 얼굴 영역 추정
                        estimated_face = self.estimate_face_region(animal_bbox, animal_type)
                        
                        # 3단계: Haar Cascade로 얼굴 정제
                        refined_faces = self.refine_face_with_haar(
                            image, estimated_face, animal_type
                        )
                        
                        all_faces.extend(refined_faces)
        
        # 결과 시각화
        face_count = 0
        for face in all_faces:
            face_count += 1
            x1, y1, x2, y2 = face['bbox']
            
            # 얼굴 박스 (더 두껍게)
            color = (0, 255, 255)  # 노란색 (얼굴 전용)
            cv2.rectangle(result_image, (x1, y1), (x2, y2), color, 3)
            
            # 라벨
            label = f"{face['animal']} face: {face['confidence']:.2f}"
            label_bg_color = (0, 0, 0)  # 검은 배경
            
            # 라벨 배경
            label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
            cv2.rectangle(result_image, (x1, y1 - label_size[1] - 10),
                         (x1 + label_size[0], y1), label_bg_color, -1)
            
            # 라벨 텍스트
            cv2.putText(result_image, label, (x1, y1 - 5),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
            
            # 얼굴 번호
            cv2.putText(result_image, str(face_count), (x1 + 5, y1 + 25),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
        
        # 결과 출력
        if all_faces:
            print(f"🎉 {len(all_faces)}개 얼굴 탐지됨!")
            for i, face in enumerate(all_faces, 1):
                print(f"  {i}. {face['animal']} 얼굴 ({face['method']}): {face['confidence']:.3f}")
        else:
            print("❌ 동물 얼굴이 탐지되지 않았습니다.")
        
        # 결과 저장
        if save_result:
            output_path = f"faces_only_{Path(image_path).name}"
            cv2.imwrite(output_path, result_image)
            print(f"💾 얼굴 결과 저장: {output_path}")
            
            # 개별 얼굴 크롭 저장
            self.save_individual_faces(image, all_faces, Path(image_path).stem)
        
        return all_faces, result_image
    
    def save_individual_faces(self, original_image, faces, base_name):
        """개별 얼굴들을 크롭해서 저장"""
        faces_dir = Path("extracted_faces")
        faces_dir.mkdir(exist_ok=True)
        
        for i, face in enumerate(faces, 1):
            x1, y1, x2, y2 = face['bbox']
            
            # 얼굴 영역 크롭
            face_crop = original_image[y1:y2, x1:x2]
            
            if face_crop.size > 0:
                # 크롭된 얼굴 저장
                face_filename = f"{base_name}_face_{i}_{face['animal']}.jpg"
                face_path = faces_dir / face_filename
                
                cv2.imwrite(str(face_path), face_crop)
                print(f"  💾 얼굴 {i} 저장: {face_path}")
    
    def detect_webcam_faces(self):
        """웹캠에서 실시간 얼굴만 탐지"""
        print("📹 실시간 얼굴 탐지 시작 (ESC로 종료)")
        
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("❌ 웹캠 접근 실패")
            return
        
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        
        frame_count = 0
        total_faces = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_count += 1
            
            # 매 5프레임마다 탐지 (성능 최적화)
            if frame_count % 5 == 0:
                # YOLO 추론
                yolo_results = self.yolo_model(frame, verbose=False)
                
                for result in yolo_results:
                    boxes = result.boxes
                    if boxes is not None:
                        for box in boxes:
                            class_id = int(box.cls[0])
                            confidence = float(box.conf[0])
                            
                            if (class_id in self.ANIMAL_CLASSES and 
                                confidence >= self.confidence):
                                
                                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                                animal_bbox = (int(x1), int(y1), int(x2), int(y2))
                                animal_type = self.ANIMAL_CLASSES[class_id]
                                
                                # 얼굴 영역 추정
                                face_bbox = self.estimate_face_region(animal_bbox, animal_type)
                                fx1, fy1, fx2, fy2 = face_bbox
                                
                                total_faces += 1
                                
                                # 얼굴 박스 그리기 (노란색)
                                cv2.rectangle(frame, (fx1, fy1), (fx2, fy2), 
                                            (0, 255, 255), 2)
                                
                                # 라벨
                                label = f"{animal_type} face"
                                cv2.putText(frame, label, (fx1, fy1 - 10),
                                          cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
            
            # 정보 표시
            cv2.putText(frame, f"Faces: {total_faces}", (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
            cv2.putText(frame, "FACE DETECTION MODE", (10, 60),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
            cv2.putText(frame, "Press ESC to quit", (10, frame.shape[0] - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            
            cv2.imshow('Animal Face Detection Only', frame)
            
            if cv2.waitKey(1) & 0xFF == 27:  # ESC
                break
        
        cap.release()
        cv2.destroyAllWindows()
        print(f"✅ 얼굴 탐지 종료 - 총 {total_faces}개 얼굴 탐지")

def main():
    parser = argparse.ArgumentParser(description='🐕 동물 얼굴만 탐지')
    parser.add_argument('--image', '-i', help='탐지할 이미지 파일')
    parser.add_argument('--webcam', '-w', action='store_true', help='웹캠 얼굴 탐지')
    parser.add_argument('--model', '-m', default='n', choices=['n', 's', 'm', 'l'],
                       help='YOLO 모델 크기')
    parser.add_argument('--confidence', '-c', type=float, default=0.5,
                       help='신뢰도 임계값')
    
    args = parser.parse_args()
    
    print("🐕 동물 얼굴 전용 탐지 시스템")
    print("=" * 50)
    
    # 필요한 패키지 확인
    if not check_requirements():
        return
    
    # 탐지기 초기화
    try:
        detector = AnimalFaceOnlyDetector(
            model_size=args.model,
            confidence=args.confidence
        )
    except Exception as e:
        print(f"❌ 탐지기 초기화 실패: {e}")
        return
    
    # 실행
    if args.image:
        if Path(args.image).exists():
            faces, result_img = detector.detect_faces_only(args.image)
            
            # 결과 이미지 표시
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
        detector.detect_webcam_faces()
    
    else:
        print("사용법:")
        print("  이미지 얼굴 탐지: python face_only_detector.py --image dog.jpg")
        print("  웹캠 얼굴 탐지: python face_only_detector.py --webcam")
        print("  고성능 모델: python face_only_detector.py --image dog.jpg --model s")

if __name__ == "__main__":
    main()