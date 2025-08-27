#!/usr/bin/env python3
"""
Basic Enhanced Detection GUI - 기본 라이브러리만 사용
"""
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import cv2
from PIL import Image, ImageTk
import threading
from pathlib import Path
import json

try:
    from basic_enhanced_detector import BasicEnhancedDetector
    DETECTOR_AVAILABLE = True
except ImportError:
    DETECTOR_AVAILABLE = False

class BasicEnhancedGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Basic Enhanced Animal Detection")
        self.root.geometry("1000x700")
        
        # 변수들
        self.current_image_path = None
        self.detector = None
        self.detection_results = []
        self.result_image = None
        
        # GUI 구성
        self.setup_gui()
        
        # 탐지기 초기화
        if DETECTOR_AVAILABLE:
            self.init_detector()
    
    def setup_gui(self):
        """GUI 구성"""
        # 메인 프레임
        main_frame = tk.Frame(self.root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # 제목
        title_label = tk.Label(main_frame, text="Basic Enhanced Animal Detection", 
                              font=("Arial", 16, "bold"))
        title_label.pack(pady=10)
        
        # 컨트롤 프레임
        control_frame = tk.Frame(main_frame)
        control_frame.pack(fill=tk.X, pady=5)
        
        # 버튼들
        self.select_btn = tk.Button(control_frame, text="Select Image", 
                                   command=self.select_image,
                                   bg="#4CAF50", fg="white", font=("Arial", 11))
        self.select_btn.pack(side=tk.LEFT, padx=5)
        
        self.detect_btn = tk.Button(control_frame, text="Detect Animals", 
                                   command=self.start_detection,
                                   bg="#2196F3", fg="white", font=("Arial", 11),
                                   state=tk.DISABLED)
        self.detect_btn.pack(side=tk.LEFT, padx=5)
        
        self.save_btn = tk.Button(control_frame, text="Save Results", 
                                 command=self.save_results,
                                 bg="#FF9800", fg="white", font=("Arial", 11),
                                 state=tk.DISABLED)
        self.save_btn.pack(side=tk.LEFT, padx=5)
        
        self.clear_btn = tk.Button(control_frame, text="Clear", 
                                  command=self.clear_all,
                                  bg="#F44336", fg="white", font=("Arial", 11))
        self.clear_btn.pack(side=tk.LEFT, padx=5)
        
        # 메인 컨텐츠 프레임
        content_frame = tk.Frame(main_frame)
        content_frame.pack(fill=tk.BOTH, expand=True, pady=10)
        
        # 왼쪽: 이미지 영역
        image_frame = tk.LabelFrame(content_frame, text="Image Display")
        image_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 5))
        
        self.image_canvas = tk.Canvas(image_frame, bg="white")
        self.image_canvas.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # 오른쪽: 결과 영역
        results_frame = tk.LabelFrame(content_frame, text="Detection Results", width=300)
        results_frame.pack(side=tk.RIGHT, fill=tk.Y, padx=(5, 0))
        results_frame.pack_propagate(False)
        
        # 통계 영역
        stats_label = tk.Label(results_frame, text="Statistics:", font=("Arial", 10, "bold"))
        stats_label.pack(anchor=tk.W, padx=5, pady=5)
        
        self.stats_text = tk.Text(results_frame, height=8, font=("Courier", 9))
        self.stats_text.pack(fill=tk.X, padx=5, pady=5)
        
        # 상세 결과 영역
        details_label = tk.Label(results_frame, text="Detections:", font=("Arial", 10, "bold"))
        details_label.pack(anchor=tk.W, padx=5, pady=(10, 5))
        
        # 스크롤바가 있는 리스트박스
        listbox_frame = tk.Frame(results_frame)
        listbox_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        scrollbar = tk.Scrollbar(listbox_frame)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        self.details_listbox = tk.Listbox(listbox_frame, yscrollcommand=scrollbar.set,
                                         font=("Courier", 8))
        self.details_listbox.pack(fill=tk.BOTH, expand=True)
        scrollbar.config(command=self.details_listbox.yview)
        
        # 상태바
        self.status_label = tk.Label(main_frame, text="Ready", 
                                    relief=tk.SUNKEN, anchor=tk.W)
        self.status_label.pack(fill=tk.X, pady=(10, 0))
        
        # 초기 상태 메시지
        if not DETECTOR_AVAILABLE:
            self.update_status("ERROR: BasicEnhancedDetector not available!")
            messagebox.showerror("Error", "BasicEnhancedDetector not found!\nMake sure basic_enhanced_detector.py is in the same directory.")
    
    def init_detector(self):
        """탐지기 초기화"""
        try:
            self.detector = BasicEnhancedDetector()
            self.update_status("Detector initialized successfully")
        except Exception as e:
            self.update_status(f"Detector initialization failed: {e}")
            messagebox.showerror("Error", f"Failed to initialize detector:\n{e}")
    
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
            self.display_image(file_path)
            self.detect_btn.config(state=tk.NORMAL if DETECTOR_AVAILABLE else tk.DISABLED)
            self.clear_results()
            self.update_status(f"Image loaded: {Path(file_path).name}")
    
    def display_image(self, image_path):
        """이미지 표시"""
        try:
            # PIL로 이미지 로드
            image = Image.open(image_path)
            
            # 캔버스 크기에 맞게 리사이즈
            canvas_width = self.image_canvas.winfo_width()
            canvas_height = self.image_canvas.winfo_height()
            
            if canvas_width > 1 and canvas_height > 1:
                image.thumbnail((canvas_width-10, canvas_height-10), Image.Resampling.LANCZOS)
            
            # PhotoImage 생성
            photo = ImageTk.PhotoImage(image)
            
            # 캔버스에 표시
            self.image_canvas.delete("all")
            self.image_canvas.create_image(canvas_width//2, canvas_height//2, 
                                         anchor=tk.CENTER, image=photo)
            self.image_canvas.image = photo  # 참조 유지
            
        except Exception as e:
            self.update_status(f"Error displaying image: {e}")
    
    def start_detection(self):
        """탐지 시작"""
        if not self.current_image_path or not self.detector:
            return
        
        # UI 비활성화
        self.detect_btn.config(state=tk.DISABLED)
        self.update_status("Detection in progress...")
        
        # 백그라운드에서 탐지 실행
        thread = threading.Thread(target=self.run_detection, daemon=True)
        thread.start()
    
    def run_detection(self):
        """탐지 실행 (백그라운드)"""
        try:
            # 탐지 수행
            final_image, detections, method_images = self.detector.ensemble_detection(
                self.current_image_path
            )
            
            # 결과 저장
            self.detection_results = detections
            self.result_image = final_image
            
            # UI 업데이트 (메인 스레드에서)
            self.root.after(0, self.update_detection_results)
            
        except Exception as e:
            self.root.after(0, lambda: self.update_status(f"Detection failed: {e}"))
        finally:
            self.root.after(0, lambda: self.detect_btn.config(state=tk.NORMAL))
    
    def update_detection_results(self):
        """탐지 결과 UI 업데이트"""
        if not self.detection_results:
            self.update_status("No detections found")
            return
        
        # 결과 이미지 표시
        if self.result_image is not None:
            self.display_cv2_image(self.result_image)
        
        # 통계 업데이트
        self.update_statistics()
        
        # 상세 결과 업데이트
        self.update_details()
        
        # 저장 버튼 활성화
        self.save_btn.config(state=tk.NORMAL)
        
        self.update_status(f"Detection complete: {len(self.detection_results)} objects found")
    
    def display_cv2_image(self, cv2_image):
        """OpenCV 이미지를 캔버스에 표시"""
        try:
            # OpenCV BGR -> RGB 변환
            rgb_image = cv2.cvtColor(cv2_image, cv2.COLOR_BGR2RGB)
            
            # PIL Image로 변환
            pil_image = Image.fromarray(rgb_image)
            
            # 캔버스 크기에 맞게 리사이즈
            canvas_width = self.image_canvas.winfo_width()
            canvas_height = self.image_canvas.winfo_height()
            
            if canvas_width > 1 and canvas_height > 1:
                pil_image.thumbnail((canvas_width-10, canvas_height-10), Image.Resampling.LANCZOS)
            
            # PhotoImage 생성 및 표시
            photo = ImageTk.PhotoImage(pil_image)
            
            self.image_canvas.delete("all")
            self.image_canvas.create_image(canvas_width//2, canvas_height//2, 
                                         anchor=tk.CENTER, image=photo)
            self.image_canvas.image = photo
            
        except Exception as e:
            self.update_status(f"Error displaying result: {e}")
    
    def update_statistics(self):
        """통계 정보 업데이트"""
        self.stats_text.delete(1.0, tk.END)
        
        if not self.detection_results:
            self.stats_text.insert(tk.END, "No detections found")
            return
        
        # 통계 계산
        total_detections = len(self.detection_results)
        confidences = [det['confidence'] for det in self.detection_results]
        avg_confidence = sum(confidences) / len(confidences)
        max_confidence = max(confidences)
        min_confidence = min(confidences)
        
        # 방법별 카운트
        method_counts = {}
        for det in self.detection_results:
            method = det['method'].split('_')[0]  # 첫 번째 단어만
            method_counts[method] = method_counts.get(method, 0) + 1
        
        # 통계 텍스트
        stats = f"""Total Detections: {total_detections}

Confidence Stats:
  Average: {avg_confidence:.3f}
  Maximum: {max_confidence:.3f}
  Minimum: {min_confidence:.3f}

Detection Methods:
"""
        for method, count in method_counts.items():
            stats += f"  {method}: {count}\n"
        
        self.stats_text.insert(tk.END, stats)
    
    def update_details(self):
        """상세 결과 업데이트"""
        self.details_listbox.delete(0, tk.END)
        
        for i, det in enumerate(self.detection_results, 1):
            x, y, w, h = det['bbox']
            method = det['method'][:15]  # 길이 제한
            confidence = det['confidence']
            
            line = f"#{i:2d} {method:<15} {confidence:.3f}"
            self.details_listbox.insert(tk.END, line)
            
            # 좌표 정보
            coord_line = f"     Pos: ({x},{y}) Size: {w}x{h}"
            self.details_listbox.insert(tk.END, coord_line)
    
    def save_results(self):
        """결과 저장"""
        if not self.detection_results or self.result_image is None:
            return
        
        # 저장 파일 선택
        file_path = filedialog.asksaveasfilename(
            title="Save Detection Results",
            defaultextension=".jpg",
            filetypes=[
                ("JPEG files", "*.jpg"),
                ("PNG files", "*.png"),
                ("All files", "*.*")
            ]
        )
        
        if file_path:
            try:
                # 이미지 저장
                cv2.imwrite(file_path, self.result_image)
                
                # JSON 정보 저장
                json_path = Path(file_path).with_suffix('.json')
                with open(json_path, 'w') as f:
                    json.dump({
                        'source_image': self.current_image_path,
                        'total_detections': len(self.detection_results),
                        'detections': [
                            {
                                'method': det['method'],
                                'bbox': [int(x) for x in det['bbox']],
                                'confidence': float(det['confidence'])
                            }
                            for det in self.detection_results
                        ]
                    }, f, indent=2)
                
                self.update_status(f"Results saved: {file_path}")
                messagebox.showinfo("Success", f"Results saved to:\n{file_path}")
                
            except Exception as e:
                self.update_status(f"Save failed: {e}")
                messagebox.showerror("Error", f"Failed to save:\n{e}")
    
    def clear_all(self):
        """모든 내용 초기화"""
        self.current_image_path = None
        self.detection_results = []
        self.result_image = None
        
        self.image_canvas.delete("all")
        self.stats_text.delete(1.0, tk.END)
        self.details_listbox.delete(0, tk.END)
        
        self.detect_btn.config(state=tk.DISABLED)
        self.save_btn.config(state=tk.DISABLED)
        
        self.update_status("Cleared")
    
    def clear_results(self):
        """결과만 초기화"""
        self.detection_results = []
        self.result_image = None
        
        self.stats_text.delete(1.0, tk.END)
        self.details_listbox.delete(0, tk.END)
        self.save_btn.config(state=tk.DISABLED)
    
    def update_status(self, message):
        """상태 메시지 업데이트"""
        self.status_label.config(text=message)


def main():
    """메인 함수"""
    root = tk.Tk()
    app = BasicEnhancedGUI(root)
    root.mainloop()


if __name__ == "__main__":
    print("Basic Enhanced Animal Detection GUI")
    print("="*40)
    
    if not DETECTOR_AVAILABLE:
        print("WARNING: BasicEnhancedDetector not available!")
        print("Make sure basic_enhanced_detector.py is in the same directory")
    
    main()