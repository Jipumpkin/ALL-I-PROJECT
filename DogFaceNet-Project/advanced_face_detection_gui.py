#!/usr/bin/env python3
"""
고급 동물 얼굴 탐지 GUI
실시간 미리보기와 상세 조정 기능 포함
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
        self.root.geometry("1200x800")
        
        # 변수 초기화
        self.original_image = None
        self.current_result = None
        self.face_detector = None
        self.detection_params = {
            'scaleFactor': tk.DoubleVar(value=1.05),
            'minNeighbors': tk.IntVar(value=3),
            'minSize': tk.IntVar(value=20),
            'maxSize': tk.IntVar(value=500)
        }
        
        self.setup_gui()
        self.load_detector()
    
    def setup_gui(self):
        """GUI 구성"""
        # 제목
        title_frame = tk.Frame(self.root, bg="#2c3e50", height=60)
        title_frame.pack(fill=tk.X)
        title_frame.pack_propagate(False)
        
        title_label = tk.Label(title_frame, text="🔍 고급 동물 얼굴 탐지 시스템", 
                              font=("Arial", 18, "bold"), 
                              fg="white", bg="#2c3e50")
        title_label.pack(expand=True)
        
        # 메인 컨테이너
        main_container = tk.Frame(self.root)
        main_container.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # 좌측 패널 (설정 및 컨트롤)
        left_panel = tk.Frame(main_container, width=300, bg="#ecf0f1")
        left_panel.pack(side=tk.LEFT, fill=tk.Y, padx=(0, 10))
        left_panel.pack_propagate(False)
        
        # 우측 패널 (이미지 표시)
        right_panel = tk.Frame(main_container)
        right_panel.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)
        
        self.create_control_panel(left_panel)
        self.create_image_panel(right_panel)
    
    def create_control_panel(self, parent):
        """컨트롤 패널 생성"""
        # 파일 선택
        file_frame = tk.LabelFrame(parent, text="📁 파일 선택", font=("Arial", 10, "bold"),
                                  bg="#ecf0f1", fg="#2c3e50")
        file_frame.pack(fill=tk.X, padx=10, pady=10)
        
        tk.Button(file_frame, text="이미지 선택", command=self.select_image,
                 bg="#3498db", fg="white", font=("Arial", 10, "bold"),
                 relief=tk.FLAT, pady=5).pack(fill=tk.X, padx=5, pady=5)
        
        self.file_label = tk.Label(file_frame, text="파일을 선택해주세요", 
                                  bg="#ecf0f1", fg="#7f8c8d", font=("Arial", 8))
        self.file_label.pack(fill=tk.X, padx=5, pady=2)
        
        # 탐지 방법 선택
        method_frame = tk.LabelFrame(parent, text="🔬 탐지 방법", font=("Arial", 10, "bold"),
                                    bg="#ecf0f1", fg="#2c3e50")
        method_frame.pack(fill=tk.X, padx=10, pady=10)
        
        self.detection_method = tk.StringVar(value="haar")
        methods = [
            ("Haar Cascade (추천)", "haar", "#e74c3c"),
            ("윤곽선 분석", "contour", "#f39c12"),
            ("동물 특징 탐지", "features", "#9b59b6")
        ]
        
        for text, value, color in methods:
            frame = tk.Frame(method_frame, bg="#ecf0f1")
            frame.pack(fill=tk.X, padx=5, pady=2)
            
            rb = tk.Radiobutton(frame, text=text, variable=self.detection_method, 
                               value=value, bg="#ecf0f1", font=("Arial", 9),
                               activebackground="#ecf0f1", selectcolor=color,
                               command=self.on_method_change)
            rb.pack(anchor=tk.W)
        
        # 파라미터 조정 (Haar Cascade용)
        self.params_frame = tk.LabelFrame(parent, text="탐지 파라미터", 
                                         font=("Arial", 10, "bold"),
                                         bg="#ecf0f1", fg="#2c3e50")
        self.params_frame.pack(fill=tk.X, padx=10, pady=10)
        
        self.create_parameter_controls()
        
        # 실행 버튼
        action_frame = tk.LabelFrame(parent, text="실행", font=("Arial", 10, "bold"),
                                    bg="#ecf0f1", fg="#2c3e50")
        action_frame.pack(fill=tk.X, padx=10, pady=10)
        
        tk.Button(action_frame, text="실시간 미리보기", command=self.real_time_preview,
                 bg="#27ae60", fg="white", font=("Arial", 10, "bold"),
                 relief=tk.FLAT, pady=5).pack(fill=tk.X, padx=5, pady=2)
        
        tk.Button(action_frame, text="최종 탐지 실행", command=self.final_detection,
                 bg="#e74c3c", fg="white", font=("Arial", 10, "bold"),
                 relief=tk.FLAT, pady=5).pack(fill=tk.X, padx=5, pady=2)
        
        tk.Button(action_frame, text="결과 저장", command=self.save_result,
                 bg="#34495e", fg="white", font=("Arial", 10, "bold"),
                 relief=tk.FLAT, pady=5).pack(fill=tk.X, padx=5, pady=2)
        
        # 결과 정보
        info_frame = tk.LabelFrame(parent, text="탐지 결과", font=("Arial", 10, "bold"),
                                  bg="#ecf0f1", fg="#2c3e50")
        info_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        self.info_text = tk.Text(info_frame, height=8, font=("Arial", 8),
                                bg="white", fg="#2c3e50", relief=tk.FLAT,
                                wrap=tk.WORD)
        info_scrollbar = tk.Scrollbar(info_frame, orient=tk.VERTICAL, 
                                     command=self.info_text.yview)
        self.info_text.configure(yscrollcommand=info_scrollbar.set)
        
        self.info_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=5, pady=5)
        info_scrollbar.pack(side=tk.RIGHT, fill=tk.Y, pady=5)
        
        # 상태바
        self.status_var = tk.StringVar(value="시스템 준비 중...")
        status_frame = tk.Frame(parent, bg="#34495e", height=30)
        status_frame.pack(fill=tk.X, side=tk.BOTTOM)
        status_frame.pack_propagate(False)
        
        tk.Label(status_frame, textvariable=self.status_var, 
                bg="#34495e", fg="white", font=("Arial", 8)).pack(expand=True, pady=5)
    
    def create_parameter_controls(self):
        """파라미터 조정 컨트롤 생성"""
        params_info = [
            ("스케일 팩터", "scaleFactor", 1.01, 1.3, 0.01),
            ("최소 이웃 수", "minNeighbors", 1, 10, 1),
            ("최소 크기", "minSize", 10, 100, 5),
            ("최대 크기", "maxSize", 100, 800, 10)
        ]
        
        for i, (label, param, min_val, max_val, step) in enumerate(params_info):
            frame = tk.Frame(self.params_frame, bg="#ecf0f1")
            frame.pack(fill=tk.X, padx=5, pady=2)
            
            tk.Label(frame, text=f"{label}:", bg="#ecf0f1", 
                    font=("Arial", 8), width=12, anchor=tk.W).pack(side=tk.LEFT)
            
            var = self.detection_params[param]
            
            if isinstance(var, tk.DoubleVar):
                scale = tk.Scale(frame, from_=min_val, to=max_val, resolution=step,
                               orient=tk.HORIZONTAL, variable=var, bg="#ecf0f1",
                               activebackground="#3498db", highlightthickness=0,
                               command=lambda v, p=param: self.on_param_change())
            else:
                scale = tk.Scale(frame, from_=min_val, to=max_val, resolution=step,
                               orient=tk.HORIZONTAL, variable=var, bg="#ecf0f1",
                               activebackground="#3498db", highlightthickness=0,
                               command=lambda v, p=param: self.on_param_change())
            
            scale.pack(side=tk.LEFT, fill=tk.X, expand=True)
            
            value_label = tk.Label(frame, textvariable=var, bg="#ecf0f1", 
                                  font=("Arial", 8), width=6)
            value_label.pack(side=tk.RIGHT)
    
    def create_image_panel(self, parent):
        """이미지 표시 패널 생성"""
        # 이미지 표시 영역
        image_container = tk.Frame(parent)
        image_container.pack(fill=tk.BOTH, expand=True)
        
        # 원본 이미지
        original_frame = tk.LabelFrame(image_container, text="원본 이미지", 
                                      font=("Arial", 12, "bold"), fg="#2c3e50")
        original_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 5))
        
        self.original_canvas = tk.Canvas(original_frame, bg="#bdc3c7")
        self.original_canvas.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # 결과 이미지
        result_frame = tk.LabelFrame(image_container, text="탐지 결과", 
                                    font=("Arial", 12, "bold"), fg="#2c3e50")
        result_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=(5, 0))
        
        self.result_canvas = tk.Canvas(result_frame, bg="#bdc3c7")
        self.result_canvas.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # 초기 텍스트
        self.original_canvas.create_text(200, 150, text="이미지를 선택해주세요", 
                                        font=("Arial", 14), fill="#7f8c8d")
        self.result_canvas.create_text(200, 150, text="탐지 결과가 여기 표시됩니다", 
                                      font=("Arial", 14), fill="#7f8c8d")
    
    def load_detector(self):
        """얼굴 탐지기 로딩"""
        def load():
            try:
                from animal_face_detector import AnimalFaceDetector
                self.face_detector = AnimalFaceDetector()
                self.status_var.set("시스템 준비 완료 ✓")
            except Exception as e:
                self.status_var.set(f"로딩 실패: {e}")
        
        thread = threading.Thread(target=load, daemon=True)
        thread.start()\n    \n    def select_image(self):\n        \"\"\"이미지 선택\"\"\"\n        file_path = filedialog.askopenfilename(\n            title=\"동물 이미지 선택\",\n            filetypes=[(\"이미지 파일\", \"*.jpg *.jpeg *.png *.bmp\"), (\"모든 파일\", \"*.*\")]\n        )\n        \n        if file_path:\n            self.load_image(file_path)\n    \n    def load_image(self, file_path):\n        \"\"\"이미지 로딩 및 표시\"\"\"\n        try:\n            self.original_image = cv2.imread(file_path)\n            if self.original_image is None:\n                raise Exception(\"이미지 로드 실패\")\n            \n            self.file_label.config(text=Path(file_path).name)\n            self.display_original_image()\n            \n            self.info_text.delete(1.0, tk.END)\n            self.info_text.insert(tk.END, f\"파일: {Path(file_path).name}\\n\")\n            self.info_text.insert(tk.END, f\"크기: {self.original_image.shape[1]}x{self.original_image.shape[0]}\\n\\n\")\n            \n            self.status_var.set(\"이미지 로드 완료 ✓\")\n            \n        except Exception as e:\n            messagebox.showerror(\"오류\", f\"이미지 로드 실패: {e}\")\n            self.status_var.set(f\"이미지 로드 실패: {e}\")\n    \n    def display_original_image(self):\n        \"\"\"원본 이미지 표시\"\"\"\n        if self.original_image is None:\n            return\n        \n        # 캔버스 크기에 맞게 이미지 크기 조정\n        canvas_width = self.original_canvas.winfo_width()\n        canvas_height = self.original_canvas.winfo_height()\n        \n        if canvas_width <= 1 or canvas_height <= 1:\n            self.root.after(100, self.display_original_image)\n            return\n        \n        # 이미지 크기 조정\n        image_rgb = cv2.cvtColor(self.original_image, cv2.COLOR_BGR2RGB)\n        pil_image = Image.fromarray(image_rgb)\n        \n        # 비율 유지하면서 크기 조정\n        pil_image.thumbnail((canvas_width-20, canvas_height-20), Image.Resampling.LANCZOS)\n        \n        self.original_photo = ImageTk.PhotoImage(pil_image)\n        \n        self.original_canvas.delete(\"all\")\n        self.original_canvas.create_image(canvas_width//2, canvas_height//2, \n                                         image=self.original_photo)\n    \n    def display_result_image(self, result_image):\n        \"\"\"결과 이미지 표시\"\"\"\n        if result_image is None:\n            return\n        \n        # 캔버스 크기에 맞게 이미지 크기 조정\n        canvas_width = self.result_canvas.winfo_width()\n        canvas_height = self.result_canvas.winfo_height()\n        \n        if canvas_width <= 1 or canvas_height <= 1:\n            self.root.after(100, lambda: self.display_result_image(result_image))\n            return\n        \n        # BGR을 RGB로 변환\n        if len(result_image.shape) == 3:\n            image_rgb = cv2.cvtColor(result_image, cv2.COLOR_BGR2RGB)\n        else:\n            image_rgb = result_image\n        \n        pil_image = Image.fromarray(image_rgb)\n        \n        # 비율 유지하면서 크기 조정\n        pil_image.thumbnail((canvas_width-20, canvas_height-20), Image.Resampling.LANCZOS)\n        \n        self.result_photo = ImageTk.PhotoImage(pil_image)\n        \n        self.result_canvas.delete(\"all\")\n        self.result_canvas.create_image(canvas_width//2, canvas_height//2, \n                                       image=self.result_photo)\n    \n    def on_method_change(self):\n        \"\"\"탐지 방법 변경 시 호출\"\"\"\n        method = self.detection_method.get()\n        if method == \"haar\":\n            # Haar Cascade 파라미터 표시\n            for widget in self.params_frame.winfo_children():\n                widget.pack(fill=tk.X, padx=5, pady=2)\n        else:\n            # 다른 방법들은 파라미터 숨기기\n            for widget in self.params_frame.winfo_children():\n                widget.pack_forget()\n    \n    def on_param_change(self):\n        \"\"\"파라미터 변경 시 실시간 미리보기 업데이트\"\"\"\n        if hasattr(self, '_preview_active') and self._preview_active:\n            self.real_time_preview()\n    \n    def real_time_preview(self):\n        \"\"\"실시간 미리보기\"\"\"\n        if self.original_image is None:\n            messagebox.showwarning(\"경고\", \"먼저 이미지를 선택해주세요.\")\n            return\n        \n        if not self.face_detector:\n            messagebox.showerror(\"오류\", \"얼굴 탐지기가 로드되지 않았습니다.\")\n            return\n        \n        self._preview_active = True\n        self.status_var.set(\"실시간 미리보기 중...\")\n        \n        def preview():\n            try:\n                method = self.detection_method.get()\n                \n                # 임시 이미지 파일 생성\n                temp_path = \"temp_preview.jpg\"\n                cv2.imwrite(temp_path, self.original_image)\n                \n                if method == \"features\":\n                    result_image, features = self.face_detector.detect_animal_features(temp_path)\n                    if result_image is not None:\n                        self.current_result = result_image\n                        self.root.after(0, lambda: self.display_result_image(result_image))\n                        \n                        info = f\"특징 탐지 결과:\\n\"\n                        info += f\"- 눈 후보: {len(features['eyes'])}개\\n\"\n                        info += f\"- 코 후보: {len(features['nose'])}개\\n\"\n                        info += f\"- 귀 후보: {len(features['ears'])}개\\n\"\n                        \n                        self.root.after(0, lambda: self.update_info(info))\n                \n                else:\n                    # Haar나 contour 방법\n                    if method == \"haar\":\n                        # 파라미터 적용을 위해 탐지기 설정 수정\n                        if hasattr(self.face_detector, 'haar_cascades'):\n                            pass  # 파라미터는 detectMultiScale에서 적용\n                    \n                    result_image, faces = self.face_detector.detect_faces_opencv(temp_path, method=method)\n                    if result_image is not None:\n                        self.current_result = result_image\n                        self.root.after(0, lambda: self.display_result_image(result_image))\n                        \n                        info = f\"얼굴 탐지 결과:\\n\"\n                        info += f\"- 탐지된 얼굴: {len(faces)}개\\n\\n\"\n                        \n                        for i, face in enumerate(faces, 1):\n                            x, y, w, h = face['bbox']\n                            confidence = face.get('confidence', 0)\n                            info += f\"얼굴 {i}:\\n\"\n                            info += f\"  위치: ({x}, {y})\\n\"\n                            info += f\"  크기: {w}x{h}\\n\"\n                            info += f\"  신뢰도: {confidence:.2f}\\n\\n\"\n                        \n                        self.root.after(0, lambda: self.update_info(info))\n                \n                # 임시 파일 삭제\n                try:\n                    import os\n                    os.remove(temp_path)\n                except:\n                    pass\n                \n                self.root.after(0, lambda: self.status_var.set(\"미리보기 완료 ✓\"))\n                \n            except Exception as e:\n                self.root.after(0, lambda: messagebox.showerror(\"오류\", f\"미리보기 실패: {e}\"))\n                self.root.after(0, lambda: self.status_var.set(f\"미리보기 실패: {e}\"))\n        \n        thread = threading.Thread(target=preview, daemon=True)\n        thread.start()\n    \n    def final_detection(self):\n        \"\"\"최종 탐지 실행\"\"\"\n        self._preview_active = False\n        self.real_time_preview()  # 동일한 로직 사용\n        self.status_var.set(\"최종 탐지 완료 ✓\")\n    \n    def update_info(self, info_text):\n        \"\"\"정보 텍스트 업데이트\"\"\"\n        self.info_text.delete(1.0, tk.END)\n        self.info_text.insert(1.0, info_text)\n    \n    def save_result(self):\n        \"\"\"결과 저장\"\"\"\n        if self.current_result is None:\n            messagebox.showwarning(\"경고\", \"저장할 결과가 없습니다.\")\n            return\n        \n        file_path = filedialog.asksaveasfilename(\n            title=\"탐지 결과 저장\",\n            defaultextension=\".jpg\",\n            filetypes=[(\"JPEG 파일\", \"*.jpg\"), (\"PNG 파일\", \"*.png\")]\n        )\n        \n        if file_path:\n            try:\n                success = cv2.imwrite(file_path, self.current_result)\n                if success:\n                    messagebox.showinfo(\"성공\", f\"결과가 저장되었습니다:\\n{file_path}\")\n                    self.status_var.set(\"결과 저장 완료 ✓\")\n                else:\n                    messagebox.showerror(\"오류\", \"파일 저장에 실패했습니다.\")\n            except Exception as e:\n                messagebox.showerror(\"오류\", f\"저장 중 오류: {e}\")\n\ndef main():\n    root = tk.Tk()\n    app = AdvancedFaceDetectionGUI(root)\n    \n    # 윈도우 크기 조정 이벤트 처리\n    def on_configure(event):\n        if hasattr(app, 'original_image') and app.original_image is not None:\n            app.root.after(10, app.display_original_image)\n    \n    root.bind('<Configure>', on_configure)\n    root.mainloop()\n\nif __name__ == \"__main__\":\n    main()\n