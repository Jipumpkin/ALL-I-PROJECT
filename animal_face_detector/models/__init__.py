"""
동물 탐지 모델 패키지
다양한 사전학습된 모델들을 통합한 동물 얼굴 탐지 모듈
"""

from .yolo_detector import YOLOAnimalDetector, YOLOAnimalDetectorAdvanced
from .haar_detector import HaarDogDetector, MultiHaarDetector
from .huggingface_detector import HuggingFaceAnimalClassifier, HuggingFaceObjectDetector

__all__ = [
    'YOLOAnimalDetector',
    'YOLOAnimalDetectorAdvanced', 
    'HaarDogDetector',
    'MultiHaarDetector',
    'HuggingFaceAnimalClassifier',
    'HuggingFaceObjectDetector'
]