"""
결과 시각화 및 저장 유틸리티
탐지/분류 결과를 이미지에 그리고 파일로 저장하는 기능
"""

import cv2
import numpy as np
from pathlib import Path
import json
from datetime import datetime
import logging
from typing import List, Dict, Optional, Tuple
import random

logger = logging.getLogger(__name__)

class ResultVisualizer:
    """탐지 결과 시각화기"""
    
    # 탐지기별 색상 설정
    DETECTOR_COLORS = {
        'YOLO': (0, 255, 0),        # 초록색
        'Haar-frontal_dog': (255, 0, 0),     # 파란색
        'Haar-frontal_cat': (0, 255, 255),   # 노란색
        'HuggingFace': (255, 0, 255),        # 마젠타
        'default': (255, 255, 255)           # 흰색
    }
    
    # 동물별 색상
    ANIMAL_COLORS = {
        'dog': (0, 255, 0),        # 초록색
        'cat': (255, 0, 0),        # 파란색  
        'horse': (0, 255, 255),    # 노란색
        'cow': (255, 255, 0),      # 시안색
        'elephant': (255, 0, 255), # 마젠타
        'lion': (128, 0, 128),     # 보라색
        'tiger': (255, 165, 0),    # 주황색
        'default': (255, 255, 255) # 흰색
    }
    
    def __init__(self):
        self.font = cv2.FONT_HERSHEY_SIMPLEX
        self.font_scale = 0.6
        self.thickness = 2
        self.text_thickness = 1
    
    def draw_detections(self, image: np.ndarray, detections: List[Dict], 
                       detector_name: str = None) -> np.ndarray:
        """
        이미지에 탐지 결과 그리기
        
        Args:
            image: 원본 이미지
            detections: 탐지 결과 리스트
            detector_name: 탐지기 이름 (색상 선택용)
            
        Returns:
            결과가 그려진 이미지
        """
        if image is None or not detections:
            return image.copy() if image is not None else None
        
        result_image = image.copy()
        
        for i, detection in enumerate(detections):
            bbox = detection.get('bbox', (0, 0, 0, 0))
            confidence = detection.get('confidence', 0.0)
            class_name = detection.get('class_name', 'unknown')
            detector = detection.get('detector', detector_name or 'unknown')
            
            x, y, w, h = bbox
            
            # 색상 선택 (탐지기 우선, 그 다음 동물 종류)
            color = self._get_color(detector, class_name)
            
            # 바운딩 박스 그리기
            cv2.rectangle(result_image, (x, y), (x + w, y + h), color, self.thickness)
            
            # 라벨 텍스트 준비
            label = f"{class_name}: {confidence:.2f}"
            if detector != detector_name:
                label = f"[{detector}] {label}"
            
            # 텍스트 배경 박스 크기 계산
            (text_width, text_height), baseline = cv2.getTextSize(
                label, self.font, self.font_scale, self.text_thickness
            )
            
            # 텍스트 배경 박스 그리기
            cv2.rectangle(result_image, 
                         (x, y - text_height - baseline - 5),
                         (x + text_width + 5, y), 
                         color, -1)
            
            # 텍스트 그리기
            cv2.putText(result_image, label, 
                       (x + 2, y - baseline - 2),
                       self.font, self.font_scale, 
                       (255, 255, 255), self.text_thickness)
            
            # 탐지 순번 표시 (우상단)
            number_text = str(i + 1)
            cv2.putText(result_image, number_text,
                       (x + w - 20, y + 20),
                       self.font, self.font_scale,
                       color, self.text_thickness + 1)
        
        return result_image
    
    def draw_multiple_detections(self, image: np.ndarray, 
                               detection_groups: Dict[str, List[Dict]]) -> np.ndarray:
        """
        여러 탐지기 결과를 모두 그리기
        
        Args:
            image: 원본 이미지
            detection_groups: {detector_name: [detections]} 형태의 딕셔너리
            
        Returns:
            모든 결과가 그려진 이미지
        """
        if image is None or not detection_groups:
            return image.copy() if image is not None else None
        
        result_image = image.copy()
        
        for detector_name, detections in detection_groups.items():
            result_image = self.draw_detections(result_image, detections, detector_name)
        
        # 범례 추가
        result_image = self._add_legend(result_image, detection_groups)
        
        return result_image
    
    def _add_legend(self, image: np.ndarray, 
                   detection_groups: Dict[str, List[Dict]]) -> np.ndarray:
        """이미지에 범례 추가"""
        if not detection_groups:
            return image
        
        h, w = image.shape[:2]
        legend_y = 30
        legend_x = w - 250
        
        # 범례 배경
        cv2.rectangle(image, (legend_x - 10, 10), (w - 10, legend_y + len(detection_groups) * 25), 
                     (0, 0, 0), -1)
        cv2.rectangle(image, (legend_x - 10, 10), (w - 10, legend_y + len(detection_groups) * 25), 
                     (255, 255, 255), 1)
        
        # 범례 텍스트
        for i, (detector_name, detections) in enumerate(detection_groups.items()):
            color = self._get_color(detector_name, '')
            count = len(detections)
            
            text = f"{detector_name}: {count}"
            text_y = legend_y + i * 25
            
            # 색상 박스
            cv2.rectangle(image, (legend_x, text_y - 10), (legend_x + 15, text_y + 5), color, -1)
            
            # 텍스트
            cv2.putText(image, text, (legend_x + 20, text_y), 
                       self.font, 0.4, (255, 255, 255), 1)
        
        return image
    
    def _get_color(self, detector: str, animal: str) -> Tuple[int, int, int]:
        """탐지기나 동물 종류에 따른 색상 반환"""
        # 탐지기 색상 우선
        if detector in self.DETECTOR_COLORS:
            return self.DETECTOR_COLORS[detector]
        
        # 동물 색상
        if animal in self.ANIMAL_COLORS:
            return self.ANIMAL_COLORS[animal]
        
        # 기본 색상
        return self.DETECTOR_COLORS['default']
    
    def save_results(self, image: np.ndarray, detection_groups: Dict[str, List[Dict]], 
                    original_path: str, output_dir: str = "output") -> str:
        """
        탐지 결과 이미지와 JSON 파일로 저장
        
        Args:
            image: 원본 이미지
            detection_groups: 탐지 결과들
            original_path: 원본 파일 경로
            output_dir: 출력 디렉토리
            
        Returns:
            저장된 이미지 파일 경로
        """
        if image is None:
            return None
        
        # 출력 디렉토리 생성
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # 파일명 생성
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        original_name = Path(original_path).stem
        
        # 결과 이미지 생성
        result_image = self.draw_multiple_detections(image, detection_groups)
        
        # 이미지 저장
        image_output_path = output_path / f"{original_name}_detected_{timestamp}.jpg"
        cv2.imwrite(str(image_output_path), result_image)
        
        # JSON 결과 저장
        json_output_path = output_path / f"{original_name}_results_{timestamp}.json"
        self._save_json_results(detection_groups, original_path, str(json_output_path))
        
        logger.info(f"💾 결과 저장 완료: {image_output_path}")
        logger.info(f"📄 JSON 결과: {json_output_path}")
        
        return str(image_output_path)
    
    def _save_json_results(self, detection_groups: Dict[str, List[Dict]], 
                          original_path: str, json_path: str):
        """JSON 형태로 탐지 결과 저장"""
        results = {
            'timestamp': datetime.now().isoformat(),
            'original_image': str(original_path),
            'total_detections': sum(len(dets) for dets in detection_groups.values()),
            'detectors_used': list(detection_groups.keys()),
            'results': detection_groups
        }
        
        try:
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"JSON 저장 실패: {e}")
    
    def create_comparison_grid(self, original_image: np.ndarray, 
                              detection_groups: Dict[str, List[Dict]],
                              grid_cols: int = 2) -> np.ndarray:
        """
        원본 이미지와 각 탐지기별 결과를 그리드로 비교 표시
        
        Args:
            original_image: 원본 이미지
            detection_groups: 탐지 결과들
            grid_cols: 그리드 열 수
            
        Returns:
            그리드 비교 이미지
        """
        if original_image is None or not detection_groups:
            return original_image
        
        images = [original_image.copy()]  # 원본
        titles = ['Original']
        
        # 각 탐지기별 결과 이미지 생성
        for detector_name, detections in detection_groups.items():
            result_img = self.draw_detections(original_image.copy(), detections, detector_name)
            images.append(result_img)
            titles.append(f"{detector_name} ({len(detections)})")
        
        # 그리드 크기 계산
        total_images = len(images)
        grid_rows = (total_images + grid_cols - 1) // grid_cols
        
        # 개별 이미지 크기 조정
        h, w = original_image.shape[:2]
        cell_width = max(400, w // 3)
        cell_height = int(cell_width * h / w)
        
        # 그리드 이미지 생성
        grid_width = grid_cols * cell_width
        grid_height = grid_rows * (cell_height + 30)  # 제목 공간 추가
        grid_image = np.zeros((grid_height, grid_width, 3), dtype=np.uint8)
        
        for i, (img, title) in enumerate(zip(images, titles)):
            row = i // grid_cols
            col = i % grid_cols
            
            # 이미지 크기 조정
            resized_img = cv2.resize(img, (cell_width, cell_height))
            
            # 그리드에 배치
            y_start = row * (cell_height + 30) + 30
            y_end = y_start + cell_height
            x_start = col * cell_width
            x_end = x_start + cell_width
            
            grid_image[y_start:y_end, x_start:x_end] = resized_img
            
            # 제목 추가
            title_y = row * (cell_height + 30) + 20
            cv2.putText(grid_image, title, (x_start + 10, title_y),
                       self.font, 0.7, (255, 255, 255), 2)
        
        return grid_image
    
    def create_detection_summary(self, detection_groups: Dict[str, List[Dict]]) -> Dict:
        """탐지 결과 요약 정보 생성"""
        summary = {
            'total_detections': 0,
            'detectors_used': len(detection_groups),
            'detector_summary': {},
            'animal_counts': {},
            'confidence_stats': {}
        }
        
        all_confidences = []
        
        for detector_name, detections in detection_groups.items():
            detector_summary = {
                'count': len(detections),
                'animals': {},
                'avg_confidence': 0.0,
                'max_confidence': 0.0,
                'min_confidence': 1.0
            }
            
            detector_confidences = []
            
            for detection in detections:
                animal = detection.get('class_name', 'unknown')
                confidence = detection.get('confidence', 0.0)
                
                # 동물별 카운트
                detector_summary['animals'][animal] = detector_summary['animals'].get(animal, 0) + 1
                summary['animal_counts'][animal] = summary['animal_counts'].get(animal, 0) + 1
                
                # 신뢰도 통계
                detector_confidences.append(confidence)
                all_confidences.append(confidence)
            
            if detector_confidences:
                detector_summary['avg_confidence'] = np.mean(detector_confidences)
                detector_summary['max_confidence'] = np.max(detector_confidences)
                detector_summary['min_confidence'] = np.min(detector_confidences)
            
            summary['detector_summary'][detector_name] = detector_summary
            summary['total_detections'] += len(detections)
        
        # 전체 신뢰도 통계
        if all_confidences:
            summary['confidence_stats'] = {
                'avg': float(np.mean(all_confidences)),
                'max': float(np.max(all_confidences)),
                'min': float(np.min(all_confidences)),
                'std': float(np.std(all_confidences))
            }
        
        return summary
    
    def print_detection_summary(self, detection_groups: Dict[str, List[Dict]]):
        """탐지 결과 요약을 콘솔에 출력"""
        summary = self.create_detection_summary(detection_groups)
        
        print("\n" + "=" * 50)
        print("🐕 동물 탐지 결과 요약")
        print("=" * 50)
        print(f"총 탐지 수: {summary['total_detections']}")
        print(f"사용된 탐지기: {summary['detectors_used']}개")
        
        if summary['animal_counts']:
            print("\n🦊 탐지된 동물별 수:")
            for animal, count in summary['animal_counts'].items():
                print(f"  - {animal}: {count}마리")
        
        print("\n🔍 탐지기별 결과:")
        for detector, info in summary['detector_summary'].items():
            print(f"  📊 {detector}:")
            print(f"    탐지 수: {info['count']}")
            if info['count'] > 0:
                print(f"    평균 신뢰도: {info['avg_confidence']:.3f}")
                print(f"    신뢰도 범위: {info['min_confidence']:.3f} ~ {info['max_confidence']:.3f}")
                if info['animals']:
                    animals_str = ", ".join([f"{k}({v})" for k, v in info['animals'].items()])
                    print(f"    탐지 동물: {animals_str}")
        
        if summary['confidence_stats']:
            stats = summary['confidence_stats']
            print(f"\n📈 전체 신뢰도 통계:")
            print(f"  평균: {stats['avg']:.3f} ± {stats['std']:.3f}")
            print(f"  범위: {stats['min']:.3f} ~ {stats['max']:.3f}")
        
        print("=" * 50)

class VideoVisualizer:
    """비디오 결과 시각화기"""
    
    def __init__(self):
        self.image_visualizer = ResultVisualizer()
    
    def process_video_with_visualization(self, video_path: str, detector_func,
                                       output_path: str, skip_frames: int = 5) -> bool:
        """
        비디오 처리하며 탐지 결과 시각화
        
        Args:
            video_path: 입력 비디오 경로
            detector_func: 탐지 함수 (이미지를 받아서 탐지 결과 반환)
            output_path: 출력 비디오 경로
            skip_frames: 처리할 프레임 간격 (성능 최적화)
            
        Returns:
            성공 여부
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            logger.error(f"비디오 파일을 열 수 없습니다: {video_path}")
            return False
        
        # 비디오 정보
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # 출력 비디오 설정
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        frame_count = 0
        last_detections = {}
        
        logger.info(f"🎥 비디오 처리 시작: {total_frames} 프레임")
        
        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                frame_count += 1
                
                # 지정된 간격으로만 탐지 수행
                if frame_count % skip_frames == 0:
                    detections = detector_func(frame)
                    if detections:
                        last_detections = detections
                
                # 마지막 탐지 결과로 시각화
                if last_detections:
                    frame = self.image_visualizer.draw_multiple_detections(frame, last_detections)
                
                # 프레임 정보 표시
                cv2.putText(frame, f"Frame: {frame_count}/{total_frames}", 
                           (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                
                out.write(frame)
                
                # 진행률 표시
                if frame_count % 100 == 0:
                    progress = (frame_count / total_frames) * 100
                    logger.info(f"⏳ 처리 진행률: {progress:.1f}%")
            
            return True
            
        except Exception as e:
            logger.error(f"비디오 처리 중 오류: {e}")
            return False
        
        finally:
            cap.release()
            out.release()
            logger.info(f"✅ 비디오 처리 완료: {output_path}")