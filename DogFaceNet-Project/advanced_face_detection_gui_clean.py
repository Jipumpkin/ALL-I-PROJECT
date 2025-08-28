#!/usr/bin/env python3
"""
고급 동물 얼굴 탐지 GUI
실시간 파라미터 조정 및 시각적 개선 기능 포함
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import cv2
import numpy as np
from PIL import Image, ImageTk
from pathlib import Path
import threading
import time

class AdvancedFaceDetectionGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("고급 동물 얼굴 탐지 시스템")
        self.root.geometry("1400x900")
        self.root.configure(bg='#f0f0f0')
        
        # 변수 초기화
        self.face_detector = None
        self.original_image = None
        self.current_result = None
        self._preview_active = False
        
        # GUI 컴포넌트 생성
        self.create_variables()
        self.create_widgets()
        self.load_detector()
    
    def create_variables(self):
        """GUI 변수들 초기화"""
        self.detection_method = tk.StringVar(value="haar")
        self.status_var = tk.StringVar(value="시스템 로딩 중...")
        
        # Haar Cascade 파라미터들
        self.detection_params = {
            'scaleFactor': tk.DoubleVar(value=1.05),
            'minNeighbors': tk.IntVar(value=3),
            'minSize': tk.IntVar(value=20),
            'maxSize': tk.IntVar(value=500)
        }
    
    def create_widgets(self):
        """GUI 위젯들 생성"""
        # 메인 프레임
        main_frame = ttk.Frame(self.root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # 상단 컨트롤 패널
        self.create_control_panel(main_frame)
        
        # 중앙 이미지 표시 영역
        self.create_image_display(main_frame)
        
        # 하단 정보 패널
        self.create_info_panel(main_frame)
        
        # 상태바
        self.create_status_bar(main_frame)
    
    def create_control_panel(self, parent):
        """상단 컨트롤 패널 생성"""
        control_frame = ttk.LabelFrame(parent, text="컨트롤 패널", padding="10")
        control_frame.pack(fill=tk.X, pady=(0, 10))
        
        # 파일 선택 영역
        file_frame = ttk.Frame(control_frame)
        file_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Button(file_frame, text="이미지 선택", 
                  command=self.select_image, width=15).pack(side=tk.LEFT, padx=(0, 10))
        
        self.file_label = ttk.Label(file_frame, text="선택된 파일 없음", 
                                   foreground='gray')
        self.file_label.pack(side=tk.LEFT, padx=(10, 0))
        
        # 탐지 방법 선택
        method_frame = ttk.Frame(control_frame)
        method_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Label(method_frame, text="탐지 방법:").pack(side=tk.LEFT, padx=(0, 10))
        
        methods = [("Haar Cascade", "haar"), ("윤곽선 기반", "contour"), ("특징점 탐지", "features")]
        for text, value in methods:
            ttk.Radiobutton(method_frame, text=text, variable=self.detection_method,
                           value=value, command=self.on_method_change).pack(side=tk.LEFT, padx=(0, 15))
        
        # 파라미터 조정 영역
        self.create_parameter_controls(control_frame)
        
        # 실행 버튼들
        button_frame = ttk.Frame(control_frame)
        button_frame.pack(fill=tk.X, pady=(10, 0))
        
        ttk.Button(button_frame, text="실시간 미리보기", 
                  command=self.real_time_preview).pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(button_frame, text="최종 탐지", 
                  command=self.final_detection).pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(button_frame, text="결과 저장", 
                  command=self.save_result).pack(side=tk.LEFT, padx=(0, 10))
    
    def create_parameter_controls(self, parent):
        """파라미터 조정 컨트롤 생성"""
        self.params_frame = ttk.LabelFrame(parent, text="Haar Cascade 파라미터", padding="10")
        self.params_frame.pack(fill=tk.X, pady=(10, 0))
        
        # Scale Factor
        scale_frame = ttk.Frame(self.params_frame)
        scale_frame.pack(fill=tk.X, pady=2)
        ttk.Label(scale_frame, text="Scale Factor:", width=15).pack(side=tk.LEFT)
        ttk.Scale(scale_frame, from_=1.01, to=1.3, orient=tk.HORIZONTAL,
                 variable=self.detection_params['scaleFactor'],
                 command=lambda x: self.on_param_change()).pack(side=tk.LEFT, fill=tk.X, expand=True, padx=10)
        ttk.Label(scale_frame, textvariable=self.detection_params['scaleFactor']).pack(side=tk.RIGHT)
        
        # Min Neighbors
        neighbors_frame = ttk.Frame(self.params_frame)
        neighbors_frame.pack(fill=tk.X, pady=2)
        ttk.Label(neighbors_frame, text="Min Neighbors:", width=15).pack(side=tk.LEFT)
        ttk.Scale(neighbors_frame, from_=1, to=10, orient=tk.HORIZONTAL,
                 variable=self.detection_params['minNeighbors'],
                 command=lambda x: self.on_param_change()).pack(side=tk.LEFT, fill=tk.X, expand=True, padx=10)
        ttk.Label(neighbors_frame, textvariable=self.detection_params['minNeighbors']).pack(side=tk.RIGHT)
        
        # Min Size
        minsize_frame = ttk.Frame(self.params_frame)
        minsize_frame.pack(fill=tk.X, pady=2)
        ttk.Label(minsize_frame, text="Min Size:", width=15).pack(side=tk.LEFT)
        ttk.Scale(minsize_frame, from_=10, to=100, orient=tk.HORIZONTAL,
                 variable=self.detection_params['minSize'],
                 command=lambda x: self.on_param_change()).pack(side=tk.LEFT, fill=tk.X, expand=True, padx=10)
        ttk.Label(minsize_frame, textvariable=self.detection_params['minSize']).pack(side=tk.RIGHT)
        
        # Max Size
        maxsize_frame = ttk.Frame(self.params_frame)
        maxsize_frame.pack(fill=tk.X, pady=2)
        ttk.Label(maxsize_frame, text="Max Size:", width=15).pack(side=tk.LEFT)
        ttk.Scale(maxsize_frame, from_=100, to=1000, orient=tk.HORIZONTAL,
                 variable=self.detection_params['maxSize'],
                 command=lambda x: self.on_param_change()).pack(side=tk.LEFT, fill=tk.X, expand=True, padx=10)
        ttk.Label(maxsize_frame, textvariable=self.detection_params['maxSize']).pack(side=tk.RIGHT)
    
    def create_image_display(self, parent):
        """이미지 표시 영역 생성"""
        image_frame = ttk.Frame(parent)
        image_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 10))
        
        # 원본 이미지 프레임
        original_frame = ttk.LabelFrame(image_frame, text="원본 이미지", padding="5")
        original_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 5))
        
        self.original_canvas = tk.Canvas(original_frame, bg='white', relief=tk.SUNKEN, borderwidth=2)
        self.original_canvas.pack(fill=tk.BOTH, expand=True)
        
        # 결과 이미지 프레임
        result_frame = ttk.LabelFrame(image_frame, text="탐지 결과", padding="5")
        result_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=(5, 0))
        
        self.result_canvas = tk.Canvas(result_frame, bg='white', relief=tk.SUNKEN, borderwidth=2)
        self.result_canvas.pack(fill=tk.BOTH, expand=True)
        
        # 초기 텍스트
        self.original_canvas.create_text(200, 150, text="이미지를 선택해주세요", 
                                        font=("Arial", 14), fill="#7f8c8d")
        self.result_canvas.create_text(200, 150, text="탐지 결과가 여기 표시됩니다", 
                                      font=("Arial", 14), fill="#7f8c8d")
    
    def create_info_panel(self, parent):
        """정보 패널 생성"""
        info_frame = ttk.LabelFrame(parent, text="탐지 정보", padding="10")
        info_frame.pack(fill=tk.X, pady=(0, 10))
        
        self.info_text = tk.Text(info_frame, height=8, wrap=tk.WORD)
        scrollbar = ttk.Scrollbar(info_frame, orient=tk.VERTICAL, command=self.info_text.yview)
        self.info_text.configure(yscrollcommand=scrollbar.set)
        
        self.info_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
    
    def create_status_bar(self, parent):
        """상태바 생성"""
        status_frame = ttk.Frame(parent)
        status_frame.pack(fill=tk.X)
        
        ttk.Label(status_frame, text="상태:").pack(side=tk.LEFT)
        ttk.Label(status_frame, textvariable=self.status_var).pack(side=tk.LEFT, padx=(10, 0))
    
    def load_detector(self):
        """얼굴 탐지기 로딩"""
        def load():
            try:
                from animal_face_detector import AnimalFaceDetector
                self.face_detector = AnimalFaceDetector()
                self.status_var.set("시스템 준비 완료")
            except Exception as e:
                self.status_var.set(f"로딩 실패: {e}")
        
        thread = threading.Thread(target=load, daemon=True)
        thread.start()
    
    def select_image(self):
        """이미지 선택"""
        file_path = filedialog.askopenfilename(
            title="동물 이미지 선택",
            filetypes=[("이미지 파일", "*.jpg *.jpeg *.png *.bmp"), ("모든 파일", "*.*")]
        )
        
        if file_path:
            self.load_image(file_path)
    
    def load_image(self, file_path):
        """이미지 로딩 및 표시"""
        try:
            self.original_image = cv2.imread(file_path)
            if self.original_image is None:
                raise Exception("이미지 로드 실패")
            
            self.file_label.config(text=Path(file_path).name)
            self.display_original_image()
            
            self.info_text.delete(1.0, tk.END)
            self.info_text.insert(tk.END, f"파일: {Path(file_path).name}\n")
            self.info_text.insert(tk.END, f"크기: {self.original_image.shape[1]}x{self.original_image.shape[0]}\n\n")
            
            self.status_var.set("이미지 로드 완료")
            
        except Exception as e:
            messagebox.showerror("오류", f"이미지 로드 실패: {e}")
            self.status_var.set(f"이미지 로드 실패: {e}")
    
    def display_original_image(self):
        """원본 이미지 표시"""
        if self.original_image is None:
            return
        
        # 캔버스 크기에 맞게 이미지 크기 조정
        canvas_width = self.original_canvas.winfo_width()
        canvas_height = self.original_canvas.winfo_height()
        
        if canvas_width <= 1 or canvas_height <= 1:
            self.root.after(100, self.display_original_image)
            return
        
        # 이미지 크기 조정
        image_rgb = cv2.cvtColor(self.original_image, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(image_rgb)
        
        # 비율 유지하면서 크기 조정
        pil_image.thumbnail((canvas_width-20, canvas_height-20), Image.Resampling.LANCZOS)
        
        self.original_photo = ImageTk.PhotoImage(pil_image)
        
        self.original_canvas.delete("all")
        self.original_canvas.create_image(canvas_width//2, canvas_height//2, 
                                         image=self.original_photo)
    
    def display_result_image(self, result_image):
        """결과 이미지 표시"""
        if result_image is None:
            return
        
        # 캔버스 크기에 맞게 이미지 크기 조정
        canvas_width = self.result_canvas.winfo_width()
        canvas_height = self.result_canvas.winfo_height()
        
        if canvas_width <= 1 or canvas_height <= 1:
            self.root.after(100, lambda: self.display_result_image(result_image))
            return
        
        # BGR을 RGB로 변환
        if len(result_image.shape) == 3:
            image_rgb = cv2.cvtColor(result_image, cv2.COLOR_BGR2RGB)
        else:
            image_rgb = result_image
        
        pil_image = Image.fromarray(image_rgb)
        
        # 비율 유지하면서 크기 조정
        pil_image.thumbnail((canvas_width-20, canvas_height-20), Image.Resampling.LANCZOS)
        
        self.result_photo = ImageTk.PhotoImage(pil_image)
        
        self.result_canvas.delete("all")
        self.result_canvas.create_image(canvas_width//2, canvas_height//2, 
                                       image=self.result_photo)
    
    def on_method_change(self):
        """탐지 방법 변경 시 호출"""
        method = self.detection_method.get()
        if method == "haar":
            # Haar Cascade 파라미터 표시
            for widget in self.params_frame.winfo_children():
                widget.pack(fill=tk.X, padx=5, pady=2)
        else:
            # 다른 방법들은 파라미터 숨기기
            for widget in self.params_frame.winfo_children():
                widget.pack_forget()
    
    def on_param_change(self):
        """파라미터 변경 시 실시간 미리보기 업데이트"""
        if hasattr(self, '_preview_active') and self._preview_active:
            self.real_time_preview()
    
    def real_time_preview(self):
        """실시간 미리보기"""
        if self.original_image is None:
            messagebox.showwarning("경고", "먼저 이미지를 선택해주세요.")
            return
        
        if not self.face_detector:
            messagebox.showerror("오류", "얼굴 탐지기가 로드되지 않았습니다.")
            return
        
        self._preview_active = True
        self.status_var.set("실시간 미리보기 중...")
        
        def preview():
            try:
                method = self.detection_method.get()
                
                # 임시 이미지 파일 생성
                temp_path = "temp_preview.jpg"
                cv2.imwrite(temp_path, self.original_image)
                
                if method == "features":
                    result_image, features = self.face_detector.detect_animal_features(temp_path)
                    if result_image is not None:
                        self.current_result = result_image
                        self.root.after(0, lambda: self.display_result_image(result_image))
                        
                        info = f"특징 탐지 결과:\n"
                        info += f"- 눈 후보: {len(features['eyes'])}개\n"
                        info += f"- 코 후보: {len(features['nose'])}개\n"
                        info += f"- 귀 후보: {len(features['ears'])}개\n"
                        
                        self.root.after(0, lambda: self.update_info(info))
                
                else:
                    result_image, faces = self.face_detector.detect_faces_opencv(temp_path, method=method)
                    if result_image is not None:
                        self.current_result = result_image
                        self.root.after(0, lambda: self.display_result_image(result_image))
                        
                        info = f"얼굴 탐지 결과:\n"
                        info += f"- 탐지된 얼굴: {len(faces)}개\n\n"
                        
                        for i, face in enumerate(faces, 1):
                            x, y, w, h = face['bbox']
                            confidence = face.get('confidence', 0)
                            info += f"얼굴 {i}:\n"
                            info += f"  위치: ({x}, {y})\n"
                            info += f"  크기: {w}x{h}\n"
                            info += f"  신뢰도: {confidence:.2f}\n\n"
                        
                        self.root.after(0, lambda: self.update_info(info))
                
                # 임시 파일 삭제
                try:
                    import os
                    os.remove(temp_path)
                except:
                    pass
                
                self.root.after(0, lambda: self.status_var.set("미리보기 완료"))
                
            except Exception as e:
                self.root.after(0, lambda: messagebox.showerror("오류", f"미리보기 실패: {e}"))
                self.root.after(0, lambda: self.status_var.set(f"미리보기 실패: {e}"))
        
        thread = threading.Thread(target=preview, daemon=True)
        thread.start()
    
    def final_detection(self):
        """최종 탐지 실행"""
        self._preview_active = False
        self.real_time_preview()  # 동일한 로직 사용
        self.status_var.set("최종 탐지 완료")
    
    def update_info(self, info_text):
        """정보 텍스트 업데이트"""
        self.info_text.delete(1.0, tk.END)
        self.info_text.insert(1.0, info_text)
    
    def save_result(self):
        """결과 저장"""
        if self.current_result is None:
            messagebox.showwarning("경고", "저장할 결과가 없습니다.")
            return
        
        file_path = filedialog.asksaveasfilename(
            title="탐지 결과 저장",
            defaultextension=".jpg",
            filetypes=[("JPEG 파일", "*.jpg"), ("PNG 파일", "*.png")]
        )
        
        if file_path:
            try:
                success = cv2.imwrite(file_path, self.current_result)
                if success:
                    messagebox.showinfo("성공", f"결과가 저장되었습니다:\n{file_path}")
                    self.status_var.set("결과 저장 완료")
                else:
                    messagebox.showerror("오류", "파일 저장에 실패했습니다.")
            except Exception as e:
                messagebox.showerror("오류", f"저장 중 오류: {e}")

def main():
    root = tk.Tk()
    app = AdvancedFaceDetectionGUI(root)
    
    # 윈도우 크기 조정 이벤트 처리
    def on_configure(event):
        if hasattr(app, 'original_image') and app.original_image is not None:
            app.root.after(10, app.display_original_image)
    
    root.bind('<Configure>', on_configure)
    root.mainloop()

if __name__ == "__main__":
    main()