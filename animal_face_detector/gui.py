#!/usr/bin/env python3
"""
🐕 Animal Face Detection GUI
동물 얼굴 탐지 시스템을 위한 간단한 그래픽 사용자 인터페이스
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
import cv2
import numpy as np
from PIL import Image, ImageTk
import threading
import queue
import sys
import logging
from pathlib import Path
import json
from datetime import datetime

# 로컬 모듈
try:
    from models.yolo_detector import YOLOAnimalDetector
    from models.haar_detector import HaarDogDetector, MultiHaarDetector
    from models.huggingface_detector import HuggingFaceAnimalClassifier
    from utils.visualization import ResultVisualizer
    from utils.file_handler import FileHandler, ConfigManager
except ImportError as e:
    print(f"모듈 import 오류: {e}")
    print("프로젝트 루트 디렉토리에서 실행하세요: python gui.py")
    sys.exit(1)

# 로그 설정
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

class DetectionGUI:
    """동물 탐지 GUI 메인 클래스"""
    
    def __init__(self, root):
        self.root = root
        self.root.title("🐕 Animal Face Detection System")
        self.root.geometry("1200x800")
        
        # 시스템 컴포넌트
        self.detectors = {}
        self.visualizer = ResultVisualizer()
        self.file_handler = FileHandler()
        self.config_manager = ConfigManager()
        
        # GUI 상태
        self.current_image = None
        self.current_image_path = None
        self.detection_results = {}
        self.processing_queue = queue.Queue()
        
        # GUI 구성
        self.setup_gui()
        self.load_detectors()
        
        # 백그라운드 처리 스레드 시작
        self.processing_thread = threading.Thread(target=self.process_queue, daemon=True)
        self.processing_thread.start()
    
    def setup_gui(self):
        """GUI 레이아웃 설정"""
        # 메뉴 바
        self.create_menu()
        
        # 메인 프레임
        main_frame = ttk.Frame(self.root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # 좌측 패널 (이미지 표시)
        left_frame = ttk.LabelFrame(main_frame, text="이미지")
        left_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 5))
        
        # 이미지 캔버스
        self.image_frame = ttk.Frame(left_frame)
        self.image_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        self.image_canvas = tk.Canvas(self.image_frame, bg='gray90')
        self.image_canvas.pack(fill=tk.BOTH, expand=True)
        
        # 우측 패널 (컨트롤 및 결과)
        right_frame = ttk.Frame(main_frame)
        right_frame.pack(side=tk.RIGHT, fill=tk.Y, padx=(5, 0))
        right_frame.configure(width=350)
        
        # 파일 선택 섹션
        self.create_file_section(right_frame)
        
        # 탐지기 설정 섹션
        self.create_detector_section(right_frame)
        
        # 실행 버튼 섹션
        self.create_action_section(right_frame)
        
        # 결과 표시 섹션
        self.create_results_section(right_frame)
        
        # 상태 바
        self.create_status_bar()
    
    def create_menu(self):
        """메뉴 바 생성"""
        menubar = tk.Menu(self.root)
        self.root.config(menu=menubar)
        
        # 파일 메뉴
        file_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="파일", menu=file_menu)
        file_menu.add_command(label="이미지 열기...", command=self.load_image, accelerator="Ctrl+O")
        file_menu.add_command(label="비디오 열기...", command=self.load_video)
        file_menu.add_separator()
        file_menu.add_command(label="결과 저장...", command=self.save_results, accelerator="Ctrl+S")
        file_menu.add_separator()
        file_menu.add_command(label="종료", command=self.root.quit, accelerator="Ctrl+Q")
        
        # 도구 메뉴
        tools_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="도구", menu=tools_menu)
        tools_menu.add_command(label="배치 처리...", command=self.batch_process)
        tools_menu.add_command(label="웹캠 실시간 탐지", command=self.start_webcam)
        tools_menu.add_separator()
        tools_menu.add_command(label="설정...", command=self.show_settings)
        
        # 도움말 메뉴
        help_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="도움말", menu=help_menu)
        help_menu.add_command(label="사용법", command=self.show_help)
        help_menu.add_command(label="정보", command=self.show_about)
        
        # 키보드 단축키
        self.root.bind('<Control-o>', lambda e: self.load_image())
        self.root.bind('<Control-s>', lambda e: self.save_results())
        self.root.bind('<Control-q>', lambda e: self.root.quit())
    
    def create_file_section(self, parent):
        """파일 선택 섹션"""
        file_frame = ttk.LabelFrame(parent, text="파일 선택")
        file_frame.pack(fill=tk.X, pady=(0, 5))
        
        ttk.Button(file_frame, text="이미지 열기", 
                  command=self.load_image).pack(fill=tk.X, padx=5, pady=2)
        ttk.Button(file_frame, text="비디오 열기", 
                  command=self.load_video).pack(fill=tk.X, padx=5, pady=2)
        
        # 현재 파일 표시
        self.file_label = ttk.Label(file_frame, text="파일 없음", 
                                   font=('Arial', 8), foreground='gray')
        self.file_label.pack(padx=5, pady=2)
    
    def create_detector_section(self, parent):
        """탐지기 설정 섹션"""
        detector_frame = ttk.LabelFrame(parent, text="탐지기 설정")
        detector_frame.pack(fill=tk.X, pady=(0, 5))
        
        # 탐지기 선택 체크박스들
        self.detector_vars = {}
        
        # YOLO
        self.detector_vars['yolo'] = tk.BooleanVar(value=True)
        ttk.Checkbutton(detector_frame, text="YOLO (범용 동물 탐지)", 
                       variable=self.detector_vars['yolo']).pack(anchor=tk.W, padx=5, pady=1)
        
        # Haar Cascade
        self.detector_vars['haar'] = tk.BooleanVar(value=True)
        ttk.Checkbutton(detector_frame, text="Haar Cascade (개/고양이)", 
                       variable=self.detector_vars['haar']).pack(anchor=tk.W, padx=5, pady=1)
        
        # HuggingFace
        self.detector_vars['huggingface'] = tk.BooleanVar(value=False)
        ttk.Checkbutton(detector_frame, text="HuggingFace (분류)", 
                       variable=self.detector_vars['huggingface']).pack(anchor=tk.W, padx=5, pady=1)
        
        # 신뢰도 설정
        confidence_frame = ttk.Frame(detector_frame)
        confidence_frame.pack(fill=tk.X, padx=5, pady=5)
        
        ttk.Label(confidence_frame, text="신뢰도:").pack(side=tk.LEFT)
        self.confidence_var = tk.DoubleVar(value=0.5)
        self.confidence_scale = ttk.Scale(confidence_frame, from_=0.1, to=1.0, 
                                        variable=self.confidence_var, orient=tk.HORIZONTAL)
        self.confidence_scale.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(5, 0))
        
        self.confidence_label = ttk.Label(confidence_frame, text="0.5")
        self.confidence_label.pack(side=tk.RIGHT)
        
        # 신뢰도 값 업데이트
        self.confidence_var.trace('w', self.update_confidence_label)
    
    def create_action_section(self, parent):
        """실행 버튼 섹션"""
        action_frame = ttk.LabelFrame(parent, text="실행")
        action_frame.pack(fill=tk.X, pady=(0, 5))
        
        ttk.Button(action_frame, text="🔍 탐지 실행", 
                  command=self.run_detection).pack(fill=tk.X, padx=5, pady=2)
        ttk.Button(action_frame, text="📹 웹캠 시작", 
                  command=self.start_webcam).pack(fill=tk.X, padx=5, pady=2)
        ttk.Button(action_frame, text="💾 결과 저장", 
                  command=self.save_results).pack(fill=tk.X, padx=5, pady=2)
        
        # 진행률 표시
        self.progress = ttk.Progressbar(action_frame, mode='indeterminate')
        self.progress.pack(fill=tk.X, padx=5, pady=2)
    
    def create_results_section(self, parent):
        """결과 표시 섹션"""
        results_frame = ttk.LabelFrame(parent, text="탐지 결과")
        results_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 5))
        
        # 결과 텍스트
        self.results_text = scrolledtext.ScrolledText(results_frame, height=15, 
                                                     font=('Consolas', 9))
        self.results_text.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # 결과 요약
        summary_frame = ttk.Frame(results_frame)
        summary_frame.pack(fill=tk.X, padx=5, pady=(0, 5))
        
        self.summary_label = ttk.Label(summary_frame, text="탐지 결과 없음", 
                                      font=('Arial', 9, 'bold'))
        self.summary_label.pack()
    
    def create_status_bar(self):
        """상태 바 생성"""
        self.status_bar = ttk.Frame(self.root)
        self.status_bar.pack(side=tk.BOTTOM, fill=tk.X)
        
        self.status_label = ttk.Label(self.status_bar, text="준비됨", 
                                     font=('Arial', 8))
        self.status_label.pack(side=tk.LEFT, padx=5)
        
        # 탐지기 상태 표시
        self.detector_status_label = ttk.Label(self.status_bar, text="탐지기 로딩 중...", 
                                              font=('Arial', 8))
        self.detector_status_label.pack(side=tk.RIGHT, padx=5)
    
    def load_detectors(self):
        """탐지기 로딩 (백그라운드)"""
        def load_in_background():
            try:
                self.update_status("탐지기 로딩 중...")
                
                # YOLO 로드
                try:
                    self.detectors['yolo'] = YOLOAnimalDetector(
                        confidence_threshold=self.config_manager.get('detection.yolo_confidence', 0.5)
                    )
                    logger.info("✅ YOLO 탐지기 로드 완료")
                except Exception as e:
                    logger.warning(f"❌ YOLO 로드 실패: {e}")
                
                # Haar Cascade 로드
                try:
                    self.detectors['haar'] = MultiHaarDetector(['frontal_dog', 'frontal_cat'])
                    logger.info("✅ Haar Cascade 탐지기 로드 완료")
                except Exception as e:
                    logger.warning(f"❌ Haar Cascade 로드 실패: {e}")
                
                # HuggingFace 로드 (선택적)
                try:
                    self.detectors['huggingface'] = HuggingFaceAnimalClassifier(
                        confidence_threshold=self.config_manager.get('detection.huggingface_confidence', 0.5)
                    )
                    logger.info("✅ HuggingFace 분류기 로드 완료")
                except Exception as e:
                    logger.warning(f"❌ HuggingFace 로드 실패: {e}")
                
                # UI 업데이트
                loaded_count = len(self.detectors)
                self.root.after(0, lambda: self.detector_status_label.config(
                    text=f"탐지기 {loaded_count}개 로드됨"))
                self.root.after(0, lambda: self.update_status("준비됨"))
                
                if loaded_count == 0:
                    self.root.after(0, lambda: messagebox.showerror(
                        "오류", "사용 가능한 탐지기가 없습니다.\n필요한 패키지를 설치하세요."))
                
            except Exception as e:
                logger.error(f"탐지기 로딩 중 오류: {e}")
                self.root.after(0, lambda: self.update_status("탐지기 로딩 실패"))
        
        # 백그라운드 스레드에서 로딩
        loading_thread = threading.Thread(target=load_in_background, daemon=True)
        loading_thread.start()
    
    def load_image(self):
        """이미지 파일 열기"""
        file_path = filedialog.askopenfilename(
            title="이미지 파일 선택",
            filetypes=[
                ("이미지 파일", "*.jpg *.jpeg *.png *.bmp *.tiff *.webp"),
                ("모든 파일", "*.*")
            ]
        )
        
        if file_path:
            self.load_image_file(file_path)
    
    def load_image_file(self, file_path):
        """이미지 파일 로드"""
        try:
            self.update_status(f"이미지 로딩 중: {Path(file_path).name}")
            
            # 이미지 로드
            image = self.file_handler.load_image(file_path)
            if image is None:
                messagebox.showerror("오류", f"이미지를 로드할 수 없습니다: {file_path}")
                return
            
            self.current_image = image
            self.current_image_path = file_path
            self.detection_results = {}
            
            # 이미지 표시
            self.display_image(image)
            
            # UI 업데이트
            self.file_label.config(text=Path(file_path).name)
            self.update_results_display()
            self.update_status(f"이미지 로드 완료: {image.shape}")
            
        except Exception as e:
            logger.error(f"이미지 로드 중 오류: {e}")
            messagebox.showerror("오류", f"이미지 로드 실패: {e}")
    
    def display_image(self, image, max_size=(800, 600)):
        """캔버스에 이미지 표시"""
        try:
            h, w = image.shape[:2]
            max_w, max_h = max_size
            
            # 크기 조정
            if w > max_w or h > max_h:
                scale = min(max_w / w, max_h / h)
                new_w, new_h = int(w * scale), int(h * scale)
                display_image = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
            else:
                display_image = image.copy()
            
            # BGR을 RGB로 변환
            display_image = cv2.cvtColor(display_image, cv2.COLOR_BGR2RGB)
            
            # PIL 이미지로 변환
            pil_image = Image.fromarray(display_image)
            tk_image = ImageTk.PhotoImage(pil_image)
            
            # 캔버스에 표시
            self.image_canvas.delete("all")
            self.image_canvas.create_image(
                self.image_canvas.winfo_width() // 2,
                self.image_canvas.winfo_height() // 2,
                image=tk_image
            )
            
            # 이미지 참조 유지 (가비지 컬렉션 방지)
            self.image_canvas.image = tk_image
            
        except Exception as e:
            logger.error(f"이미지 표시 중 오류: {e}")
    
    def run_detection(self):
        """탐지 실행"""
        if self.current_image is None:
            messagebox.showwarning("경고", "먼저 이미지를 로드하세요.")
            return
        
        if not self.detectors:
            messagebox.showerror("오류", "사용 가능한 탐지기가 없습니다.")
            return
        
        # 선택된 탐지기 확인
        selected_detectors = []
        for name, var in self.detector_vars.items():
            if var.get() and name in self.detectors:
                selected_detectors.append(name)
        
        if not selected_detectors:
            messagebox.showwarning("경고", "최소 하나의 탐지기를 선택하세요.")
            return
        
        # 백그라운드 처리 요청
        self.processing_queue.put({
            'type': 'detection',
            'image': self.current_image.copy(),
            'detectors': selected_detectors,
            'confidence': self.confidence_var.get()
        })
        
        # UI 상태 업데이트
        self.progress.start()
        self.update_status("탐지 실행 중...")
    
    def process_queue(self):
        """백그라운드 처리 큐 처리"""
        while True:
            try:
                task = self.processing_queue.get(timeout=1)
                
                if task['type'] == 'detection':
                    self.process_detection_task(task)
                
                self.processing_queue.task_done()
                
            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"큐 처리 중 오류: {e}")
    
    def process_detection_task(self, task):
        """탐지 작업 처리"""
        try:
            image = task['image']
            selected_detectors = task['detectors']
            confidence = task['confidence']
            
            results = {}
            
            # 각 탐지기로 탐지 실행
            for detector_name in selected_detectors:
                if detector_name in self.detectors:
                    detector = self.detectors[detector_name]
                    
                    # 신뢰도 임계값 업데이트
                    if hasattr(detector, 'set_confidence_threshold'):
                        detector.set_confidence_threshold(confidence)
                    
                    detections = detector.detect(image)
                    results[detector_name] = detections
            
            # UI 업데이트 (메인 스레드에서)
            self.root.after(0, lambda: self.on_detection_complete(image, results))
            
        except Exception as e:
            logger.error(f"탐지 처리 중 오류: {e}")
            self.root.after(0, lambda: self.on_detection_error(str(e)))
    
    def on_detection_complete(self, image, results):
        """탐지 완료 처리"""
        try:
            self.detection_results = results
            
            # 결과 이미지 생성 및 표시
            if any(results.values()):
                result_image = self.visualizer.draw_multiple_detections(image, results)
                self.display_image(result_image)
            
            # 결과 표시 업데이트
            self.update_results_display()
            
            # 요약 정보 업데이트
            total_detections = sum(len(dets) for dets in results.values())
            self.summary_label.config(text=f"총 {total_detections}개 탐지됨")
            
            # UI 상태 복원
            self.progress.stop()
            self.update_status("탐지 완료")
            
        except Exception as e:
            logger.error(f"탐지 완료 처리 중 오류: {e}")
            self.on_detection_error(str(e))
    
    def on_detection_error(self, error_msg):
        """탐지 오류 처리"""
        self.progress.stop()
        self.update_status("탐지 실패")
        messagebox.showerror("탐지 오류", f"탐지 중 오류가 발생했습니다:\n{error_msg}")
    
    def update_results_display(self):
        """결과 표시 업데이트"""
        self.results_text.delete(1.0, tk.END)
        
        if not self.detection_results:
            self.results_text.insert(tk.END, "탐지 결과 없음\n")
            return
        
        # 탐지 결과 요약 생성
        summary = self.visualizer.create_detection_summary(self.detection_results)
        
        # 요약 정보 표시
        self.results_text.insert(tk.END, f"🐕 탐지 결과 요약\n")
        self.results_text.insert(tk.END, f"{'='*40}\n")
        self.results_text.insert(tk.END, f"총 탐지 수: {summary['total_detections']}\n")
        self.results_text.insert(tk.END, f"사용된 탐지기: {summary['detectors_used']}개\n\n")
        
        # 탐지된 동물별 수
        if summary['animal_counts']:
            self.results_text.insert(tk.END, "🦊 탐지된 동물:\n")
            for animal, count in summary['animal_counts'].items():
                self.results_text.insert(tk.END, f"  - {animal}: {count}마리\n")
            self.results_text.insert(tk.END, "\n")
        
        # 탐지기별 상세 결과
        self.results_text.insert(tk.END, "🔍 탐지기별 결과:\n")
        for detector_name, info in summary['detector_summary'].items():
            self.results_text.insert(tk.END, f"  📊 {detector_name}:\n")
            self.results_text.insert(tk.END, f"    탐지 수: {info['count']}\n")
            
            if info['count'] > 0:
                self.results_text.insert(tk.END, f"    평균 신뢰도: {info['avg_confidence']:.3f}\n")
                self.results_text.insert(tk.END, f"    신뢰도 범위: {info['min_confidence']:.3f} ~ {info['max_confidence']:.3f}\n")
                
                if info['animals']:
                    animals_str = ", ".join([f"{k}({v})" for k, v in info['animals'].items()])
                    self.results_text.insert(tk.END, f"    탐지 동물: {animals_str}\n")
            
            self.results_text.insert(tk.END, "\n")
        
        # 신뢰도 통계
        if summary.get('confidence_stats'):
            stats = summary['confidence_stats']
            self.results_text.insert(tk.END, "📈 신뢰도 통계:\n")
            self.results_text.insert(tk.END, f"  평균: {stats['avg']:.3f} ± {stats['std']:.3f}\n")
            self.results_text.insert(tk.END, f"  범위: {stats['min']:.3f} ~ {stats['max']:.3f}\n")
    
    def save_results(self):
        """결과 저장"""
        if not self.detection_results or self.current_image is None:
            messagebox.showwarning("경고", "저장할 결과가 없습니다.")
            return
        
        try:
            # 저장 디렉토리 선택
            output_dir = filedialog.askdirectory(title="결과 저장 디렉토리 선택")
            if not output_dir:
                return
            
            # 결과 저장
            saved_path = self.visualizer.save_results(
                self.current_image, 
                self.detection_results,
                self.current_image_path,
                output_dir
            )
            
            if saved_path:
                messagebox.showinfo("저장 완료", f"결과가 저장되었습니다:\n{saved_path}")
            else:
                messagebox.showerror("저장 실패", "결과 저장에 실패했습니다.")
                
        except Exception as e:
            logger.error(f"결과 저장 중 오류: {e}")
            messagebox.showerror("저장 오류", f"저장 중 오류가 발생했습니다:\n{e}")
    
    def update_confidence_label(self, *args):
        """신뢰도 라벨 업데이트"""
        value = self.confidence_var.get()
        self.confidence_label.config(text=f"{value:.2f}")
    
    def update_status(self, message):
        """상태 바 업데이트"""
        self.status_label.config(text=message)
        self.root.update_idletasks()
    
    def load_video(self):
        """비디오 파일 로드 (구현 예정)"""
        messagebox.showinfo("알림", "비디오 처리 기능은 곧 추가될 예정입니다.")
    
    def start_webcam(self):
        """웹캠 실시간 탐지 (구현 예정)"""
        messagebox.showinfo("알림", "웹캠 기능은 곧 추가될 예정입니다.")
    
    def batch_process(self):
        """배치 처리 (구현 예정)"""
        messagebox.showinfo("알림", "배치 처리 기능은 곧 추가될 예정입니다.")
    
    def show_settings(self):
        """설정 창 표시"""
        SettingsDialog(self.root, self.config_manager)
    
    def show_help(self):
        """도움말 표시"""
        help_text = """
