"""
Hugging Face 기반 동물 분류 모듈
사전 학습된 Hugging Face 모델을 사용한 동물 분류 및 탐지
"""

import cv2
import numpy as np
from PIL import Image
import logging
from typing import List, Dict, Optional, Union
import io
import base64

logger = logging.getLogger(__name__)

try:
    from transformers import pipeline, AutoImageProcessor, AutoModelForImageClassification
    import torch
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    logger.warning("⚠️ Transformers not available. Install with: pip install transformers torch pillow")

class HuggingFaceAnimalClassifier:
    """Hugging Face 기반 동물 분류기"""
    
    # 사용 가능한 모델들
    AVAILABLE_MODELS = {
        'animal-classification': {
            'name': 'shaktibiplab/Animal-Classification',
            'description': '6종 동물 분류 (고양이, 개, 말, 사자, 호랑이, 코끼리)',
            'animals': ['cat', 'dog', 'horse', 'lion', 'tiger', 'elephant'],
            'input_size': 256
        },
        'animal-classifier': {
            'name': 'microsoft/resnet-50',
            'description': 'Microsoft ResNet-50 기반 동물 분류',
            'animals': ['various'],
            'input_size': 224
        }
    }
    
    def __init__(self, model_name='animal-classification', confidence_threshold=0.5):
        """
        Hugging Face 동물 분류기 초기화
        
        Args:
            model_name (str): 사용할 모델 ('animal-classification', 'animal-classifier')
            confidence_threshold (float): 분류 신뢰도 임계값
        """
        if not TRANSFORMERS_AVAILABLE:
            raise ImportError("Transformers가 설치되지 않았습니다. 'pip install transformers torch pillow'로 설치하세요.")
        
        self.model_name = model_name
        self.confidence_threshold = confidence_threshold
        
        if model_name not in self.AVAILABLE_MODELS:
            raise ValueError(f"지원하지 않는 모델: {model_name}. 사용 가능: {list(self.AVAILABLE_MODELS.keys())}")
        
        self.model_info = self.AVAILABLE_MODELS[model_name]
        self.description = f"HuggingFace {model_name} 분류기"
        
        logger.info(f"🤗 Hugging Face 모델 로딩 중: {self.model_info['name']}")
        
        try:
            # 이미지 분류 파이프라인 생성
            self.classifier = pipeline(
                "image-classification",
                model=self.model_info['name'],
                return_top_k=None  # 모든 클래스 확률 반환
            )
            
            logger.info(f"✅ Hugging Face 모델 로드 완료: {model_name}")
            
        except Exception as e:
            logger.error(f"❌ Hugging Face 모델 로드 실패: {e}")
            raise
    
    def detect(self, image: np.ndarray) -> List[Dict]:
        """
        이미지에서 동물 분류
        
        Args:
            image: OpenCV 이미지 (BGR)
            
        Returns:
            List[Dict]: 분류 결과 리스트
                - bbox: 전체 이미지 (분류는 바운딩 박스 없음)
                - confidence: 분류 신뢰도
                - class_name: 동물 종류
                - all_predictions: 모든 클래스별 확률
        """
        if image is None:
            return []
        
        try:
            # OpenCV BGR을 PIL RGB로 변환
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            pil_image = Image.fromarray(image_rgb)
            
            # 이미지 크기 조정 (모델 요구사항에 맞춤)
            target_size = self.model_info['input_size']
            pil_image = pil_image.resize((target_size, target_size), Image.Resampling.LANCZOS)
            
            # 분류 수행
            predictions = self.classifier(pil_image)
            
            # 결과 처리
            detections = []
            h, w = image.shape[:2]
            
            # 임계값 이상의 동물 클래스 필터링
            for pred in predictions:
                label = pred['label'].lower()
                score = pred['score']
                
                # 동물 관련 라벨 체크
                if (score >= self.confidence_threshold and 
                    self._is_animal_class(label)):
                    
                    detection = {
                        'bbox': (0, 0, w, h),  # 전체 이미지
                        'confidence': score,
                        'class_name': self._normalize_class_name(label),
                        'detector': 'HuggingFace',
                        'all_predictions': predictions[:5]  # 상위 5개만
                    }
                    
                    detections.append(detection)
                    break  # 가장 높은 신뢰도만 사용
            
            return detections
            
        except Exception as e:
            logger.error(f"HuggingFace 분류 중 오류 발생: {e}")
            return []
    
    def classify_batch(self, images: List[np.ndarray]) -> List[List[Dict]]:
        """
        여러 이미지 배치 분류
        
        Args:
            images: 이미지 리스트
            
        Returns:
            각 이미지에 대한 분류 결과
        """
        try:
            # PIL 이미지로 변환
            pil_images = []
            target_size = self.model_info['input_size']
            
            for image in images:
                if image is not None:
                    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                    pil_image = Image.fromarray(image_rgb)
                    pil_image = pil_image.resize((target_size, target_size), Image.Resampling.LANCZOS)
                    pil_images.append(pil_image)
                else:
                    pil_images.append(None)
            
            # 배치 분류
            batch_predictions = []
            for i, pil_image in enumerate(pil_images):
                if pil_image is not None:
                    predictions = self.classifier(pil_image)
                    batch_predictions.append(predictions)
                else:
                    batch_predictions.append([])
            
            # 결과 변환
            batch_detections = []
            for i, predictions in enumerate(batch_predictions):
                detections = []
                if predictions and images[i] is not None:
                    h, w = images[i].shape[:2]
                    
                    for pred in predictions:
                        label = pred['label'].lower()
                        score = pred['score']
                        
                        if (score >= self.confidence_threshold and 
                            self._is_animal_class(label)):
                            
                            detection = {
                                'bbox': (0, 0, w, h),
                                'confidence': score,
                                'class_name': self._normalize_class_name(label),
                                'detector': 'HuggingFace',
                                'all_predictions': predictions[:5]
                            }
                            
                            detections.append(detection)
                            break
                
                batch_detections.append(detections)
            
            return batch_detections
            
        except Exception as e:
            logger.error(f"HuggingFace 배치 분류 중 오류 발생: {e}")
            return [[] for _ in images]
    
    def _is_animal_class(self, label: str) -> bool:
        """라벨이 동물 클래스인지 확인"""
        animal_keywords = [
            'dog', 'cat', 'horse', 'cow', 'sheep', 'elephant', 
            'lion', 'tiger', 'bear', 'wolf', 'fox', 'rabbit',
            'pig', 'goat', 'deer', 'zebra', 'giraffe'
        ]
        
        label_lower = label.lower()
        return any(keyword in label_lower for keyword in animal_keywords)
    
    def _normalize_class_name(self, label: str) -> str:
        """클래스 이름 정규화"""
        # 일반적인 동물 이름으로 매핑
        mappings = {
            'golden retriever': 'dog',
            'german shepherd': 'dog',
            'labrador': 'dog',
            'persian cat': 'cat',
            'siamese cat': 'cat',
            'maine coon': 'cat',
        }
        
        label_lower = label.lower()
        
        # 매핑된 이름이 있으면 사용
        for key, value in mappings.items():
            if key in label_lower:
                return value
        
        # 기본 동물 키워드 추출
        if 'dog' in label_lower:
            return 'dog'
        elif 'cat' in label_lower:
            return 'cat'
        elif 'horse' in label_lower:
            return 'horse'
        elif 'cow' in label_lower:
            return 'cow'
        elif 'elephant' in label_lower:
            return 'elephant'
        elif 'lion' in label_lower:
            return 'lion'
        elif 'tiger' in label_lower:
            return 'tiger'
        else:
            return label_lower
    
    def get_detailed_predictions(self, image: np.ndarray, top_k=10) -> List[Dict]:
        """상세한 예측 결과 반환"""
        if image is None:
            return []
        
        try:
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            pil_image = Image.fromarray(image_rgb)
            
            target_size = self.model_info['input_size']
            pil_image = pil_image.resize((target_size, target_size), Image.Resampling.LANCZOS)
            
            predictions = self.classifier(pil_image)
            
            # 상위 K개 결과만 반환
            return predictions[:top_k]
            
        except Exception as e:
            logger.error(f"상세 예측 중 오류 발생: {e}")
            return []
    
    def set_confidence_threshold(self, threshold: float):
        """신뢰도 임계값 변경"""
        if 0.0 <= threshold <= 1.0:
            self.confidence_threshold = threshold
            logger.info(f"신뢰도 임계값 변경: {threshold}")
        else:
            logger.warning(f"잘못된 신뢰도 임계값: {threshold} (0.0-1.0 범위)")
    
    def get_model_info(self) -> Dict:
        """모델 정보 반환"""
        try:
            model_info = {
                'name': self.model_info['name'],
                'description': self.model_info['description'],
                'supported_animals': self.model_info['animals'],
                'input_size': self.model_info['input_size'],
                'confidence_threshold': self.confidence_threshold,
                'device': 'cuda' if torch.cuda.is_available() else 'cpu'
            }
            
            return model_info
            
        except Exception as e:
            logger.error(f"모델 정보 조회 실패: {e}")
            return {}
    
    def benchmark(self, test_images: List[np.ndarray], runs=3) -> Dict:
        """성능 벤치마크 실행"""
        import time
        
        logger.info(f"🚀 HuggingFace 성능 벤치마크 시작 ({runs}회 실행)")
        
        times = []
        classifications_count = []
        
        for run in range(runs):
            start_time = time.time()
            
            total_classifications = 0
            for image in test_images:
                results = self.detect(image)
                total_classifications += len(results)
            
            end_time = time.time()
            elapsed = end_time - start_time
            
            times.append(elapsed)
            classifications_count.append(total_classifications)
            
            logger.info(f"  런 {run+1}: {elapsed:.3f}초, {total_classifications}개 분류")
        
        avg_time = np.mean(times)
        avg_classifications = np.mean(classifications_count)
        fps = len(test_images) / avg_time
        
        benchmark_results = {
            'average_time': avg_time,
            'average_classifications': avg_classifications,
            'fps': fps,
            'images_count': len(test_images),
            'runs': runs
        }
        
        logger.info(f"📊 벤치마크 결과: {fps:.1f} FPS, 평균 {avg_classifications:.1f}개 분류")
        
        return benchmark_results

