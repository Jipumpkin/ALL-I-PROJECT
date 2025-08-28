"""
파일 처리 유틸리티
이미지/비디오 파일 로드, 저장, 검증 등의 기능
"""

import cv2
import numpy as np
from pathlib import Path
import logging
from typing import List, Optional, Tuple, Union, Dict
import mimetypes
import json
from PIL import Image
import tempfile
import shutil

logger = logging.getLogger(__name__)

class FileHandler:
    """파일 처리 핸들러"""
    
    # 지원하는 이미지 형식
    SUPPORTED_IMAGE_EXTENSIONS = {
        '.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', 
        '.webp', '.ico', '.ppm', '.pgm', '.pbm'
    }
    
    # 지원하는 비디오 형식
    SUPPORTED_VIDEO_EXTENSIONS = {
        '.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv', 
        '.m4v', '.3gp', '.webm', '.ogv'
    }
    
    def __init__(self):
        self.temp_dir = None
    
    def is_image_file(self, file_path: Union[str, Path]) -> bool:
        """파일이 지원되는 이미지 형식인지 확인"""
        return Path(file_path).suffix.lower() in self.SUPPORTED_IMAGE_EXTENSIONS
    
    def is_video_file(self, file_path: Union[str, Path]) -> bool:
        """파일이 지원되는 비디오 형식인지 확인"""
        return Path(file_path).suffix.lower() in self.SUPPORTED_VIDEO_EXTENSIONS
    
    def load_image(self, image_path: Union[str, Path]) -> Optional[np.ndarray]:
        """
        이미지 파일 로드
        
        Args:
            image_path: 이미지 파일 경로
            
        Returns:
            OpenCV 이미지 (BGR) 또는 None
        """
        try:
            image_path = Path(image_path)
            
            if not image_path.exists():
                logger.error(f"이미지 파일을 찾을 수 없습니다: {image_path}")
                return None
            
            if not self.is_image_file(image_path):
                logger.error(f"지원하지 않는 이미지 형식: {image_path.suffix}")
                return None
            
            # OpenCV로 이미지 로드
            image = cv2.imread(str(image_path))
            
            if image is None:
                logger.warning(f"OpenCV로 로드 실패, PIL로 재시도: {image_path}")
                # PIL로 재시도
                try:
                    pil_image = Image.open(image_path)
                    # RGB를 BGR로 변환
                    if pil_image.mode == 'RGB':
                        image_array = np.array(pil_image)
                        image = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
                    elif pil_image.mode == 'RGBA':
                        image_array = np.array(pil_image)
                        image = cv2.cvtColor(image_array, cv2.COLOR_RGBA2BGR)
                    else:
                        image_array = np.array(pil_image.convert('RGB'))
                        image = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
                except Exception as e:
                    logger.error(f"PIL로도 이미지 로드 실패: {e}")
                    return None
            
            logger.info(f"✅ 이미지 로드 성공: {image_path.name} ({image.shape})")
            return image
            
        except Exception as e:
            logger.error(f"이미지 로드 중 오류: {e}")
            return None
    
    def save_image(self, image: np.ndarray, output_path: Union[str, Path], 
                   quality: int = 95) -> bool:
        """
        이미지 파일 저장
        
        Args:
            image: 저장할 이미지
            output_path: 출력 파일 경로
            quality: JPEG 품질 (1-100)
            
        Returns:
            저장 성공 여부
        """
        try:
            output_path = Path(output_path)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            # 파일 확장자에 따른 저장 옵션
            extension = output_path.suffix.lower()
            
            if extension in ['.jpg', '.jpeg']:
                # JPEG 품질 설정
                success = cv2.imwrite(str(output_path), image, 
                                    [cv2.IMWRITE_JPEG_QUALITY, quality])
            elif extension == '.png':
                # PNG 압축 레벨 설정
                success = cv2.imwrite(str(output_path), image, 
                                    [cv2.IMWRITE_PNG_COMPRESSION, 6])
            else:
                success = cv2.imwrite(str(output_path), image)
            
            if success:
                logger.info(f"✅ 이미지 저장 성공: {output_path}")
                return True
            else:
                logger.error(f"❌ 이미지 저장 실패: {output_path}")
                return False
                
        except Exception as e:
            logger.error(f"이미지 저장 중 오류: {e}")
            return False
    
    def get_image_info(self, image_path: Union[str, Path]) -> Optional[Dict]:
        """
        이미지 파일 정보 조회
        
        Returns:
            이미지 정보 딕셔너리 또는 None
        """
        try:
            image_path = Path(image_path)
            
            if not image_path.exists() or not self.is_image_file(image_path):
                return None
            
            # 파일 기본 정보
            stat = image_path.stat()
            file_info = {
                'path': str(image_path),
                'name': image_path.name,
                'size_bytes': stat.st_size,
                'size_mb': round(stat.st_size / (1024 * 1024), 2),
                'extension': image_path.suffix.lower(),
                'modified': stat.st_mtime
            }
            
            # 이미지 차원 정보
            image = self.load_image(image_path)
            if image is not None:
                h, w = image.shape[:2]
                channels = image.shape[2] if len(image.shape) > 2 else 1
                
                file_info.update({
                    'width': w,
                    'height': h,
                    'channels': channels,
                    'shape': image.shape,
                    'dtype': str(image.dtype),
                    'aspect_ratio': round(w / h, 3)
                })
            
            return file_info
            
        except Exception as e:
            logger.error(f"이미지 정보 조회 중 오류: {e}")
            return None
    
    def get_video_info(self, video_path: Union[str, Path]) -> Optional[Dict]:
        """
        비디오 파일 정보 조회
        
        Returns:
            비디오 정보 딕셔너리 또는 None
        """
        try:
            video_path = Path(video_path)
            
            if not video_path.exists() or not self.is_video_file(video_path):
                return None
            
            # 파일 기본 정보
            stat = video_path.stat()
            file_info = {
                'path': str(video_path),
                'name': video_path.name,
                'size_bytes': stat.st_size,
                'size_mb': round(stat.st_size / (1024 * 1024), 2),
                'extension': video_path.suffix.lower(),
                'modified': stat.st_mtime
            }
            
            # 비디오 정보
            cap = cv2.VideoCapture(str(video_path))
            if cap.isOpened():
                fps = cap.get(cv2.CAP_PROP_FPS)
                frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                duration = frame_count / fps if fps > 0 else 0
                
                file_info.update({
                    'width': width,
                    'height': height,
                    'fps': round(fps, 2),
                    'frame_count': frame_count,
                    'duration_seconds': round(duration, 2),
                    'duration_minutes': round(duration / 60, 2),
                    'aspect_ratio': round(width / height, 3) if height > 0 else 0
                })
                
                cap.release()
            
            return file_info
            
        except Exception as e:
            logger.error(f"비디오 정보 조회 중 오류: {e}")
            return None
    
    def find_media_files(self, directory: Union[str, Path], 
                        include_subdirs: bool = True) -> Dict[str, List[Path]]:
        """
        디렉토리에서 미디어 파일 찾기
        
        Args:
            directory: 검색할 디렉토리
            include_subdirs: 하위 디렉토리 포함 여부
            
        Returns:
            {'images': [파일들], 'videos': [파일들]}
        """
        try:
            directory = Path(directory)
            
            if not directory.exists() or not directory.is_dir():
                logger.error(f"디렉토리를 찾을 수 없습니다: {directory}")
                return {'images': [], 'videos': []}
            
            pattern = "**/*" if include_subdirs else "*"
            all_files = list(directory.glob(pattern))
            
            images = []
            videos = []
            
            for file_path in all_files:
                if file_path.is_file():
                    if self.is_image_file(file_path):
                        images.append(file_path)
                    elif self.is_video_file(file_path):
                        videos.append(file_path)
            
            # 이름순 정렬
            images.sort()
            videos.sort()
            
            logger.info(f"📁 미디어 파일 검색 완료: 이미지 {len(images)}개, 비디오 {len(videos)}개")
            
            return {'images': images, 'videos': videos}
            
        except Exception as e:
            logger.error(f"미디어 파일 검색 중 오류: {e}")
            return {'images': [], 'videos': []}
    
    def batch_load_images(self, image_paths: List[Union[str, Path]], 
                         max_size: Optional[Tuple[int, int]] = None) -> List[Optional[np.ndarray]]:
        """
        여러 이미지를 배치로 로드
        
        Args:
            image_paths: 이미지 파일 경로들
            max_size: 최대 크기 (width, height) - 리사이징용
            
        Returns:
            로드된 이미지들 리스트
        """
        images = []
        
        for i, image_path in enumerate(image_paths):
            try:
                image = self.load_image(image_path)
                
                if image is not None and max_size is not None:
                    # 크기 조정
                    h, w = image.shape[:2]
                    max_w, max_h = max_size
                    
                    if w > max_w or h > max_h:
                        scale = min(max_w / w, max_h / h)
                        new_w, new_h = int(w * scale), int(h * scale)
                        image = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
                
                images.append(image)
                
                if (i + 1) % 10 == 0:
                    logger.info(f"배치 로딩 진행률: {i + 1}/{len(image_paths)}")
                    
            except Exception as e:
                logger.error(f"이미지 배치 로드 중 오류 ({image_path}): {e}")
                images.append(None)
        
        return images
    
    def create_temp_directory(self) -> Path:
        """임시 작업 디렉토리 생성"""
        if self.temp_dir is None:
            self.temp_dir = Path(tempfile.mkdtemp(prefix='animal_detector_'))
            logger.info(f"📁 임시 디렉토리 생성: {self.temp_dir}")
        
        return self.temp_dir
    
    def cleanup_temp_directory(self):
        """임시 디렉토리 정리"""
        if self.temp_dir and self.temp_dir.exists():
            try:
                shutil.rmtree(self.temp_dir)
                logger.info(f"🗑️ 임시 디렉토리 정리 완료: {self.temp_dir}")
                self.temp_dir = None
            except Exception as e:
                logger.error(f"임시 디렉토리 정리 실패: {e}")
    
    def validate_file_integrity(self, file_path: Union[str, Path]) -> bool:
        """
        파일 무결성 검증
        
        Args:
            file_path: 검증할 파일 경로
            
        Returns:
            파일이 유효한지 여부
        """
        try:
            file_path = Path(file_path)
            
            if not file_path.exists():
                return False
            
            if self.is_image_file(file_path):
                # 이미지 파일 검증
                image = self.load_image(file_path)
                return image is not None
            
            elif self.is_video_file(file_path):
                # 비디오 파일 검증
                cap = cv2.VideoCapture(str(file_path))
                is_valid = cap.isOpened()
                cap.release()
                return is_valid
            
            else:
                # 기타 파일은 존재 여부만 확인
                return True
                
        except Exception as e:
            logger.error(f"파일 검증 중 오류: {e}")
            return False
    
    def get_safe_filename(self, filename: str, max_length: int = 100) -> str:
        """
        안전한 파일명 생성 (특수문자 제거, 길이 제한)
        
        Args:
            filename: 원본 파일명
            max_length: 최대 길이
            
        Returns:
            안전한 파일명
        """
        import re
        
        # 특수문자 제거/치환
        safe_chars = re.sub(r'[<>:"/\\|?*]', '_', filename)
        safe_chars = re.sub(r'\s+', '_', safe_chars)  # 공백을 밑줄로
        safe_chars = re.sub(r'_+', '_', safe_chars)   # 연속된 밑줄 제거
        safe_chars = safe_chars.strip('_')             # 앞뒤 밑줄 제거
        
        # 길이 제한
        if len(safe_chars) > max_length:
            name, ext = Path(safe_chars).stem, Path(safe_chars).suffix
            max_name_length = max_length - len(ext)
            safe_chars = name[:max_name_length] + ext
        
        return safe_chars or 'unnamed'
    
    def __del__(self):
        """소멸자에서 임시 디렉토리 정리"""
        self.cleanup_temp_directory()

