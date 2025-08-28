#!/usr/bin/env python3
"""
Enhanced Animal Detection GUI
고성능 동물 얼굴 탐지 시스템 GUI
"""
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import cv2
import numpy as np
from PIL import Image, ImageTk
import threading
from pathlib import Path
import json
from datetime import datetime

# Enhanced detector import
try:
    from enhanced_animal_detector import EnhancedAnimalDetector
    ENHANCED_AVAILABLE = True
except ImportError:
    ENHANCED_AVAILABLE = False

class EnhancedDetectionGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Enhanced Animal Detection System v2.0")
        self.root.geometry("1200x800")
        self.root.configure(bg='#f0f0f0')
        
        # 스타일 설정
        self.setup_styles()
        
        # 변수들
        self.current_image_path = None
        self.detector = None
        self.detection_results = []
        self.processed_images = {}
        
        # GUI 구성
        self.setup_gui()
        
        # 디텍터 초기화 (백그라운드)
        self.init_detector_async()
    
    def setup_styles(self):
        """GUI 스타일 설정"""
        style = ttk.Style()
        style.theme_use('clam')
        
        # 커스텀 색상
        self.colors = {
            'primary': '#2196F3',
            'success': '#4CAF50',
            'warning': '#FF9800',
            'danger': '#F44336',
            'dark': '#212529',
            'light': '#f8f9fa'
        }
    
    def setup_gui(self):
        """GUI 레이아웃 구성"""
        # 메인 컨테이너
        main_container = tk.Frame(self.root, bg='#f0f0f0')
        main_container.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # 상단 헤더
        self.create_header(main_container)
        
        # 중앙 컨텐츠 영역
        content_frame = tk.Frame(main_container, bg='white', relief=tk.RAISED, bd=1)
        content_frame.pack(fill=tk.BOTH, expand=True, pady=10)
        
        # 좌측: 컨트롤 패널
        self.create_control_panel(content_frame)
        
        # 중앙: 이미지 디스플레이
        self.create_image_display(content_frame)
        
        # 우측: 결과 패널
        self.create_results_panel(content_frame)
        
        # 하단 상태바
        self.create_status_bar()
    
    def create_header(self, parent):
        """헤더 생성"""
        header_frame = tk.Frame(parent, bg='#2196F3', height=80)
        header_frame.pack(fill=tk.X, pady=(0, 10))
        header_frame.pack_propagate(False)
        
        # 타이틀
        title = tk.Label(header_frame, text="🔍 Enhanced Animal Detection System", 
                        font=("Arial", 24, "bold"), fg='white', bg='#2196F3')
        title.pack(pady=20)
        
        # 서브타이틀
        subtitle = tk.Label(header_frame, text="YOLOv8 + DNN + Advanced CV Techniques", 
                           font=("Arial", 12), fg='#E3F2FD', bg='#2196F3')
        subtitle.pack()
    
    def create_control_panel(self, parent):
        """좌측 컨트롤 패널"""
        control_frame = tk.Frame(parent, bg='white', width=250)
        control_frame.pack(side=tk.LEFT, fill=tk.Y, padx=10, pady=10)
        control_frame.pack_propagate(False)
        
        # 제목
        tk.Label(control_frame, text="Control Panel", 
                font=("Arial", 14, "bold"), bg='white').pack(pady=(0, 15))
        
        # 이미지 선택 섹션
        self.create_file_section(control_frame)
        
        # 탐지 옵션 섹션
        self.create_options_section(control_frame)
        
        # 액션 버튼 섹션
        self.create_action_buttons(control_frame)
    
    def create_file_section(self, parent):
        """파일 선택 섹션"""
        section = tk.LabelFrame(parent, text="Image Selection", bg='white', 
                               font=("Arial", 10, "bold"))
        section.pack(fill=tk.X, pady=10, padx=5)
        
        # 파일 선택 버튼
        self.select_btn = tk.Button(section, text="📁 Select Image", 
                                   command=self.select_image,
                                   bg=self.colors['primary'], fg='white',
                                   font=("Arial", 10, "bold"),
                                   cursor='hand2', relief=tk.FLAT)
        self.select_btn.pack(pady=10, padx=10, fill=tk.X)
        
        # 선택된 파일 표시
        self.file_label = tk.Label(section, text="No file selected", 
                                  bg='white', wraplength=200)
        self.file_label.pack(pady=5, padx=10)
    
    def create_options_section(self, parent):
        """탐지 옵션 섹션"""
        section = tk.LabelFrame(parent, text="Detection Options", bg='white',
                               font=("Arial", 10, "bold"))
        section.pack(fill=tk.X, pady=10, padx=5)
        
        # 탐지 방법 체크박스
        self.detection_methods = {}
        methods = [
            ("YOLOv8", "yolo", True),
            ("DNN Face", "dnn", True),
            ("Cascade", "cascade", True),
            ("Enhanced", "enhanced", True),
            ("Landmarks", "landmarks", False)
        ]
        
        for method, key, default in methods:
            var = tk.BooleanVar(value=default)
            self.detection_methods[key] = var
            cb = tk.Checkbutton(section, text=method, variable=var,
                               bg='white', font=("Arial", 9))
            cb.pack(anchor=tk.W, padx=10, pady=2)
        
        # 신뢰도 임계값
        tk.Label(section, text="Confidence Threshold:", bg='white',
                font=("Arial", 9)).pack(padx=10, pady=(10, 0))
        
        self.confidence_var = tk.DoubleVar(value=0.5)
        self.confidence_scale = tk.Scale(section, from_=0.1, to=0.9,
                                        resolution=0.1, orient=tk.HORIZONTAL,
                                        variable=self.confidence_var,
                                        bg='white', length=200)
        self.confidence_scale.pack(padx=10, pady=5)
    
    def create_action_buttons(self, parent):
        """액션 버튼 섹션"""
        section = tk.Frame(parent, bg='white')
        section.pack(fill=tk.X, pady=20, padx=5)
        
        # 탐지 시작 버튼
        self.detect_btn = tk.Button(section, text="🎯 Start Detection",
                                   command=self.start_detection,
                                   bg=self.colors['success'], fg='white',
                                   font=("Arial", 11, "bold"),
                                   cursor='hand2', relief=tk.FLAT,
                                   state=tk.DISABLED)
        self.detect_btn.pack(pady=5, padx=10, fill=tk.X)
        
        # 결과 저장 버튼
        self.save_btn = tk.Button(section, text="💾 Save Results",
                                 command=self.save_results,
                                 bg=self.colors['warning'], fg='white',
                                 font=("Arial", 11, "bold"),
                                 cursor='hand2', relief=tk.FLAT,
                                 state=tk.DISABLED)
        self.save_btn.pack(pady=5, padx=10, fill=tk.X)
        
        # 초기화 버튼
        self.clear_btn = tk.Button(section, text="🔄 Clear All",
                                  command=self.clear_all,
                                  bg=self.colors['danger'], fg='white',
                                  font=("Arial", 11, "bold"),
                                  cursor='hand2', relief=tk.FLAT)
        self.clear_btn.pack(pady=5, padx=10, fill=tk.X)
    
    def create_image_display(self, parent):
        """중앙 이미지 디스플레이"""
        display_frame = tk.Frame(parent, bg='#fafafa')
        display_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # 탭 위젯
        self.image_tabs = ttk.Notebook(display_frame)
        self.image_tabs.pack(fill=tk.BOTH, expand=True)
        
        # 원본 이미지 탭
        self.original_tab = tk.Frame(self.image_tabs, bg='#fafafa')
        self.image_tabs.add(self.original_tab, text="Original")
        
        self.original_canvas = tk.Canvas(self.original_tab, bg='#fafafa')
        self.original_canvas.pack(fill=tk.BOTH, expand=True)
        
        # 결과 이미지 탭
        self.result_tab = tk.Frame(self.image_tabs, bg='#fafafa')
        self.image_tabs.add(self.result_tab, text="Detection Result")
        
        self.result_canvas = tk.Canvas(self.result_tab, bg='#fafafa')
        self.result_canvas.pack(fill=tk.BOTH, expand=True)
    
    def create_results_panel(self, parent):
        """우측 결과 패널"""
        results_frame = tk.Frame(parent, bg='white', width=300)
        results_frame.pack(side=tk.RIGHT, fill=tk.Y, padx=10, pady=10)
        results_frame.pack_propagate(False)
        
        # 제목
        tk.Label(results_frame, text="Detection Results", 
                font=("Arial", 14, "bold"), bg='white').pack(pady=(0, 15))
        
        # 통계 섹션
        self.create_stats_section(results_frame)
        
        # 상세 결과 섹션
        self.create_details_section(results_frame)
    
    def create_stats_section(self, parent):
        """통계 섹션"""
        section = tk.LabelFrame(parent, text="Statistics", bg='white',
                               font=("Arial", 10, "bold"))
        section.pack(fill=tk.X, pady=10, padx=5)
        
        self.stats_text = tk.Text(section, height=8, width=35,
                                 bg='#f5f5f5', font=("Courier", 9))
        self.stats_text.pack(pady=5, padx=5)
        
        # 초기 텍스트
        self.stats_text.insert(tk.END, "No detection performed yet.\n")
        self.stats_text.config(state=tk.DISABLED)
    
    def create_details_section(self, parent):
        """상세 결과 섹션"""
        section = tk.LabelFrame(parent, text="Detailed Results", bg='white',
                               font=("Arial", 10, "bold"))
        section.pack(fill=tk.BOTH, expand=True, pady=10, padx=5)
        
        # 스크롤바가 있는 리스트박스
        scrollbar = tk.Scrollbar(section)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        self.details_listbox = tk.Listbox(section, yscrollcommand=scrollbar.set,
                                         font=("Courier", 9), bg='#f5f5f5')
        self.details_listbox.pack(fill=tk.BOTH, expand=True, pady=5, padx=5)
        
        scrollbar.config(command=self.details_listbox.yview)
    
    def create_status_bar(self):
        """하단 상태바"""
        self.status_frame = tk.Frame(self.root, bg='#e0e0e0', height=30)
        self.status_frame.pack(fill=tk.X, side=tk.BOTTOM)
        self.status_frame.pack_propagate(False)
        
        self.status_label = tk.Label(self.status_frame, text="Ready", 
                                    bg='#e0e0e0', anchor=tk.W,
                                    font=("Arial", 9))
        self.status_label.pack(side=tk.LEFT, padx=10, fill=tk.X, expand=True)
        
        # 진행 상태 표시
        self.progress_label = tk.Label(self.status_frame, text="", 
                                      bg='#e0e0e0', anchor=tk.E,
                                      font=("Arial", 9))
        self.progress_label.pack(side=tk.RIGHT, padx=10)
    
    def init_detector_async(self):
        """비동기로 디텍터 초기화"""
        def init():
            self.update_status("Initializing detection models...")
            
            if ENHANCED_AVAILABLE:
                try:
                    self.detector = EnhancedAnimalDetector()
                    self.update_status("✓ Enhanced detector ready", success=True)
                    self.root.after(0, lambda: self.detect_btn.config(state=tk.NORMAL))
                except Exception as e:
                    self.update_status(f"Failed to initialize detector: {str(e)}", error=True)
            else:
                self.update_status("Enhanced detector not available. Please install required packages.", error=True)
        
        thread = threading.Thread(target=init, daemon=True)
        thread.start()
    
    def select_image(self):
        """이미지 선택"""
        file_path = filedialog.askopenfilename(
            title="Select Animal Image",
            filetypes=[
                ("Image files", "*.jpg *.jpeg *.png *.bmp *.gif"),
                ("All files", "*.*")
            ]
        )
        
        if file_path:
            self.current_image_path = file_path
            self.file_label.config(text=Path(file_path).name)
            self.display_image(file_path, self.original_canvas)
            self.detect_btn.config(state=tk.NORMAL)
            self.clear_results()
            self.update_status(f"Image loaded: {Path(file_path).name}")
    
    def display_image(self, image_path, canvas, cv2_image=None):
        """이미지 표시"""
        try:
            if cv2_image is not None:
                # OpenCV 이미지를 PIL로 변환
                image = Image.fromarray(cv2.cvtColor(cv2_image, cv2.COLOR_BGR2RGB))
            else:
                # 파일에서 이미지 로드
                image = Image.open(image_path)
            
            # 캔버스 크기에 맞게 리사이즈
            canvas.update()
            canvas_width = canvas.winfo_width()
            canvas_height = canvas.winfo_height()
            
            # 비율 유지하며 리사이즈
            image.thumbnail((canvas_width, canvas_height), Image.Resampling.LANCZOS)
            
            # PhotoImage 생성
            photo = ImageTk.PhotoImage(image)
            
            # 캔버스에 표시
            canvas.delete("all")
            canvas.create_image(canvas_width//2, canvas_height//2, 
                              anchor=tk.CENTER, image=photo)
            canvas.image = photo  # 참조 유지
            
        except Exception as e:
            self.update_status(f"Error displaying image: {str(e)}", error=True)
    
    def start_detection(self):
        """탐지 시작"""
        if not self.current_image_path or not self.detector:
            return
        
        # 버튼 비활성화
        self.detect_btn.config(state=tk.DISABLED)
        self.update_status("Detection in progress...")
        
        # 백그라운드에서 탐지 실행
        thread = threading.Thread(target=self.run_detection, daemon=True)
        thread.start()
    
    def run_detection(self):
        """탐지 실행"""
        try:
            # 선택된 방법들 확인
            methods = {k: v.get() for k, v in self.detection_methods.items()}
            confidence = self.confidence_var.get()
            
            # 앙상블 탐지 수행
            self.update_status("Running ensemble detection...")
            final_image, detections, method_images = self.detector.ensemble_detection(
                self.current_image_path
            )
            
            # 결과 저장
            self.detection_results = detections
            self.processed_images = {name: img for name, img in method_images}
            self.processed_images['final'] = final_image
            
            # GUI 업데이트 (메인 스레드에서)
            self.root.after(0, self.update_results)
            
        except Exception as e:
            self.root.after(0, lambda: self.update_status(f"Detection failed: {str(e)}", error=True))
        finally:
            self.root.after(0, lambda: self.detect_btn.config(state=tk.NORMAL))
    
    def update_results(self):
        """결과 업데이트"""
        if not self.detection_results:
            self.update_status("No detections found", warning=True)
            return
        
        # 결과 이미지 표시
        if 'final' in self.processed_images:
            self.display_image(None, self.result_canvas, 
                             cv2_image=self.processed_images['final'])
            self.image_tabs.select(self.result_tab)
        
        # 통계 업데이트
        self.update_stats()
        
        # 상세 결과 업데이트
        self.update_details()
        
        # 저장 버튼 활성화
        self.save_btn.config(state=tk.NORMAL)
        
        self.update_status(f"Detection complete: {len(self.detection_results)} objects found", 
                          success=True)
    
    def update_stats(self):
        """통계 업데이트"""
        self.stats_text.config(state=tk.NORMAL)
        self.stats_text.delete(1.0, tk.END)
        
        stats = f"""Detection Summary
{'='*30}
Total Detections: {len(self.detection_results)}

Confidence Stats:
  Average: {np.mean([d['confidence'] for d in self.detection_results]):.3f}
  Max: {max(d['confidence'] for d in self.detection_results):.3f}
  Min: {min(d['confidence'] for d in self.detection_results):.3f}

Methods Used:
"""
        
        # 방법별 카운트
        method_counts = {}
        for det in self.detection_results:
            method = det.get('method', 'Unknown')
            method_counts[method] = method_counts.get(method, 0) + 1
        
        for method, count in method_counts.items():
            stats += f"  {method}: {count}\n"
        
        self.stats_text.insert(tk.END, stats)
        self.stats_text.config(state=tk.DISABLED)
    
    def update_details(self):
        """상세 결과 업데이트"""
        self.details_listbox.delete(0, tk.END)
        
        for i, det in enumerate(self.detection_results, 1):
            x, y, w, h = det['bbox']
            line = f"#{i:02d} [{det.get('method', 'Unknown')[:10]:>10}] "
            line += f"Conf:{det['confidence']:.2f} "
            line += f"Box:({x},{y},{w}x{h})"
            
            if 'class' in det:
                line += f" Class:{det['class']}"
            
            self.details_listbox.insert(tk.END, line)
    
    def save_results(self):
        """결과 저장"""
        if not self.detection_results:
            return
        
        # 저장 디렉토리 선택
        save_dir = filedialog.askdirectory(title="Select Save Directory")
        if not save_dir:
            return
        
        save_dir = Path(save_dir)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        try:
            # 이미지 저장
            for name, image in self.processed_images.items():
                filename = save_dir / f"detection_{name}_{timestamp}.jpg"
                cv2.imwrite(str(filename), image)
            
            # JSON 결과 저장
            json_file = save_dir / f"detection_results_{timestamp}.json"
            with open(json_file, 'w') as f:
                json.dump({
                    'timestamp': timestamp,
                    'source_image': str(self.current_image_path),
                    'detections': [
                        {
                            'id': i,
                            'method': det.get('method', 'Unknown'),
                            'bbox': det['bbox'],
                            'confidence': float(det['confidence']),
                            'class': det.get('class', 'unknown')
                        }
                        for i, det in enumerate(self.detection_results)
                    ]
                }, f, indent=2)
            
            self.update_status(f"Results saved to {save_dir}", success=True)
            messagebox.showinfo("Success", f"Results saved successfully to:\n{save_dir}")
            
        except Exception as e:
            self.update_status(f"Failed to save results: {str(e)}", error=True)
            messagebox.showerror("Error", f"Failed to save results:\n{str(e)}")
    
    def clear_all(self):
        """모두 지우기"""
        self.current_image_path = None
        self.detection_results = []
        self.processed_images = {}
        
        self.file_label.config(text="No file selected")
        self.original_canvas.delete("all")
        self.result_canvas.delete("all")
        
        self.clear_results()
        self.detect_btn.config(state=tk.DISABLED)
        self.save_btn.config(state=tk.DISABLED)
        
        self.update_status("Cleared all data")
    
    def clear_results(self):
        """결과만 지우기"""
        self.stats_text.config(state=tk.NORMAL)
        self.stats_text.delete(1.0, tk.END)
        self.stats_text.insert(tk.END, "No detection performed yet.\n")
        self.stats_text.config(state=tk.DISABLED)
        
        self.details_listbox.delete(0, tk.END)
        self.result_canvas.delete("all")
    
    def update_status(self, message, success=False, warning=False, error=False):
        """상태 메시지 업데이트"""
        self.status_label.config(text=message)
        
        if success:
            self.status_label.config(fg='green')
        elif warning:
            self.status_label.config(fg='orange')
        elif error:
            self.status_label.config(fg='red')
        else:
            self.status_label.config(fg='black')
        
        # 3초 후 기본 상태로 복귀
        if success or warning or error:
            self.root.after(3000, lambda: self.status_label.config(fg='black'))


def main():
    """메인 함수"""
    root = tk.Tk()
    app = EnhancedDetectionGUI(root)
    root.mainloop()


if __name__ == "__main__":
    print("Enhanced Animal Detection GUI v2.0")
    print("="*50)
    
    if not ENHANCED_AVAILABLE:
        print("Warning: Enhanced detector module not found!")
        print("Please ensure enhanced_animal_detector.py is in the same directory.")
    
    main()