"""
Haar Cascade 기반 개 얼굴 탐지 모듈
사전 학습된 개 전용 Haar Cascade 분류기를 사용한 빠른 탐지
"""

import cv2
import numpy as np
import urllib.request
from pathlib import Path
import logging
from typing import List, Dict, Optional
import tempfile
import os

logger = logging.getLogger(__name__)

class HaarDogDetector:
    """Haar Cascade 기반 개 얼굴 탐지기"""
    
    # 사전 학습된 개 얼굴 Haar Cascade 모델들
    HAAR_MODELS = {
        'frontal_dog': {
            'url': 'https://raw.githubusercontent.com/kskd1804/dog_face_haar_cascade/main/haarcascade_frontalface_dog.xml',
            'filename': 'haarcascade_frontalface_dog.xml',
            'description': '정면 개 얼굴 탐지 (kskd1804)'
        },
        'frontal_cat': {
            'url': 'https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalcatface_extended.xml',
            'filename': 'haarcascade_frontalcatface_extended.xml',
            'description': '정면 고양이 얼굴 탐지 (OpenCV 공식)'
        }
    }
    
    def __init__(self, model_type='frontal_dog', scale_factor=1.1, 
                 min_neighbors=5, min_size=(50, 50)):
        """
        Haar Cascade 탐지기 초기화
        
        Args:
            model_type (str): 모델 타입 ('frontal_dog', 'frontal_cat')
            scale_factor (float): 이미지 피라미드의 스케일 팩터
            min_neighbors (int): 최소 이웃 수 (더 높으면 더 엄격한 탐지)
            min_size (tuple): 최소 탐지 크기 (width, height)
        """
        self.model_type = model_type
        self.scale_factor = scale_factor
        self.min_neighbors = min_neighbors
        self.min_size = min_size
        
        self.description = f"Haar Cascade {model_type} 탐지기"
        
        # 모델 디렉토리 설정
        self.models_dir = Path(__file__).parent.parent / 'models' / 'haar_cascades'
        self.models_dir.mkdir(parents=True, exist_ok=True)
        
        # Haar Cascade 분류기 로드
        self.classifier = self._load_haar_cascade()
        
        if self.classifier is None:
            raise RuntimeError(f"❌ {model_type} Haar Cascade 모델을 로드할 수 없습니다.")
        
        logger.info(f"✅ Haar Cascade 탐지기 로드 완료: {model_type}")
    
    def _load_haar_cascade(self) -> Optional[cv2.CascadeClassifier]:
        """Haar Cascade 모델 다운로드 및 로드"""
        if self.model_type not in self.HAAR_MODELS:
            logger.error(f"지원하지 않는 모델 타입: {self.model_type}")
            return None
        
        model_info = self.HAAR_MODELS[self.model_type]
        model_path = self.models_dir / model_info['filename']
        
        # 모델 파일이 없으면 다운로드
        if not model_path.exists():
            logger.info(f"🔽 {model_info['description']} 다운로드 중...")
            try:
                urllib.request.urlretrieve(model_info['url'], str(model_path))
                logger.info(f"✅ 모델 다운로드 완료: {model_path}")
            except Exception as e:
                logger.error(f"❌ 모델 다운로드 실패: {e}")
                return None
        
        # Haar Cascade 분류기 로드
        try:
            classifier = cv2.CascadeClassifier(str(model_path))
            
            # 로드 검증
            if classifier.empty():
                logger.error(f"❌ Haar Cascade 파일이 비어있거나 손상됨: {model_path}")
                return None
            
            return classifier
            
        except Exception as e:
            logger.error(f"❌ Haar Cascade 로드 실패: {e}")
            return None
    
    def detect(self, image: np.ndarray) -> List[Dict]:
        """
        이미지에서 동물 얼굴 탐지
        
        Args:
            image: OpenCV 이미지 (BGR)
            
        Returns:
            List[Dict]: 탐지 결과 리스트
                - bbox: (x, y, w, h) 바운딩 박스
                - confidence: 신뢰도 점수 (Haar는 고정값)
                - class_name: 동물 종류
                - detector: 탐지기 이름
        """
        if image is None or self.classifier is None:
            return []
        
        try:
            # 그레이스케일 변환
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image.copy()
            
            # 히스토그램 평활화로 조명 보정
            gray = cv2.equalizeHist(gray)
            
            # Haar Cascade 탐지 실행
            faces = self.classifier.detectMultiScale(
                gray,
                scaleFactor=self.scale_factor,
                minNeighbors=self.min_neighbors,
                minSize=self.min_size,
                flags=cv2.CASCADE_SCALE_IMAGE
            )
            
            # 결과 변환
            detections = []
            animal_name = 'dog' if 'dog' in self.model_type else 'cat'
            
            for (x, y, w, h) in faces:
                detection = {
                    'bbox': (int(x), int(y), int(w), int(h)),
                    'confidence': 0.8,  # Haar는 신뢰도 점수가 없으므로 고정값
                    'class_name': animal_name,
                    'detector': f'Haar-{self.model_type}'
                }
                detections.append(detection)
            
            return detections
            
        except Exception as e:
            logger.error(f"Haar Cascade 탐지 중 오류 발생: {e}")
            return []
    
    def detect_multiscale_advanced(self, image: np.ndarray, 
                                 scale_factors=[1.05, 1.1, 1.2],
                                 min_neighbors_range=[3, 5, 7]) -> List[Dict]:
        """
        다중 스케일 및 파라미터로 고급 탐지
        
        Args:
            image: 입력 이미지
            scale_factors: 테스트할 스케일 팩터들
            min_neighbors_range: 테스트할 min_neighbors 값들
            
        Returns:
            통합된 탐지 결과
        """
        if image is None or self.classifier is None:
            return []
        
        try:
            # 그레이스케일 변환
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image.copy()
            
            # 히스토그램 평활화
            gray = cv2.equalizeHist(gray)
            
            all_detections = []
            animal_name = 'dog' if 'dog' in self.model_type else 'cat'
            
            # 다양한 파라미터 조합으로 탐지
            for scale_factor in scale_factors:
                for min_neighbors in min_neighbors_range:
                    faces = self.classifier.detectMultiScale(
                        gray,
                        scaleFactor=scale_factor,
                        minNeighbors=min_neighbors,
                        minSize=self.min_size,
                        flags=cv2.CASCADE_SCALE_IMAGE
                    )
                    
                    for (x, y, w, h) in faces:
                        # 신뢰도를 파라미터 기반으로 계산
                        confidence = min(0.9, 0.5 + (min_neighbors / 20.0))
                        
                        detection = {
                            'bbox': (int(x), int(y), int(w), int(h)),
                            'confidence': confidence,
                            'class_name': animal_name,
                            'detector': f'Haar-{self.model_type}',
                            'scale_factor': scale_factor,
                            'min_neighbors': min_neighbors
                        }
                        all_detections.append(detection)
            
            # NMS로 중복 제거
            filtered_detections = self._apply_nms(all_detections)
            
            return filtered_detections
            
        except Exception as e:
            logger.error(f"고급 Haar Cascade 탐지 중 오류 발생: {e}")
            return []
    
    def _apply_nms(self, detections: List[Dict], overlap_threshold=0.3) -> List[Dict]:
        """Non-Maximum Suppression으로 중복 탐지 제거"""
        if not detections:
            return []
        
        # 신뢰도 기준으로 정렬
        detections = sorted(detections, key=lambda x: x['confidence'], reverse=True)
        
        filtered = []
        
        for detection in detections:
            bbox1 = detection['bbox']
            is_duplicate = False
            
            for filtered_detection in filtered:
                bbox2 = filtered_detection['bbox']
                iou = self._calculate_iou(bbox1, bbox2)
                
                if iou > overlap_threshold:
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                filtered.append(detection)
        
        return filtered
    
    def _calculate_iou(self, bbox1: tuple, bbox2: tuple) -> float:
        """Intersection over Union 계산"""
        x1, y1, w1, h1 = bbox1
        x2, y2, w2, h2 = bbox2
        
        # 교집합 영역 계산
        xi1, yi1 = max(x1, x2), max(y1, y2)
        xi2, yi2 = min(x1 + w1, x2 + w2), min(y1 + h1, y2 + h2)
        
        if xi1 < xi2 and yi1 < yi2:
            intersection = (xi2 - xi1) * (yi2 - yi1)
        else:
            intersection = 0
        
        # 합집합 영역 계산
        union = w1 * h1 + w2 * h2 - intersection
        
        return intersection / union if union > 0 else 0
    
    def set_detection_params(self, scale_factor=None, min_neighbors=None, min_size=None):
        """탐지 파라미터 업데이트"""
        if scale_factor is not None:
            self.scale_factor = scale_factor
        if min_neighbors is not None:
            self.min_neighbors = min_neighbors
        if min_size is not None:
            self.min_size = min_size
        
        logger.info(f"탐지 파라미터 업데이트: scale={self.scale_factor}, "
                   f"neighbors={self.min_neighbors}, min_size={self.min_size}")
    
    def get_model_info(self) -> Dict:
        """모델 정보 반환"""
        model_info = self.HAAR_MODELS.get(self.model_type, {})
        
        return {
            'name': f'Haar Cascade ({self.model_type})',
            'description': model_info.get('description', 'Unknown'),
            'scale_factor': self.scale_factor,
            'min_neighbors': self.min_neighbors,
            'min_size': self.min_size,
            'model_file': model_info.get('filename', 'Unknown'),
            'supported_animal': 'dog' if 'dog' in self.model_type else 'cat'
        }
    
    def benchmark_parameters(self, test_images: List[np.ndarray]) -> Dict:
        """다양한 파라미터 조합에 대한 성능 벤치마크"""
        import time
        
        logger.info("🚀 Haar Cascade 파라미터 벤치마크 시작")
        
        scale_factors = [1.05, 1.1, 1.15, 1.2]
        min_neighbors_list = [3, 4, 5, 6, 7]
        
        results = {}
        
        for scale_factor in scale_factors:
            for min_neighbors in min_neighbors_list:
                param_key = f"scale_{scale_factor}_neighbors_{min_neighbors}"
                
                # 임시로 파라미터 변경
                original_scale = self.scale_factor
                original_neighbors = self.min_neighbors
                
                self.scale_factor = scale_factor
                self.min_neighbors = min_neighbors
                
                # 성능 측정
                start_time = time.time()
                total_detections = 0
                
                for image in test_images:
                    detections = self.detect(image)
                    total_detections += len(detections)
                
                end_time = time.time()
                elapsed = end_time - start_time
                
                results[param_key] = {
                    'scale_factor': scale_factor,
                    'min_neighbors': min_neighbors,
                    'total_time': elapsed,
                    'total_detections': total_detections,
                    'fps': len(test_images) / elapsed,
                    'avg_detections_per_image': total_detections / len(test_images)
                }
                
                logger.info(f"  {param_key}: {elapsed:.3f}초, {total_detections}개 탐지")
                
                # 원래 파라미터 복원
                self.scale_factor = original_scale
                self.min_neighbors = original_neighbors
        
        # 최적 파라미터 찾기
        best_param = max(results.keys(), 
                        key=lambda k: results[k]['avg_detections_per_image'])
        
        logger.info(f"📊 최적 파라미터: {best_param}")
        
        return {
            'results': results,
            'best_parameters': best_param,
            'best_performance': results[best_param]
        }

