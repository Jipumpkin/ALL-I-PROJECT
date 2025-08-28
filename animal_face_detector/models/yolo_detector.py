"""
YOLO 기반 동물 탐지 모듈
Ultralytics YOLO 모델을 사용한 실시간 동물 탐지
"""

import cv2
import numpy as np
from pathlib import Path
import logging
from typing import List, Dict, Optional, Tuple

logger = logging.getLogger(__name__)

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    logger.warning("⚠️ Ultralytics YOLO not available. Install with: pip install ultralytics")

class YOLOAnimalDetector:
    """YOLO 기반 동물 탐지기"""
    
    # COCO 데이터셋의 동물 클래스들
    ANIMAL_CLASSES = {
        16: 'dog',
        15: 'cat', 
        17: 'horse',
        18: 'sheep',
        19: 'cow',
        20: 'elephant',
        21: 'bear',
        22: 'zebra',
        23: 'giraffe'
    }
    
    def __init__(self, model_size='n', confidence_threshold=0.5):
        """
        YOLO 탐지기 초기화
        
        Args:
            model_size (str): 모델 크기 ('n', 's', 'm', 'l', 'x')
                - n: nano (가장 빠름, 가장 작음)
                - s: small (균형)
                - m: medium (높은 정확도)
                - l: large (더 높은 정확도)
                - x: extra large (최고 정확도)
            confidence_threshold (float): 탐지 신뢰도 임계값
        """
        if not YOLO_AVAILABLE:
            raise ImportError("Ultralytics YOLO가 설치되지 않았습니다. 'pip install ultralytics'로 설치하세요.")
        
        self.model_size = model_size
        self.confidence_threshold = confidence_threshold
        self.description = f"YOLO{model_size} 동물 탐지기 (신뢰도: {confidence_threshold})"
        
        logger.info(f"🚀 YOLO 모델 로딩 중... (크기: {model_size})")
        
        try:
            # YOLO 모델 로드 (처음 실행시 자동 다운로드)
            model_name = f'yolov8{model_size}.pt'
            self.model = YOLO(model_name)
            
            # GPU 사용 가능 여부 확인
            self.device = 'cuda' if self.model.device.type == 'cuda' else 'cpu'
            logger.info(f"✅ YOLO 모델 로드 완료 (디바이스: {self.device})")
            
        except Exception as e:
            logger.error(f"❌ YOLO 모델 로드 실패: {e}")
            raise
    
    def detect(self, image: np.ndarray) -> List[Dict]:
        """
        이미지에서 동물 탐지
        
        Args:
            image: OpenCV 이미지 (BGR)
            
        Returns:
            List[Dict]: 탐지 결과 리스트
                - bbox: (x, y, w, h) 바운딩 박스
                - confidence: 신뢰도 점수
                - class_name: 동물 종류
                - class_id: COCO 클래스 ID
        """
        if image is None:
            return []
        
        try:
            # YOLO 추론 실행
            results = self.model(image, verbose=False)
            
            detections = []
            
            # 결과 파싱
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        class_id = int(box.cls[0])
                        confidence = float(box.conf[0])
                        
                        # 동물 클래스이고 임계값 이상인 경우만
                        if (class_id in self.ANIMAL_CLASSES and 
                            confidence >= self.confidence_threshold):
                            
                            # 바운딩 박스 좌표 (xyxy -> xywh)
                            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                            x, y, w, h = int(x1), int(y1), int(x2-x1), int(y2-y1)
                            
                            detection = {
                                'bbox': (x, y, w, h),
                                'confidence': confidence,
                                'class_name': self.ANIMAL_CLASSES[class_id],
                                'class_id': class_id,
                                'detector': 'YOLO'
                            }
                            
                            detections.append(detection)
            
            return detections
            
        except Exception as e:
            logger.error(f"YOLO 탐지 중 오류 발생: {e}")
            return []
    
    def detect_batch(self, images: List[np.ndarray]) -> List[List[Dict]]:
        """
        여러 이미지 배치 처리
        
        Args:
            images: 이미지 리스트
            
        Returns:
            각 이미지에 대한 탐지 결과 리스트
        """
        try:
            # 배치 추론
            results = self.model(images, verbose=False)
            
            batch_detections = []
            
            for result in results:
                detections = []
                boxes = result.boxes
                
                if boxes is not None:
                    for box in boxes:
                        class_id = int(box.cls[0])
                        confidence = float(box.conf[0])
                        
                        if (class_id in self.ANIMAL_CLASSES and 
                            confidence >= self.confidence_threshold):
                            
                            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                            x, y, w, h = int(x1), int(y1), int(x2-x1), int(y2-y1)
                            
                            detection = {
                                'bbox': (x, y, w, h),
                                'confidence': confidence,
                                'class_name': self.ANIMAL_CLASSES[class_id],
                                'class_id': class_id,
                                'detector': 'YOLO'
                            }
                            
                            detections.append(detection)
                
                batch_detections.append(detections)
            
            return batch_detections
            
        except Exception as e:
            logger.error(f"YOLO 배치 탐지 중 오류 발생: {e}")
            return [[] for _ in images]
    
    def get_model_info(self) -> Dict:
        """모델 정보 반환"""
        try:
            model_info = {
                'name': f'YOLOv8{self.model_size}',
                'device': self.device,
                'confidence_threshold': self.confidence_threshold,
                'supported_animals': list(self.ANIMAL_CLASSES.values()),
                'total_classes': len(self.ANIMAL_CLASSES)
            }
            
            # 모델 파라미터 수 (가능한 경우)
            if hasattr(self.model.model, 'model'):
                total_params = sum(p.numel() for p in self.model.model.parameters())
                model_info['parameters'] = f"{total_params:,}"
            
            return model_info
            
        except Exception as e:
            logger.error(f"모델 정보 조회 실패: {e}")
            return {}
    
    def set_confidence_threshold(self, threshold: float):
        """신뢰도 임계값 변경"""
        if 0.0 <= threshold <= 1.0:
            self.confidence_threshold = threshold
            logger.info(f"신뢰도 임계값 변경: {threshold}")
        else:
            logger.warning(f"잘못된 신뢰도 임계값: {threshold} (0.0-1.0 범위)")
    
    def benchmark(self, test_images: List[np.ndarray], runs=3) -> Dict:
        """성능 벤치마크 실행"""
        import time
        
        logger.info(f"🚀 YOLO 성능 벤치마크 시작 ({runs}회 실행)")
        
        times = []
        detections_count = []
        
        for run in range(runs):
            start_time = time.time()
            
            total_detections = 0
            for image in test_images:
                results = self.detect(image)
                total_detections += len(results)
            
            end_time = time.time()
            elapsed = end_time - start_time
            
            times.append(elapsed)
            detections_count.append(total_detections)
            
            logger.info(f"  런 {run+1}: {elapsed:.3f}초, {total_detections}개 탐지")
        
        avg_time = np.mean(times)
        avg_detections = np.mean(detections_count)
        fps = len(test_images) / avg_time
        
        benchmark_results = {
            'average_time': avg_time,
            'average_detections': avg_detections,
            'fps': fps,
            'images_count': len(test_images),
            'runs': runs
        }
        
        logger.info(f"📊 벤치마크 결과: {fps:.1f} FPS, 평균 {avg_detections:.1f}개 탐지")
        
        return benchmark_results

