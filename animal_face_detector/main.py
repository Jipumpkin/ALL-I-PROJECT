#!/usr/bin/env python3
"""
🐕 Animal Face Detection Project - Main Module
사전학습된 모델들을 활용한 독립적인 동물 얼굴 탐지 프로젝트

지원 기능:
- YOLO 기반 동물 탐지 (개, 고양이, 말 등)
- Haar Cascade 기반 개 얼굴 전용 탐지
- Hugging Face 모델 기반 동물 분류
- 실시간 웹캠 탐지
- 이미지/비디오 파일 처리

사용법:
python main.py --image test.jpg
python main.py --video test.mp4
python main.py --webcam
"""

import cv2
import numpy as np
import argparse
import sys
from pathlib import Path
import logging
from datetime import datetime

# 로컬 모듈
from models.yolo_detector import YOLOAnimalDetector
from models.haar_detector import HaarDogDetector
from models.huggingface_detector import HuggingFaceAnimalClassifier
from utils.visualization import ResultVisualizer
from utils.file_handler import FileHandler

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'detection_log_{datetime.now().strftime("%Y%m%d")}.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class AnimalFaceDetectionSystem:
    """통합 동물 얼굴 탐지 시스템"""
    
    def __init__(self):
        logger.info("🐕 동물 얼굴 탐지 시스템 초기화 중...")
        
        self.detectors = {}
        self.visualizer = ResultVisualizer()
        self.file_handler = FileHandler()
        
        # 탐지기 초기화
        self._initialize_detectors()
        
        logger.info("✅ 시스템 초기화 완료!")
    
    def _initialize_detectors(self):
        """사용 가능한 탐지기들 초기화"""
        try:
            # YOLO 탐지기 (최우선)
            logger.info("YOLO 탐지기 로딩 중...")
            self.detectors['yolo'] = YOLOAnimalDetector()
            logger.info("✅ YOLO 탐지기 로드 완료")
        except Exception as e:
            logger.warning(f"❌ YOLO 탐지기 로드 실패: {e}")
        
        try:
            # Haar Cascade 개 탐지기
            logger.info("Haar Cascade 개 탐지기 로딩 중...")
            self.detectors['haar'] = HaarDogDetector()
            logger.info("✅ Haar Cascade 탐지기 로드 완료")
        except Exception as e:
            logger.warning(f"❌ Haar Cascade 탐지기 로드 실패: {e}")
        
        try:
            # Hugging Face 분류기
            logger.info("Hugging Face 분류기 로딩 중...")
            self.detectors['huggingface'] = HuggingFaceAnimalClassifier()
            logger.info("✅ Hugging Face 분류기 로드 완료")
        except Exception as e:
            logger.warning(f"❌ Hugging Face 분류기 로드 실패: {e}")
        
        if not self.detectors:
            raise RuntimeError("❌ 사용 가능한 탐지기가 없습니다. requirements.txt를 확인하고 필요한 패키지를 설치하세요.")
    
    def detect_from_image(self, image_path, output_dir="output"):
        """이미지에서 동물 탐지"""
        logger.info(f"🖼️ 이미지 처리 시작: {image_path}")
        
        if not Path(image_path).exists():
            logger.error(f"❌ 이미지 파일을 찾을 수 없습니다: {image_path}")
            return None
        
        # 이미지 로드
        image = cv2.imread(image_path)
        if image is None:
            logger.error(f"❌ 이미지 로드 실패: {image_path}")
            return None
        
        # 모든 탐지기로 탐지 수행
        all_results = {}
        
        for detector_name, detector in self.detectors.items():
            try:
                logger.info(f"🔍 {detector_name} 탐지기로 처리 중...")
                results = detector.detect(image)
                all_results[detector_name] = results
                logger.info(f"✅ {detector_name}: {len(results)}개 탐지됨")
            except Exception as e:
                logger.error(f"❌ {detector_name} 탐지 실패: {e}")
        
        # 결과 시각화 및 저장
        if all_results:
            output_path = self.visualizer.save_results(
                image, all_results, image_path, output_dir
            )
            logger.info(f"💾 결과 저장됨: {output_path}")
            return output_path
        
        return None
    
    def detect_from_video(self, video_path, output_dir="output"):
        """비디오에서 동물 탐지"""
        logger.info(f"🎥 비디오 처리 시작: {video_path}")
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            logger.error(f"❌ 비디오 파일을 열 수 없습니다: {video_path}")
            return None
        
        # 비디오 정보
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        logger.info(f"📊 비디오 정보: {width}x{height}, {fps}fps, {total_frames}프레임")
        
        # 출력 비디오 설정
        output_path = Path(output_dir) / f"detected_{Path(video_path).name}"
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(str(output_path), fourcc, fps, (width, height))
        
        frame_count = 0
        detection_count = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_count += 1
            
            # 매 10프레임마다 탐지 (성능 최적화)
            if frame_count % 10 == 0:
                # YOLO 탐지기 우선 사용
                if 'yolo' in self.detectors:
                    try:
                        results = self.detectors['yolo'].detect(frame)
                        if results:
                            detection_count += len(results)
                            frame = self.visualizer.draw_detections(frame, results, 'YOLO')
                    except Exception as e:
                        logger.warning(f"프레임 {frame_count} 탐지 실패: {e}")
            
            out.write(frame)
            
            # 진행률 표시
            if frame_count % 100 == 0:
                progress = (frame_count / total_frames) * 100
                logger.info(f"⏳ 처리 진행률: {progress:.1f}% ({frame_count}/{total_frames})")
        
        cap.release()
        out.release()
        
        logger.info(f"✅ 비디오 처리 완료: {detection_count}개 탐지됨")
        logger.info(f"💾 결과 저장됨: {output_path}")
        
        return str(output_path)
    
    def detect_from_webcam(self):
        """실시간 웹캠 탐지"""
        logger.info("📷 실시간 웹캠 탐지 시작 (ESC로 종료)")
        
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            logger.error("❌ 웹캠에 접근할 수 없습니다.")
            return
        
        # 웹캠 설정
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        
        detection_count = 0
        frame_count = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_count += 1
            
            # 매 5프레임마다 탐지 (실시간 성능)
            if frame_count % 5 == 0:
                # YOLO 탐지기 우선 사용
                if 'yolo' in self.detectors:
                    try:
                        results = self.detectors['yolo'].detect(frame)
                        if results:
                            detection_count += len(results)
                            frame = self.visualizer.draw_detections(frame, results, 'YOLO')
                    except Exception as e:
                        pass  # 실시간에서는 에러 로그 최소화
            
            # 정보 표시
            cv2.putText(frame, f"Detections: {detection_count}", (10, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            cv2.putText(frame, "Press ESC to quit", (10, frame.shape[0] - 10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            
            cv2.imshow('Animal Face Detection - Webcam', frame)
            
            # ESC 키로 종료
            if cv2.waitKey(1) & 0xFF == 27:
                break
        
        cap.release()
        cv2.destroyAllWindows()
        logger.info(f"✅ 웹캠 탐지 완료: 총 {detection_count}개 탐지됨")
    
    def get_system_info(self):
        """시스템 정보 반환"""
        info = {
            'available_detectors': list(self.detectors.keys()),
            'detector_info': {}
        }
        
        for name, detector in self.detectors.items():
            info['detector_info'][name] = {
                'type': type(detector).__name__,
                'description': getattr(detector, 'description', 'N/A')
            }
        
        return info

def main():
    """메인 함수"""
    parser = argparse.ArgumentParser(description='🐕 동물 얼굴 탐지 프로그램')
    parser.add_argument('--image', '-i', help='탐지할 이미지 파일 경로')
    parser.add_argument('--video', '-v', help='탐지할 비디오 파일 경로')
    parser.add_argument('--webcam', '-w', action='store_true', help='실시간 웹캠 탐지')
    parser.add_argument('--output', '-o', default='output', help='결과 저장 디렉토리 (기본: output)')
    parser.add_argument('--info', action='store_true', help='시스템 정보 출력')
    
    args = parser.parse_args()
    
    try:
        # 시스템 초기화
        system = AnimalFaceDetectionSystem()
        
        if args.info:
            # 시스템 정보 출력
            info = system.get_system_info()
            print("\n🐕 동물 얼굴 탐지 시스템 정보")
            print("=" * 50)
            print(f"사용 가능한 탐지기: {', '.join(info['available_detectors'])}")
            for name, detail in info['detector_info'].items():
                print(f"  - {name}: {detail['type']}")
        
        elif args.image:
            # 이미지 처리
            result = system.detect_from_image(args.image, args.output)
            if result:
                print(f"✅ 처리 완료! 결과: {result}")
            else:
                print("❌ 이미지 처리 실패")
        
        elif args.video:
            # 비디오 처리
            result = system.detect_from_video(args.video, args.output)
            if result:
                print(f"✅ 처리 완료! 결과: {result}")
            else:
                print("❌ 비디오 처리 실패")
        
        elif args.webcam:
            # 웹캠 처리
            system.detect_from_webcam()
        
        else:
            # 사용법 출력
            parser.print_help()
            print("\n🐕 사용 예시:")
            print("  python main.py --image dog.jpg")
            print("  python main.py --video dog_video.mp4")
            print("  python main.py --webcam")
            print("  python main.py --info")
    
    except KeyboardInterrupt:
        logger.info("❌ 사용자에 의해 중단됨")
    except Exception as e:
        logger.error(f"❌ 시스템 오류: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()