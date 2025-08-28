#!/usr/bin/env python3
"""
🐕 YOLO 전용 동물 탐지 시스템
다른 모델 없이 YOLO만 사용하는 간단한 버전
"""

import cv2
import numpy as np
import sys
from pathlib import Path
import argparse

def check_yolo():
    """YOLO 설치 확인"""
    try:
        from ultralytics import YOLO
        import torch
        
        print(f"✅ YOLO 사용 가능")
        print(f"✅ PyTorch: {torch.__version__}")
        print(f"✅ CUDA 사용 가능: {torch.cuda.is_available()}")
        return True
    except ImportError as e:
        print(f"❌ YOLO 설치 필요: {e}")
        print("설치 명령어:")
        print("pip install ultralytics torch torchvision")
        return False

class YOLOAnimalDetector:
    """YOLO 전용 동물 탐지기"""
    
    # COCO 데이터셋의 동물 클래스
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
        YOLO 탐지기 초기화
        
        Args:
            model_size: 모델 크기 ('n', 's', 'm', 'l', 'x')
            confidence: 신뢰도 임계값 (0.0 ~ 1.0)
        """
        from ultralytics import YOLO
        
        self.confidence = confidence
        self.model_size = model_size
        
        print(f"🚀 YOLO{model_size} 모델 로딩 중...")
        self.model = YOLO(f'yolov8{model_size}.pt')
        print(f"✅ YOLO 모델 로드 완료!")
    
    def detect_image(self, image_path, save_result=True):
        """이미지에서 동물 탐지"""
        # 이미지 로드
        image = cv2.imread(image_path)
        if image is None:
            print(f"❌ 이미지 로드 실패: {image_path}")
            return []
        
        print(f"🔍 탐지 실행: {Path(image_path).name}")
        
        # YOLO 추론
        results = self.model(image, verbose=False)
        
        # 결과 처리
        detections = []
        result_image = image.copy()
        
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    class_id = int(box.cls[0])
                    confidence = float(box.conf[0])
                    
                    # 동물 클래스이고 임계값 이상인 경우
                    if (class_id in self.ANIMAL_CLASSES and 
                        confidence >= self.confidence):
                        
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        animal_name = self.ANIMAL_CLASSES[class_id]
                        
                        detection = {
                            'animal': animal_name,
                            'confidence': confidence,
                            'bbox': (int(x1), int(y1), int(x2), int(y2))
                        }
                        detections.append(detection)
                        
                        # 시각화
                        color = (0, 255, 0)  # 초록색
                        cv2.rectangle(result_image, (int(x1), int(y1)), 
                                    (int(x2), int(y2)), color, 2)
                        
                        # 라벨 텍스트
                        label = f"{animal_name}: {confidence:.2f}"
                        label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
                        
                        # 라벨 배경
                        cv2.rectangle(result_image, (int(x1), int(y1) - label_size[1] - 10),
                                    (int(x1) + label_size[0], int(y1)), color, -1)
                        
                        # 라벨 텍스트
                        cv2.putText(result_image, label, (int(x1), int(y1) - 5),
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        # 결과 출력
        if detections:
            print(f"🎉 {len(detections)}마리 동물 탐지됨:")
            for i, det in enumerate(detections, 1):
                print(f"  {i}. {det['animal']}: {det['confidence']:.3f}")
        else:
            print("❌ 동물이 탐지되지 않았습니다.")
        
        # 결과 저장
        if save_result:
            output_path = f"yolo_detected_{Path(image_path).name}"
            cv2.imwrite(output_path, result_image)
            print(f"💾 결과 저장: {output_path}")
        
        return detections, result_image
    
    def detect_webcam(self):
        """웹캠 실시간 탐지"""
        print("📹 실시간 웹캠 탐지 시작 (ESC로 종료)")
        
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("❌ 웹캠 접근 실패")
            return
        
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        
        frame_count = 0
        detection_count = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_count += 1
            
            # 매 3프레임마다 탐지 (성능 최적화)
            if frame_count % 3 == 0:
                results = self.model(frame, verbose=False)
                
                for result in results:
                    boxes = result.boxes
                    if boxes is not None:
                        for box in boxes:
                            class_id = int(box.cls[0])
                            confidence = float(box.conf[0])
                            
                            if (class_id in self.ANIMAL_CLASSES and 
                                confidence >= self.confidence):
                                
                                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                                animal_name = self.ANIMAL_CLASSES[class_id]
                                
                                detection_count += 1
                                
                                # 시각화
                                color = (0, 255, 0)
                                cv2.rectangle(frame, (int(x1), int(y1)), 
                                            (int(x2), int(y2)), color, 2)
                                
                                label = f"{animal_name}: {confidence:.2f}"
                                cv2.putText(frame, label, (int(x1), int(y1) - 10),
                                          cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
            
            # 정보 표시
            cv2.putText(frame, f"Detections: {detection_count}", (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            cv2.putText(frame, "Press ESC to quit", (10, frame.shape[0] - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            
            cv2.imshow('YOLO Animal Detection', frame)
            
            if cv2.waitKey(1) & 0xFF == 27:  # ESC
                break
        
        cap.release()
        cv2.destroyAllWindows()
        print(f"✅ 웹캠 탐지 종료 - 총 {detection_count}회 탐지")

def main():
    parser = argparse.ArgumentParser(description='🐕 YOLO 동물 탐지')
    parser.add_argument('--image', '-i', help='탐지할 이미지 파일')
    parser.add_argument('--webcam', '-w', action='store_true', help='웹캠 실시간 탐지')
    parser.add_argument('--model', '-m', default='n', choices=['n', 's', 'm', 'l', 'x'],
                       help='YOLO 모델 크기 (n=nano, s=small, m=medium, l=large, x=xlarge)')
    parser.add_argument('--confidence', '-c', type=float, default=0.5,
                       help='신뢰도 임계값 (0.0-1.0)')
    
    args = parser.parse_args()
    
    print("🐕 YOLO 동물 탐지 시스템")
    print("=" * 40)
    
    # YOLO 확인
    if not check_yolo():
        return
    
    # 탐지기 초기화
    try:
        detector = YOLOAnimalDetector(
            model_size=args.model,
            confidence=args.confidence
        )
    except Exception as e:
        print(f"❌ 탐지기 초기화 실패: {e}")
        return
    
    # 실행
    if args.image:
        if Path(args.image).exists():
            detections, result_img = detector.detect_image(args.image)
            
            # 결과 이미지 표시 (선택사항)
            cv2.imshow('Detection Result', result_img)
            print("결과 창이 열렸습니다. 아무 키나 누르면 닫힙니다.")
            cv2.waitKey(0)
            cv2.destroyAllWindows()
        else:
            print(f"❌ 이미지 파일을 찾을 수 없습니다: {args.image}")
    
    elif args.webcam:
        detector.detect_webcam()
    
    else:
        print("사용법:")
        print("  이미지 탐지: python yolo_only.py --image dog.jpg")
        print("  웹캠 탐지: python yolo_only.py --webcam")
        print("  고성능 모델: python yolo_only.py --image dog.jpg --model l")

if __name__ == "__main__":
    main()