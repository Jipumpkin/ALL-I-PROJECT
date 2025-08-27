#!/usr/bin/env python3
"""
Real-time Animal Detection System
실시간 동물 얼굴 탐지 시스템 (웹캠, 비디오 파일)
"""
import cv2
import numpy as np
import threading
import time
from collections import deque
from pathlib import Path
import json
from datetime import datetime

# Enhanced detector import
try:
    from enhanced_animal_detector import EnhancedAnimalDetector
    ENHANCED_AVAILABLE = True
except ImportError:
    ENHANCED_AVAILABLE = False

class RealTimeAnimalDetector:
    """실시간 동물 탐지 시스템"""
    
    def __init__(self):
        self.detector = None
        self.is_running = False
        self.cap = None
        
        # 성능 모니터링
        self.fps_counter = deque(maxlen=30)
        self.detection_history = deque(maxlen=100)
        
        # 설정
        self.confidence_threshold = 0.4
        self.nms_threshold = 0.5
        self.skip_frames = 3  # 프레임 스킵으로 성능 향상
        self.frame_count = 0
        
        # 통계
        self.stats = {
            'total_frames': 0,
            'detections': 0,
            'avg_fps': 0,
            'max_detections': 0
        }
        
        if ENHANCED_AVAILABLE:
            self.init_detector()
    
    def init_detector(self):
        """탐지기 초기화"""
        print("실시간 탐지 시스템 초기화 중...")
        try:
            self.detector = EnhancedAnimalDetector()
            print("✓ 탐지기 초기화 완료")
        except Exception as e:
            print(f"✗ 탐지기 초기화 실패: {e}")
    
    def start_webcam_detection(self, camera_id=0):
        """웹캠 실시간 탐지 시작"""
        print(f"웹캠 탐지 시작 (Camera ID: {camera_id})")
        
        self.cap = cv2.VideoCapture(camera_id)
        if not self.cap.isOpened():
            print("웹캠을 열 수 없습니다.")
            return False
        
        # 해상도 설정
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        self.cap.set(cv2.CAP_PROP_FPS, 30)
        
        self.is_running = True
        self.run_detection_loop()
        return True
    
    def start_video_detection(self, video_path):
        """비디오 파일 탐지 시작"""
        print(f"비디오 탐지 시작: {video_path}")
        
        if not Path(video_path).exists():
            print("비디오 파일을 찾을 수 없습니다.")
            return False
        
        self.cap = cv2.VideoCapture(str(video_path))
        if not self.cap.isOpened():
            print("비디오 파일을 열 수 없습니다.")
            return False
        
        self.is_running = True
        self.run_detection_loop()
        return True
    
    def run_detection_loop(self):
        """메인 탐지 루프"""
        print("탐지 시작! 'q'를 눌러 종료하세요.")
        
        while self.is_running and self.cap.isOpened():
            start_time = time.time()
            
            ret, frame = self.cap.read()
            if not ret:
                break
            
            self.frame_count += 1
            self.stats['total_frames'] += 1
            
            # 프레임 스킵으로 성능 향상
            if self.frame_count % (self.skip_frames + 1) != 0:
                cv2.imshow('Real-time Animal Detection', frame)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
                continue
            
            # 탐지 수행
            detections = self.detect_in_frame(frame)
            
            # 결과 시각화
            annotated_frame = self.draw_detections(frame, detections)
            
            # 통계 업데이트
            self.update_stats(detections)
            
            # 정보 오버레이 추가
            annotated_frame = self.add_info_overlay(annotated_frame, detections)
            
            # 화면에 표시
            cv2.imshow('Real-time Animal Detection', annotated_frame)
            
            # FPS 계산
            end_time = time.time()
            fps = 1.0 / (end_time - start_time)
            self.fps_counter.append(fps)
            
            # 키 입력 확인
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('s'):
                self.save_frame(annotated_frame, detections)
            elif key == ord('r'):
                self.reset_stats()
        
        self.cleanup()
    
    def detect_in_frame(self, frame):
        """단일 프레임에서 탐지 수행"""
        if not self.detector:
            return []
        
        try:
            # 임시 파일로 저장하여 탐지 (성능상 이유로 간소화된 방법 사용)
            detections = self.fast_detect_in_frame(frame)
            return detections
            
        except Exception as e:
            print(f"탐지 중 오류: {e}")
            return []
    
    def fast_detect_in_frame(self, frame):
        """프레임에서 빠른 탐지 (최적화된 버전)"""
        detections = []
        
        # 1. 빠른 Haar Cascade 탐지
        if hasattr(self.detector, 'models') and 'cascades' in self.detector.models:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # 성능을 위해 이미지 크기 축소
            scale = 0.5
            small_gray = cv2.resize(gray, (0, 0), fx=scale, fy=scale)
            
            for cascade_name, cascade in self.detector.models['cascades'].items():
                if cascade.empty():
                    continue
                
                faces = cascade.detectMultiScale(
                    small_gray,
                    scaleFactor=1.2,
                    minNeighbors=3,
                    minSize=(20, 20),
                    flags=cv2.CASCADE_SCALE_IMAGE
                )
                
                # 좌표를 원본 크기로 변환
                for (x, y, w, h) in faces:
                    x, y, w, h = int(x/scale), int(y/scale), int(w/scale), int(h/scale)
                    
                    if w > 30 and h > 30:  # 최소 크기 필터
                        detections.append({
                            'method': f'Cascade-{cascade_name}',
                            'bbox': (x, y, w, h),
                            'confidence': 0.6
                        })
        
        # 2. 원형 특징 탐지 (눈)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        circles = cv2.HoughCircles(
            gray,
            cv2.HOUGH_GRADIENT,
            dp=2,
            minDist=30,
            param1=50,
            param2=30,
            minRadius=5,
            maxRadius=40
        )
        
        if circles is not None:
            circles = np.round(circles[0, :]).astype("int")
            for (x, y, r) in circles[:5]:  # 최대 5개
                detections.append({
                    'method': 'Eye-Circle',
                    'bbox': (x-r, y-r, 2*r, 2*r),
                    'confidence': 0.4,
                    'type': 'eye'
                })
        
        # NMS 적용
        return self._apply_realtime_nms(detections)
    
    def _apply_realtime_nms(self, detections, threshold=0.4):
        """실시간용 간단한 NMS"""
        if not detections:
            return []
        
        # 신뢰도 순으로 정렬
        detections = sorted(detections, key=lambda x: x['confidence'], reverse=True)
        
        filtered = []
        for det in detections:
            x1, y1, w1, h1 = det['bbox']
            
            # 기존 탐지와 겹침 확인
            overlap = False
            for existing in filtered:
                x2, y2, w2, h2 = existing['bbox']
                
                # IoU 계산
                xi1, yi1 = max(x1, x2), max(y1, y2)
                xi2, yi2 = min(x1+w1, x2+w2), min(y1+h1, y2+h2)
                
                if xi1 < xi2 and yi1 < yi2:
                    inter_area = (xi2 - xi1) * (yi2 - yi1)
                    union_area = w1*h1 + w2*h2 - inter_area
                    iou = inter_area / union_area if union_area > 0 else 0
                    
                    if iou > threshold:
                        overlap = True
                        break
            
            if not overlap:
                filtered.append(det)
                
            if len(filtered) >= 10:  # 최대 10개
                break
        
        return filtered
    
    def draw_detections(self, frame, detections):
        """탐지 결과 시각화"""
        annotated = frame.copy()
        
        colors = {
            'Cascade': (0, 255, 0),      # 초록
            'Eye-Circle': (255, 255, 0),  # 노랑
            'DNN': (255, 0, 0),          # 빨강
            'YOLO': (0, 0, 255)          # 파랑
        }
        
        for det in detections:
            x, y, w, h = det['bbox']
            conf = det['confidence']
            method = det.get('method', 'Unknown')
            
            # 방법별 색상
            color = colors.get(method.split('-')[0], (128, 128, 128))
            
            # 바운딩 박스
            thickness = 2 if conf > 0.5 else 1
            cv2.rectangle(annotated, (x, y), (x+w, y+h), color, thickness)
            
            # 라벨
            label = f"{method}: {conf:.2f}"
            if det.get('type') == 'eye':
                label = f"Eye: {conf:.2f}"
            
            # 라벨 배경
            (text_w, text_h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.4, 1)
            cv2.rectangle(annotated, (x, y-text_h-5), (x+text_w, y), color, -1)
            cv2.putText(annotated, label, (x, y-5), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
            
            # 중심점
            center_x, center_y = x + w//2, y + h//2
            cv2.circle(annotated, (center_x, center_y), 2, color, -1)
        
        return annotated
    
    def add_info_overlay(self, frame, detections):
        """정보 오버레이 추가"""
        h, w = frame.shape[:2]
        
        # 반투명 오버레이
        overlay = frame.copy()
        cv2.rectangle(overlay, (10, 10), (300, 120), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)
        
        # 텍스트 정보
        avg_fps = np.mean(self.fps_counter) if self.fps_counter else 0
        
        info_text = [
            f"FPS: {avg_fps:.1f}",
            f"Frame: {self.stats['total_frames']}",
            f"Detections: {len(detections)}",
            f"Total Found: {self.stats['detections']}",
            f"Max in Frame: {self.stats['max_detections']}"
        ]
        
        y_offset = 25
        for text in info_text:
            cv2.putText(frame, text, (15, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            y_offset += 20
        
        # 키 도움말
        help_text = "Keys: 'q'=quit, 's'=save, 'r'=reset"
        cv2.putText(frame, help_text, (10, h-10), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 200), 1)
        
        return frame
    
    def update_stats(self, detections):
        """통계 업데이트"""
        self.detection_history.append(len(detections))
        self.stats['detections'] += len(detections)
        self.stats['max_detections'] = max(self.stats['max_detections'], len(detections))
        self.stats['avg_fps'] = np.mean(self.fps_counter) if self.fps_counter else 0
    
    def save_frame(self, frame, detections):
        """현재 프레임 저장"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]
        
        # 이미지 저장
        filename = f"realtime_detection_{timestamp}.jpg"
        cv2.imwrite(filename, frame)
        
        # 탐지 정보 저장
        json_filename = f"realtime_detection_{timestamp}.json"
        with open(json_filename, 'w') as f:
            json.dump({
                'timestamp': timestamp,
                'frame_number': self.stats['total_frames'],
                'detections': [
                    {
                        'method': det.get('method', 'Unknown'),
                        'bbox': det['bbox'],
                        'confidence': det['confidence'],
                        'type': det.get('type', 'face')
                    }
                    for det in detections
                ],
                'stats': self.stats.copy()
            }, f, indent=2)
        
        print(f"✓ 프레임 저장: {filename}")
        print(f"✓ 정보 저장: {json_filename}")
    
    def reset_stats(self):
        """통계 초기화"""
        self.stats = {
            'total_frames': 0,
            'detections': 0,
            'avg_fps': 0,
            'max_detections': 0
        }
        self.fps_counter.clear()
        self.detection_history.clear()
        print("✓ 통계 초기화 완료")
    
    def cleanup(self):
        """정리 작업"""
        self.is_running = False
        
        if self.cap:
            self.cap.release()
        
        cv2.destroyAllWindows()
        
        # 최종 통계 출력
        print("\n" + "="*50)
        print("실시간 탐지 세션 완료")
        print("-"*50)
        print(f"총 프레임 수: {self.stats['total_frames']}")
        print(f"총 탐지 수: {self.stats['detections']}")
        print(f"평균 FPS: {self.stats['avg_fps']:.1f}")
        print(f"최대 동시 탐지: {self.stats['max_detections']}")
        if self.detection_history:
            print(f"평균 프레임당 탐지: {np.mean(self.detection_history):.2f}")
        print("="*50)
    
    def stop(self):
        """탐지 중지"""
        self.is_running = False


class RealTimeGUI:
    """실시간 탐지 GUI (간단 버전)"""
    
    def __init__(self):
        import tkinter as tk
        from tkinter import ttk, messagebox, filedialog
        
        self.root = tk.Tk()
        self.root.title("Real-time Animal Detection")
        self.root.geometry("400x300")
        
        self.detector = RealTimeAnimalDetector()
        self.detection_thread = None
        
        self.setup_gui()
    
    def setup_gui(self):
        """GUI 설정"""
        import tkinter as tk
        from tkinter import ttk
        
        # 제목
        title = tk.Label(self.root, text="🎥 Real-time Animal Detection", 
                        font=("Arial", 16, "bold"))
        title.pack(pady=20)
        
        # 옵션 프레임
        options_frame = tk.LabelFrame(self.root, text="Options", font=("Arial", 12))
        options_frame.pack(pady=10, padx=20, fill=tk.X)
        
        # 신뢰도 임계값
        tk.Label(options_frame, text="Confidence Threshold:").pack()
        self.conf_var = tk.DoubleVar(value=0.4)
        conf_scale = tk.Scale(options_frame, from_=0.1, to=0.9, resolution=0.1,
                             orient=tk.HORIZONTAL, variable=self.conf_var)
        conf_scale.pack(pady=5)
        
        # 프레임 스킵
        tk.Label(options_frame, text="Frame Skip (higher = faster):").pack()
        self.skip_var = tk.IntVar(value=3)
        skip_scale = tk.Scale(options_frame, from_=0, to=10, orient=tk.HORIZONTAL,
                             variable=self.skip_var)
        skip_scale.pack(pady=5)
        
        # 버튼 프레임
        btn_frame = tk.Frame(self.root)
        btn_frame.pack(pady=20)
        
        # 웹캠 시작
        webcam_btn = tk.Button(btn_frame, text="📹 Start Webcam",
                              command=self.start_webcam, bg="#4CAF50", fg="white",
                              font=("Arial", 11, "bold"), width=15)
        webcam_btn.pack(pady=5)
        
        # 비디오 파일
        video_btn = tk.Button(btn_frame, text="📁 Open Video File",
                             command=self.open_video_file, bg="#2196F3", fg="white",
                             font=("Arial", 11, "bold"), width=15)
        video_btn.pack(pady=5)
        
        # 중지
        stop_btn = tk.Button(btn_frame, text="⏹ Stop Detection",
                            command=self.stop_detection, bg="#F44336", fg="white",
                            font=("Arial", 11, "bold"), width=15)
        stop_btn.pack(pady=5)
        
        # 도움말
        help_text = """Instructions:
• Click 'Start Webcam' for live detection
• Click 'Open Video File' for video analysis
• During detection:
  - Press 'q' to quit
  - Press 's' to save current frame
  - Press 'r' to reset statistics"""
        
        help_label = tk.Label(self.root, text=help_text, justify=tk.LEFT,
                             font=("Arial", 9), fg="gray")
        help_label.pack(pady=10, padx=20)
    
    def start_webcam(self):
        """웹캠 시작"""
        self.update_detector_settings()
        
        def run():
            self.detector.start_webcam_detection()
        
        self.detection_thread = threading.Thread(target=run, daemon=True)
        self.detection_thread.start()
    
    def open_video_file(self):
        """비디오 파일 열기"""
        from tkinter import filedialog
        
        video_path = filedialog.askopenfilename(
            title="Select Video File",
            filetypes=[
                ("Video files", "*.mp4 *.avi *.mov *.mkv *.wmv"),
                ("All files", "*.*")
            ]
        )
        
        if video_path:
            self.update_detector_settings()
            
            def run():
                self.detector.start_video_detection(video_path)
            
            self.detection_thread = threading.Thread(target=run, daemon=True)
            self.detection_thread.start()
    
    def stop_detection(self):
        """탐지 중지"""
        self.detector.stop()
    
    def update_detector_settings(self):
        """탐지기 설정 업데이트"""
        self.detector.confidence_threshold = self.conf_var.get()
        self.detector.skip_frames = self.skip_var.get()
    
    def run(self):
        """GUI 실행"""
        self.root.mainloop()


def main():
    """메인 함수"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Real-time Animal Detection")
    parser.add_argument("--mode", choices=["gui", "webcam", "video"], default="gui",
                       help="실행 모드")
    parser.add_argument("--video", type=str, help="비디오 파일 경로 (video 모드)")
    parser.add_argument("--camera", type=int, default=0, help="카메라 ID (webcam 모드)")
    
    args = parser.parse_args()
    
    if not ENHANCED_AVAILABLE:
        print("경고: Enhanced detector 모듈을 찾을 수 없습니다!")
        print("기본 탐지 기능만 사용됩니다.")
        print()
    
    if args.mode == "gui":
        print("GUI 모드로 시작...")
        gui = RealTimeGUI()
        gui.run()
        
    elif args.mode == "webcam":
        print("웹캠 모드로 시작...")
        detector = RealTimeAnimalDetector()
        detector.start_webcam_detection(args.camera)
        
    elif args.mode == "video":
        if not args.video:
            print("비디오 모드에는 --video 인자가 필요합니다.")
            return
        
        print(f"비디오 모드로 시작: {args.video}")
        detector = RealTimeAnimalDetector()
        detector.start_video_detection(args.video)


if __name__ == "__main__":
    main()