class ConfigManager:
    """설정 파일 관리자"""
    
    def __init__(self, config_path: Union[str, Path] = "config.json"):
        self.config_path = Path(config_path)
        self.config = self._load_default_config()
        self.load_config()
    
    def _load_default_config(self) -> Dict:
        """기본 설정 반환"""
        return {
            'detection': {
                'yolo_model_size': 'n',
                'yolo_confidence': 0.5,
                'haar_scale_factor': 1.1,
                'haar_min_neighbors': 5,
                'haar_min_size': [50, 50],
                'huggingface_model': 'animal-classification',
                'huggingface_confidence': 0.5
            },
            'visualization': {
                'font_scale': 0.6,
                'thickness': 2,
                'show_confidence': True,
                'show_detector_name': True
            },
            'output': {
                'save_images': True,
                'save_json': True,
                'output_directory': 'output',
                'image_quality': 95
            },
            'performance': {
                'batch_size': 8,
                'max_image_size': [1920, 1080],
                'video_skip_frames': 5
            }
        }
    
    def load_config(self) -> bool:
        """설정 파일 로드"""
        try:
            if self.config_path.exists():
                with open(self.config_path, 'r', encoding='utf-8') as f:
                    loaded_config = json.load(f)
                
                # 기본 설정과 병합
                self._merge_config(self.config, loaded_config)
                logger.info(f"✅ 설정 파일 로드 완료: {self.config_path}")
                return True
            else:
                logger.info("설정 파일이 없어 기본 설정 사용")
                self.save_config()  # 기본 설정 파일 생성
                return False
                
        except Exception as e:
            logger.error(f"설정 파일 로드 실패: {e}")
            return False
    
    def save_config(self) -> bool:
        """설정 파일 저장"""
        try:
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, indent=2, ensure_ascii=False)
            
            logger.info(f"✅ 설정 파일 저장 완료: {self.config_path}")
            return True
            
        except Exception as e:
            logger.error(f"설정 파일 저장 실패: {e}")
            return False
    
    def _merge_config(self, base_config: Dict, new_config: Dict):
        """설정 딕셔너리 병합"""
        for key, value in new_config.items():
            if key in base_config and isinstance(base_config[key], dict) and isinstance(value, dict):
                self._merge_config(base_config[key], value)
            else:
                base_config[key] = value
    
    def get(self, key_path: str, default=None):
        """점 표기법으로 설정값 조회 (예: 'detection.yolo_confidence')"""
        keys = key_path.split('.')
        value = self.config
        
        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return default
        
        return value
    
    def set(self, key_path: str, value):
        """점 표기법으로 설정값 변경"""
        keys = key_path.split('.')
        config = self.config
        
        for key in keys[:-1]:
            if key not in config:
                config[key] = {}
            config = config[key]
        
        config[keys[-1]] = value