class YOLOAnimalDetectorAdvanced(YOLOAnimalDetector):
    """고급 기능이 포함된 YOLO 탐지기"""
    
    def __init__(self, model_size='s', confidence_threshold=0.5, 
                 nms_threshold=0.4, track_enabled=False):
        """
        고급 YOLO 탐지기 초기화
        
        Args:
            nms_threshold: Non-Maximum Suppression 임계값
            track_enabled: 객체 추적 활성화 여부
        """
        super().__init__(model_size, confidence_threshold)
        
        self.nms_threshold = nms_threshold
        self.track_enabled = track_enabled
        self.description = f"고급 YOLO{model_size} 탐지기 (NMS: {nms_threshold}, 추적: {track_enabled})"
        
        if track_enabled:
            logger.info("🎯 객체 추적 기능 활성화")
    
    def detect_with_tracking(self, image: np.ndarray) -> List[Dict]:
        """추적 기능이 포함된 탐지"""
        if not self.track_enabled:
            return self.detect(image)
        
        try:
            # YOLO 추적 모드로 실행
            results = self.model.track(image, verbose=False, persist=True)
            
            detections = []
            
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        class_id = int(box.cls[0])
                        confidence = float(box.conf[0])
                        
                        if (class_id in self.ANIMAL_CLASSES and 
                            confidence >= self.confidence_threshold):
                            
                            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                            x, y, w, h = int(x1), int(y1), int(x2-x1), int(y2-y1)
                            
                            detection = {
                                'bbox': (x, y, w, h),
                                'confidence': confidence,
                                'class_name': self.ANIMAL_CLASSES[class_id],
                                'class_id': class_id,
                                'detector': 'YOLO-Track',
                                'track_id': int(box.id[0]) if box.id is not None else None
                            }
                            
                            detections.append(detection)
            
            return detections
            
        except Exception as e:
            logger.error(f"YOLO 추적 탐지 중 오류 발생: {e}")
            return self.detect(image)  # 추적 실패시 일반 탐지로 폴백