🐕 동물 얼굴 탐지 시스템 사용법

1. 파일 선택:
   - "이미지 열기" 버튼으로 분석할 이미지 선택
   
2. 탐지기 설정:
   - YOLO: 범용 동물 탐지 (빠르고 정확)
   - Haar Cascade: 개/고양이 전용 (가벼움)
   - HuggingFace: AI 기반 분류 (고급)
   
3. 탐지 실행:
   - 신뢰도 조정 후 "탐지 실행" 클릭
   
4. 결과 확인:
   - 이미지에서 탐지된 동물 확인
   - 우측 패널에서 상세 결과 확인
   
5. 저장:
   - "결과 저장"으로 이미지와 JSON 결과 저장

키보드 단축키:
- Ctrl+O: 이미지 열기
- Ctrl+S: 결과 저장
- Ctrl+Q: 종료
        """
        
        messagebox.showinfo("사용법", help_text)
    
    def show_about(self):
        """정보 표시"""
        about_text = """
🐕 Animal Face Detection System
버전: 1.0

사전 학습된 AI 모델들을 활용한 
동물 얼굴 탐지 및 분류 시스템

지원 모델:
• YOLO (Ultralytics)
• Haar Cascade (OpenCV)  
• HuggingFace Transformers

개발: Claude Code Assistant
라이선스: MIT License
        """
        
        messagebox.showinfo("정보", about_text)

class SettingsDialog:
    """설정 대화상자"""
    
    def __init__(self, parent, config_manager):
        self.config_manager = config_manager
        
        # 대화상자 생성
        self.dialog = tk.Toplevel(parent)
        self.dialog.title("설정")
        self.dialog.geometry("400x500")
        self.dialog.transient(parent)
        self.dialog.grab_set()
        
        self.setup_settings_gui()
    
    def setup_settings_gui(self):
        """설정 GUI 구성"""
        notebook = ttk.Notebook(self.dialog)
        notebook.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # 탐지 설정
        detection_frame = ttk.Frame(notebook)
        notebook.add(detection_frame, text="탐지 설정")
        self.create_detection_settings(detection_frame)
        
        # 시각화 설정
        visual_frame = ttk.Frame(notebook)
        notebook.add(visual_frame, text="시각화")
        self.create_visual_settings(visual_frame)
        
        # 출력 설정
        output_frame = ttk.Frame(notebook)
        notebook.add(output_frame, text="출력")
        self.create_output_settings(output_frame)
        
        # 버튼
        button_frame = ttk.Frame(self.dialog)
        button_frame.pack(side=tk.BOTTOM, fill=tk.X, padx=5, pady=5)
        
        ttk.Button(button_frame, text="확인", command=self.save_and_close).pack(side=tk.RIGHT, padx=(5, 0))
        ttk.Button(button_frame, text="취소", command=self.dialog.destroy).pack(side=tk.RIGHT)
        ttk.Button(button_frame, text="기본값", command=self.reset_defaults).pack(side=tk.LEFT)
    
    def create_detection_settings(self, parent):
        """탐지 설정 GUI"""
        # YOLO 설정
        yolo_frame = ttk.LabelFrame(parent, text="YOLO 설정")
        yolo_frame.pack(fill=tk.X, padx=5, pady=5)
        
        # HuggingFace 설정  
        hf_frame = ttk.LabelFrame(parent, text="HuggingFace 설정")
        hf_frame.pack(fill=tk.X, padx=5, pady=5)
        
        # 설정 구현...
    
    def create_visual_settings(self, parent):
        """시각화 설정 GUI"""
        pass
    
    def create_output_settings(self, parent):
        """출력 설정 GUI"""
        pass
    
    def save_and_close(self):
        """설정 저장 후 닫기"""
        self.config_manager.save_config()
        self.dialog.destroy()
    
    def reset_defaults(self):
        """기본값으로 재설정"""
        pass

def main():
    """GUI 애플리케이션 시작"""
    try:
        root = tk.Tk()
        app = DetectionGUI(root)
        root.mainloop()
    except KeyboardInterrupt:
        print("프로그램이 중단되었습니다.")
    except Exception as e:
        logger.error(f"GUI 실행 중 오류: {e}")
        messagebox.showerror("오류", f"프로그램 실행 중 오류가 발생했습니다:\n{e}")

if __name__ == "__main__":
    main()