class MultiHaarDetector:
    """여러 Haar Cascade 모델을 조합한 탐지기"""
    
    def __init__(self, models=['frontal_dog', 'frontal_cat']):
        """
        다중 모델 탐지기 초기화
        
        Args:
            models: 사용할 모델 리스트
        """
        self.detectors = {}
        self.description = f"Multi-Haar 탐지기 ({len(models)}개 모델)"
        
        for model_type in models:
            try:
                detector = HaarDogDetector(model_type=model_type)
                self.detectors[model_type] = detector
                logger.info(f"✅ {model_type} 탐지기 로드됨")
            except Exception as e:
                logger.warning(f"❌ {model_type} 탐지기 로드 실패: {e}")
    
    def detect(self, image: np.ndarray) -> List[Dict]:
        """모든 모델로 탐지하고 결과 통합"""
        all_detections = []
        
        for model_type, detector in self.detectors.items():
            detections = detector.detect(image)
            all_detections.extend(detections)
        
        # NMS로 중복 제거
        if all_detections:
            all_detections = self._apply_nms(all_detections)
        
        return all_detections
    
    def _apply_nms(self, detections: List[Dict], overlap_threshold=0.3) -> List[Dict]:
        """NMS 적용"""
        if not detections:
            return []
        
        detections = sorted(detections, key=lambda x: x['confidence'], reverse=True)
        filtered = []
        
        for detection in detections:
            bbox1 = detection['bbox']
            is_duplicate = False
            
            for filtered_detection in filtered:
                bbox2 = filtered_detection['bbox']
                iou = self._calculate_iou(bbox1, bbox2)
                
                if iou > overlap_threshold:
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                filtered.append(detection)
        
        return filtered
    
    def _calculate_iou(self, bbox1: tuple, bbox2: tuple) -> float:
        """IoU 계산"""
        x1, y1, w1, h1 = bbox1
        x2, y2, w2, h2 = bbox2
        
        xi1, yi1 = max(x1, x2), max(y1, y2)
        xi2, yi2 = min(x1 + w1, x2 + w2), min(y1 + h1, y2 + h2)
        
        if xi1 < xi2 and yi1 < yi2:
            intersection = (xi2 - xi1) * (yi2 - yi1)
        else:
            intersection = 0
        
        union = w1 * h1 + w2 * h2 - intersection
        
        return intersection / union if union > 0 else 0