class HuggingFaceObjectDetector:
    """Hugging Face 기반 객체 탐지기 (DETR 등)"""
    
    def __init__(self, model_name='facebook/detr-resnet-50', confidence_threshold=0.7):
        """
        객체 탐지 모델 초기화
        
        Args:
            model_name (str): Hugging Face 모델 이름
            confidence_threshold (float): 탐지 신뢰도 임계값
        """
        if not TRANSFORMERS_AVAILABLE:
            raise ImportError("Transformers가 설치되지 않았습니다.")
        
        self.model_name = model_name
        self.confidence_threshold = confidence_threshold
        self.description = f"HuggingFace Object Detector ({model_name})"
        
        logger.info(f"🤗 Hugging Face 객체 탐지 모델 로딩 중: {model_name}")
        
        try:
            self.detector = pipeline(
                "object-detection",
                model=model_name,
                return_tensors="pt"
            )
            
            logger.info(f"✅ 객체 탐지 모델 로드 완료")
            
        except Exception as e:
            logger.error(f"❌ 객체 탐지 모델 로드 실패: {e}")
            raise
    
    def detect(self, image: np.ndarray) -> List[Dict]:
        """이미지에서 동물 객체 탐지"""
        if image is None:
            return []
        
        try:
            # OpenCV BGR을 PIL RGB로 변환
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            pil_image = Image.fromarray(image_rgb)
            
            # 객체 탐지 수행
            detections = self.detector(pil_image)
            
            # 동물 객체만 필터링
            animal_detections = []
            
            for detection in detections:
                label = detection['label'].lower()
                score = detection['score']
                
                if (score >= self.confidence_threshold and 
                    self._is_animal_class(label)):
                    
                    # 바운딩 박스 좌표 변환
                    box = detection['box']
                    x, y, w, h = box['xmin'], box['ymin'], box['xmax'] - box['xmin'], box['ymax'] - box['ymin']
                    
                    animal_detection = {
                        'bbox': (int(x), int(y), int(w), int(h)),
                        'confidence': score,
                        'class_name': self._normalize_class_name(label),
                        'detector': 'HuggingFace-ObjectDetection'
                    }
                    
                    animal_detections.append(animal_detection)
            
            return animal_detections
            
        except Exception as e:
            logger.error(f"HuggingFace 객체 탐지 중 오류 발생: {e}")
            return []
    
    def _is_animal_class(self, label: str) -> bool:
        """동물 클래스 확인 (분류기와 동일)"""
        animal_keywords = [
            'dog', 'cat', 'horse', 'cow', 'sheep', 'elephant', 
            'lion', 'tiger', 'bear', 'wolf', 'fox', 'rabbit',
            'pig', 'goat', 'deer', 'zebra', 'giraffe'
        ]
        
        label_lower = label.lower()
        return any(keyword in label_lower for keyword in animal_keywords)
    
    def _normalize_class_name(self, label: str) -> str:
        """클래스 이름 정규화 (분류기와 동일)"""
        label_lower = label.lower()
        
        if 'dog' in label_lower:
            return 'dog'
        elif 'cat' in label_lower:
            return 'cat'
        elif 'horse' in label_lower:
            return 'horse'
        elif 'cow' in label_lower:
            return 'cow'
        elif 'elephant' in label_lower:
            return 'elephant'
        else:
            return label_lower