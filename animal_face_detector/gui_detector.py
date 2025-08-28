#!/usr/bin/env python3
"""
Animal Face Detection GUI with Edge Detection
동물 얼굴 탐지 + 경계선 탐지 GUI 프로그램
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import cv2
import numpy as np
from PIL import Image, ImageTk
from pathlib import Path
import os

class AnimalFaceDetectorGUI:
    """동물 얼굴 탐지 + 경계선 탐지 GUI"""
    
    def __init__(self, root):
        self.root = root
        self.root.title("동물 얼굴 & 경계선 탐지기")
        self.root.geometry("1200x800")
        
        # 변수들
        self.current_image = None
        self.original_image = None
        self.detector = None
        
        # GUI 구성요소 초기화
        self.setup_menu()
        self.setup_gui()
        self.setup_shortcuts()
        self.initialize_detector()
    
    def setup_menu(self):
        """메뉴바 설정"""
        menubar = tk.Menu(self.root)
        self.root.config(menu=menubar)
        
        # 파일 메뉴
        file_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="파일", menu=file_menu)
        file_menu.add_command(label="이미지 열기 (Ctrl+O)", command=self.load_image)
        file_menu.add_command(label="폴더 선택", command=self.select_folder)
        file_menu.add_separator()
        file_menu.add_command(label="결과 저장 (Ctrl+S)", command=self.save_result)
        file_menu.add_separator()
        file_menu.add_command(label="종료", command=self.root.quit)
        
        # 처리 메뉴
        process_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="처리", menu=process_menu)
        process_menu.add_command(label="동물 얼굴 탐지 (F1)", command=self.detect_faces)
        process_menu.add_command(label="경계선 탐지 (F2)", command=self.detect_edges)
        process_menu.add_command(label="결합 처리 (F3)", command=self.combined_detection)
        
        # 초기화 메뉴
        reset_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="초기화", menu=reset_menu)
        reset_menu.add_command(label="원본 복원 (Ctrl+R)", command=self.reset_image)
        reset_menu.add_command(label="설정만 초기화 (Ctrl+Shift+R)", command=self.reset_settings)
        reset_menu.add_separator()
        reset_menu.add_command(label="스마트 초기화 (Ctrl+Shift+A)", command=self.reset_all)
        reset_menu.add_command(label="완전 초기화 (위험)", command=self.reset_complete)
        
        # 도움말 메뉴
        help_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="도움말", menu=help_menu)
        help_menu.add_command(label="키보드 단축키 (F12)", command=self.show_help)
        help_menu.add_command(label="프로그램 정보", command=self.show_about)
        
    def setup_gui(self):
        """GUI 구성요소 설정"""
        # 메인 프레임
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # 좌측 제어 패널
        control_frame = ttk.Frame(main_frame)
        control_frame.grid(row=0, column=0, sticky=(tk.W, tk.N), padx=(0, 10))
        
        # 파일 선택
        ttk.Label(control_frame, text="파일 선택", font=('Arial', 12, 'bold')).grid(row=0, column=0, sticky=tk.W, pady=5)
        ttk.Button(control_frame, text="이미지 열기", command=self.load_image, width=20).grid(row=1, column=0, pady=2)
        ttk.Button(control_frame, text="폴더 선택", command=self.select_folder, width=20).grid(row=2, column=0, pady=2)
        
        # 구분선
        ttk.Separator(control_frame, orient='horizontal').grid(row=3, column=0, sticky='ew', pady=10)
        
        # 동물 얼굴 탐지
        ttk.Label(control_frame, text="동물 얼굴 탐지", font=('Arial', 12, 'bold')).grid(row=4, column=0, sticky=tk.W, pady=5)
        
        # YOLO 모델 선택
        ttk.Label(control_frame, text="YOLO 모델:").grid(row=5, column=0, sticky=tk.W)
        self.model_var = tk.StringVar(value="n")
        model_combo = ttk.Combobox(control_frame, textvariable=self.model_var, values=["n", "s", "m", "l"], state="readonly", width=17)
        model_combo.grid(row=6, column=0, pady=2)
        
        # 신뢰도 설정
        ttk.Label(control_frame, text="신뢰도 임계값:").grid(row=7, column=0, sticky=tk.W)
        self.confidence_var = tk.DoubleVar(value=0.5)
        confidence_scale = ttk.Scale(control_frame, from_=0.1, to=0.9, variable=self.confidence_var, orient=tk.HORIZONTAL)
        confidence_scale.grid(row=8, column=0, sticky='ew', pady=2)
        self.confidence_label = ttk.Label(control_frame, text="0.5")
        self.confidence_label.grid(row=9, column=0)
        confidence_scale.configure(command=self.update_confidence_label)
        
        ttk.Button(control_frame, text="얼굴 탐지 실행", command=self.detect_faces, width=20).grid(row=10, column=0, pady=5)
        
        # 구분선
        ttk.Separator(control_frame, orient='horizontal').grid(row=11, column=0, sticky='ew', pady=5)
        
        # 필터링 옵션
        ttk.Label(control_frame, text="필터링 옵션", font=('Arial', 11, 'bold')).grid(row=12, column=0, sticky=tk.W, pady=3)
        
        # 크기 필터링
        ttk.Label(control_frame, text="최소 얼굴 크기:").grid(row=13, column=0, sticky=tk.W)
        self.min_face_size = tk.IntVar(value=30)
        ttk.Scale(control_frame, from_=10, to=200, variable=self.min_face_size, orient=tk.HORIZONTAL).grid(row=14, column=0, sticky='ew')
        
        ttk.Label(control_frame, text="최대 얼굴 크기:").grid(row=15, column=0, sticky=tk.W)
        self.max_face_size = tk.IntVar(value=1000)
        ttk.Scale(control_frame, from_=100, to=2000, variable=self.max_face_size, orient=tk.HORIZONTAL).grid(row=16, column=0, sticky='ew')
        
        # 중복 제거
        ttk.Label(control_frame, text="중복 제거 임계값:").grid(row=17, column=0, sticky=tk.W)
        self.overlap_threshold = tk.DoubleVar(value=0.5)
        ttk.Scale(control_frame, from_=0.1, to=0.9, variable=self.overlap_threshold, orient=tk.HORIZONTAL).grid(row=18, column=0, sticky='ew')
        
        # 품질 필터링
        ttk.Label(control_frame, text="품질 임계값:").grid(row=19, column=0, sticky=tk.W)
        self.quality_threshold = tk.DoubleVar(value=0.3)
        ttk.Scale(control_frame, from_=0.1, to=0.9, variable=self.quality_threshold, orient=tk.HORIZONTAL).grid(row=20, column=0, sticky='ew')
        
        # 필터링 활성화/비활성화
        self.enable_filtering = tk.BooleanVar(value=True)
        ttk.Checkbutton(control_frame, text="필터링 활성화", variable=self.enable_filtering).grid(row=21, column=0, sticky=tk.W, pady=2)
        
        # 구분선
        ttk.Separator(control_frame, orient='horizontal').grid(row=22, column=0, sticky='ew', pady=10)
        
        # 경계선 탐지
        ttk.Label(control_frame, text="경계선 탐지", font=('Arial', 12, 'bold')).grid(row=23, column=0, sticky=tk.W, pady=5)
        
        # 경계선 탐지 방법 선택
        ttk.Label(control_frame, text="탐지 방법:").grid(row=24, column=0, sticky=tk.W)
        self.edge_method = tk.StringVar(value="canny")
        edge_combo = ttk.Combobox(control_frame, textvariable=self.edge_method, 
                                values=["canny", "sobel", "laplacian", "scharr"], state="readonly", width=17)
        edge_combo.grid(row=25, column=0, pady=2)
        
        # Canny 파라미터
        ttk.Label(control_frame, text="Lower Threshold:").grid(row=26, column=0, sticky=tk.W)
        self.canny_low = tk.IntVar(value=50)
        ttk.Scale(control_frame, from_=1, to=255, variable=self.canny_low, orient=tk.HORIZONTAL).grid(row=27, column=0, sticky='ew')
        
        ttk.Label(control_frame, text="Upper Threshold:").grid(row=28, column=0, sticky=tk.W)
        self.canny_high = tk.IntVar(value=150)
        ttk.Scale(control_frame, from_=1, to=255, variable=self.canny_high, orient=tk.HORIZONTAL).grid(row=29, column=0, sticky='ew')
        
        ttk.Button(control_frame, text="경계선 탐지 실행", command=self.detect_edges, width=20).grid(row=30, column=0, pady=5)
        
        # 구분선
        ttk.Separator(control_frame, orient='horizontal').grid(row=31, column=0, sticky='ew', pady=10)
        
        # 결합 처리
        ttk.Label(control_frame, text="결합 처리", font=('Arial', 12, 'bold')).grid(row=32, column=0, sticky=tk.W, pady=5)
        ttk.Button(control_frame, text="얼굴 + 경계선", command=self.combined_detection, width=20).grid(row=33, column=0, pady=2)
        
        # 구분선
        ttk.Separator(control_frame, orient='horizontal').grid(row=34, column=0, sticky='ew', pady=10)
        
        # 저장 및 초기화
        ttk.Label(control_frame, text="저장 & 스마트 초기화", font=('Arial', 12, 'bold')).grid(row=35, column=0, sticky=tk.W, pady=5)
        ttk.Button(control_frame, text="결과 저장", command=self.save_result, width=20).grid(row=36, column=0, pady=2)
        ttk.Button(control_frame, text="원본 복원", command=self.reset_image, width=20).grid(row=37, column=0, pady=2)
        ttk.Button(control_frame, text="스마트 초기화", command=self.reset_all, width=20).grid(row=38, column=0, pady=2)
        ttk.Button(control_frame, text="설정만 초기화", command=self.reset_settings, width=20).grid(row=39, column=0, pady=2)
        ttk.Button(control_frame, text="완전 초기화", command=self.reset_complete, width=20).grid(row=40, column=0, pady=2)
        
        # 우측 이미지 표시 영역
        image_frame = ttk.Frame(main_frame)
        image_frame.grid(row=0, column=1, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # 이미지 캔버스
        self.canvas = tk.Canvas(image_frame, bg='lightgray', width=800, height=600)
        self.canvas.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # 스크롤바
        v_scrollbar = ttk.Scrollbar(image_frame, orient=tk.VERTICAL, command=self.canvas.yview)
        v_scrollbar.grid(row=0, column=1, sticky=(tk.N, tk.S))
        self.canvas.configure(yscrollcommand=v_scrollbar.set)
        
        h_scrollbar = ttk.Scrollbar(image_frame, orient=tk.HORIZONTAL, command=self.canvas.xview)
        h_scrollbar.grid(row=1, column=0, sticky=(tk.W, tk.E))
        self.canvas.configure(xscrollcommand=h_scrollbar.set)
        
        # 상태바
        self.status_var = tk.StringVar(value="준비")
        status_bar = ttk.Label(main_frame, textvariable=self.status_var, relief=tk.SUNKEN)
        status_bar.grid(row=1, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=5)
        
        # 그리드 가중치 설정
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)
        main_frame.rowconfigure(0, weight=1)
        image_frame.columnconfigure(0, weight=1)
        image_frame.rowconfigure(0, weight=1)
    
    def initialize_detector(self):
        """동물 얼굴 탐지기 초기화"""
        try:
            from detector_ascii import SimpleFaceDetector
            self.detector = SimpleFaceDetector()
            self.status_var.set("동물 얼굴 탐지기 로드 완료")
        except Exception as e:
            self.status_var.set(f"탐지기 로드 실패: {e}")
            messagebox.showerror("오류", f"동물 얼굴 탐지기 로드 실패:\n{e}")
    
    def update_confidence_label(self, value):
        """신뢰도 레이블 업데이트"""
        self.confidence_label.config(text=f"{float(value):.2f}")
    
    def load_image(self):
        """이미지 파일 로드"""
        file_path = filedialog.askopenfilename(
            title="이미지 선택",
            filetypes=[
                ("이미지 파일", "*.jpg *.jpeg *.png *.bmp *.tiff *.webp"),
                ("모든 파일", "*.*")
            ]
        )
        
        if file_path:
            try:
                # OpenCV로 이미지 로드
                self.current_image = cv2.imread(file_path)
                self.original_image = self.current_image.copy()
                
                # 화면에 표시
                self.display_image(self.current_image)
                self.status_var.set(f"이미지 로드 완료: {Path(file_path).name}")
                
            except Exception as e:
                messagebox.showerror("오류", f"이미지 로드 실패:\n{e}")
                self.status_var.set("이미지 로드 실패")
    
    def select_folder(self):
        """폴더 선택 (배치 처리용)"""
        folder_path = filedialog.askdirectory(title="폴더 선택")
        if folder_path:
            messagebox.showinfo("폴더 선택됨", f"선택된 폴더: {folder_path}\n배치 처리 기능은 개발 중입니다.")
    
    def display_image(self, cv_image):
        """OpenCV 이미지를 캔버스에 표시"""
        if cv_image is None:
            return
            
        # OpenCV BGR -> RGB 변환
        rgb_image = cv2.cvtColor(cv_image, cv2.COLOR_BGR2RGB)
        
        # 이미지 크기 조정 (너무 크면)
        height, width = rgb_image.shape[:2]
        max_width, max_height = 800, 600
        
        if width > max_width or height > max_height:
            scale = min(max_width/width, max_height/height)
            new_width = int(width * scale)
            new_height = int(height * scale)
            rgb_image = cv2.resize(rgb_image, (new_width, new_height))
        
        # PIL Image로 변환
        pil_image = Image.fromarray(rgb_image)
        self.photo = ImageTk.PhotoImage(pil_image)
        
        # 캔버스에 표시
        self.canvas.delete("all")
        self.canvas.create_image(0, 0, anchor=tk.NW, image=self.photo)
        self.canvas.configure(scrollregion=self.canvas.bbox("all"))
    
    def detect_faces(self):
        """동물 얼굴 탐지 실행"""
        if self.current_image is None:
            messagebox.showwarning("경고", "먼저 이미지를 로드하세요.")
            return
            
        if self.detector is None:
            messagebox.showerror("오류", "탐지기가 초기화되지 않았습니다.")
            return
        
        try:
            self.status_var.set("얼굴 탐지 중...")
            self.root.update()
            
            # 탐지기 파라미터 업데이트
            self.detector.confidence = self.confidence_var.get()
            
            # 필터링 옵션 업데이트
            if hasattr(self, 'enable_filtering') and self.enable_filtering.get():
                self.detector.min_face_size = self.min_face_size.get()
                self.detector.max_face_size = self.max_face_size.get()
                self.detector.overlap_threshold = self.overlap_threshold.get()
                self.detector.quality_threshold = self.quality_threshold.get()
                print(f"Filtering enabled: size({self.min_face_size.get()}-{self.max_face_size.get()}), overlap({self.overlap_threshold.get()}), quality({self.quality_threshold.get()})")
            else:
                # 필터링 비활성화 시 매우 관대한 설정
                self.detector.min_face_size = 1
                self.detector.max_face_size = 5000
                self.detector.overlap_threshold = 0.9
                self.detector.quality_threshold = 0.0
                print("Filtering disabled - using permissive settings")
            
            # 임시 파일로 저장해서 처리 (detector_ascii.py가 파일 경로를 받으므로)
            temp_path = "temp_image.jpg"
            cv2.imwrite(temp_path, self.current_image)
            
            # 얼굴 탐지 실행
            faces, result_image = self.detector.detect_faces(temp_path)
            
            # 임시 파일 삭제
            if os.path.exists(temp_path):
                os.remove(temp_path)
            
            if faces:
                self.current_image = result_image
                self.display_image(self.current_image)
                self.status_var.set(f"얼굴 탐지 완료: {len(faces)}개 발견")
            else:
                self.status_var.set("동물 얼굴을 찾을 수 없습니다")
                
        except Exception as e:
            self.status_var.set(f"얼굴 탐지 실패: {e}")
            messagebox.showerror("오류", f"얼굴 탐지 실패:\n{e}")
    
    def detect_edges(self):
        """경계선 탐지 실행"""
        if self.current_image is None:
            messagebox.showwarning("경고", "먼저 이미지를 로드하세요.")
            return
        
        try:
            self.status_var.set("경계선 탐지 중...")
            self.root.update()
            
            # 그레이스케일 변환
            gray = cv2.cvtColor(self.original_image, cv2.COLOR_BGR2GRAY)
            
            method = self.edge_method.get()
            
            if method == "canny":
                # Canny 경계선 탐지
                edges = cv2.Canny(gray, self.canny_low.get(), self.canny_high.get())
                
            elif method == "sobel":
                # Sobel 경계선 탐지
                sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
                sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
                edges = np.sqrt(sobelx**2 + sobely**2)
                edges = np.uint8(edges / edges.max() * 255)
                
            elif method == "laplacian":
                # Laplacian 경계선 탐지
                edges = cv2.Laplacian(gray, cv2.CV_64F)
                edges = np.uint8(np.absolute(edges))
                
            elif method == "scharr":
                # Scharr 경계선 탐지
                scharrx = cv2.Scharr(gray, cv2.CV_64F, 1, 0)
                scharry = cv2.Scharr(gray, cv2.CV_64F, 0, 1)
                edges = np.sqrt(scharrx**2 + scharry**2)
                edges = np.uint8(edges / edges.max() * 255)
            
            # 경계선을 3채널로 변환해서 표시
            edge_colored = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)
            self.current_image = edge_colored
            
            self.display_image(self.current_image)
            self.status_var.set(f"{method.upper()} 경계선 탐지 완료")
            
        except Exception as e:
            self.status_var.set(f"경계선 탐지 실패: {e}")
            messagebox.showerror("오류", f"경계선 탐지 실패:\n{e}")
    
    def combined_detection(self):
        """얼굴 탐지 + 경계선 탐지 결합"""
        if self.current_image is None:
            messagebox.showwarning("경고", "먼저 이미지를 로드하세요.")
            return
            
        try:
            self.status_var.set("결합 탐지 중...")
            self.root.update()
            
            # 1단계: 얼굴 탐지
            temp_path = "temp_image.jpg"
            cv2.imwrite(temp_path, self.original_image)
            faces, face_result = self.detector.detect_faces(temp_path)
            
            # 2단계: 경계선 탐지
            gray = cv2.cvtColor(self.original_image, cv2.COLOR_BGR2GRAY)
            edges = cv2.Canny(gray, self.canny_low.get(), self.canny_high.get())
            
            # 3단계: 결합
            # 경계선을 원본 이미지에 오버레이
            combined = face_result.copy()
            edge_mask = edges > 0
            combined[edge_mask] = [0, 255, 255]  # 노란색으로 경계선 표시
            
            # 임시 파일 삭제
            if os.path.exists(temp_path):
                os.remove(temp_path)
            
            self.current_image = combined
            self.display_image(self.current_image)
            
            face_count = len(faces) if faces else 0
            self.status_var.set(f"결합 탐지 완료: 얼굴 {face_count}개 + 경계선")
            
        except Exception as e:
            self.status_var.set(f"결합 탐지 실패: {e}")
            messagebox.showerror("오류", f"결합 탐지 실패:\n{e}")
    
    def save_result(self):
        """결과 이미지 저장"""
        if self.current_image is None:
            messagebox.showwarning("경고", "저장할 이미지가 없습니다.")
            return
        
        file_path = filedialog.asksaveasfilename(
            title="결과 저장",
            defaultextension=".jpg",
            filetypes=[
                ("JPEG 파일", "*.jpg"),
                ("PNG 파일", "*.png"),
                ("모든 파일", "*.*")
            ]
        )
        
        if file_path:
            try:
                cv2.imwrite(file_path, self.current_image)
                self.status_var.set(f"저장 완료: {Path(file_path).name}")
                messagebox.showinfo("저장 완료", f"파일이 저장되었습니다:\n{file_path}")
            except Exception as e:
                messagebox.showerror("오류", f"저장 실패:\n{e}")
    
    def reset_image(self):
        """원본 이미지로 복원"""
        if self.original_image is None:
            messagebox.showwarning("경고", "원본 이미지가 없습니다.")
            return
        
        self.current_image = self.original_image.copy()
        self.display_image(self.current_image)
        self.status_var.set("원본 이미지로 복원됨")
    
    def reset_settings(self):
        """설정값들을 기본값으로 초기화 (이미지 유지)"""
        try:
            # 동물 얼굴 탐지 설정 초기화
            self.model_var.set("n")
            self.confidence_var.set(0.5)
            self.confidence_label.config(text="0.5")
            
            # 경계선 탐지 설정 초기화
            self.edge_method.set("canny")
            self.canny_low.set(50)
            self.canny_high.set(150)
            
            # 필터링 설정 초기화
            if hasattr(self, 'min_face_size'):
                self.min_face_size.set(30)
                self.max_face_size.set(1000)
                self.overlap_threshold.set(0.5)
                self.quality_threshold.set(0.3)
                self.enable_filtering.set(True)
            
            # 이미지는 원본으로 복원 (유지)
            if self.original_image is not None:
                self.current_image = self.original_image.copy()
                self.display_image(self.current_image)
            
            self.status_var.set("설정 초기화 완료 (이미지 유지)")
            messagebox.showinfo("초기화 완료", "모든 설정이 기본값으로 초기화되었습니다.\n이미지는 원본 상태로 유지됩니다.")
            
        except Exception as e:
            self.status_var.set(f"설정 초기화 실패: {e}")
            messagebox.showerror("오류", f"설정 초기화 실패:\n{e}")
    
    def reset_all(self):
        """스마트 초기화 (이미지는 유지, 나머지 초기화)"""
        if self.original_image is None:
            # 이미지가 없으면 완전 초기화
            result = messagebox.askyesno("전체 초기화", 
                                       "현재 로드된 이미지가 없습니다.\n"
                                       "모든 설정을 초기화하시겠습니까?")
            if not result:
                return
                
            try:
                self.reset_to_clean_state()
                self.status_var.set("전체 초기화 완료")
                messagebox.showinfo("초기화 완료", "모든 설정이 초기화되었습니다.")
            except Exception as e:
                self.status_var.set(f"초기화 실패: {e}")
                messagebox.showerror("오류", f"초기화 실패:\n{e}")
        else:
            # 이미지가 있으면 이미지 유지하고 나머지만 초기화
            result = messagebox.askyesno("스마트 초기화", 
                                       "현재 이미지를 유지하고 설정만 초기화하시겠습니까?\n\n"
                                       "✅ 이미지: 원본 상태로 유지\n"
                                       "🔄 설정: 기본값으로 초기화\n"
                                       "🧹 처리결과: 제거")
            if not result:
                return
                
            try:
                # 설정 초기화
                self.model_var.set("n")
                self.confidence_var.set(0.5)
                self.confidence_label.config(text="0.5")
                self.edge_method.set("canny")
                self.canny_low.set(50)
                self.canny_high.set(150)
                
                # 필터링 설정 초기화
                if hasattr(self, 'min_face_size'):
                    self.min_face_size.set(30)
                    self.max_face_size.set(1000)
                    self.overlap_threshold.set(0.5)
                    self.quality_threshold.set(0.3)
                    self.enable_filtering.set(True)
                
                # 이미지는 원본으로 복원 (유지)
                self.current_image = self.original_image.copy()
                self.display_image(self.current_image)
                
                # 임시 파일 정리
                self.cleanup_temp_files()
                
                self.status_var.set("스마트 초기화 완료 (이미지 유지)")
                messagebox.showinfo("초기화 완료", 
                                  "스마트 초기화가 완료되었습니다!\n\n"
                                  "✅ 이미지: 원본 상태로 유지됨\n"
                                  "🔄 설정: 기본값으로 초기화됨\n"
                                  "🧹 임시파일: 정리 완료")
                
            except Exception as e:
                self.status_var.set(f"스마트 초기화 실패: {e}")
                messagebox.showerror("오류", f"스마트 초기화 실패:\n{e}")
    
    def reset_complete(self):
        """완전 초기화 (이미지 포함 모든 것 제거)"""
        result = messagebox.askyesno("완전 초기화", 
                                   "⚠️ 경고: 모든 이미지와 설정을 완전히 제거합니다!\n\n"
                                   "❌ 현재 이미지: 완전 삭제\n"
                                   "❌ 모든 설정: 기본값으로 초기화\n" 
                                   "❌ 처리 결과: 모두 삭제\n\n"
                                   "이 작업은 되돌릴 수 없습니다.\n"
                                   "정말 계속하시겠습니까?")
        
        if not result:
            return
            
        try:
            self.reset_to_clean_state()
            self.status_var.set("완전 초기화 완료")
            messagebox.showinfo("초기화 완료", 
                              "완전 초기화가 완료되었습니다.\n"
                              "새로운 이미지를 로드해주세요.")
            
        except Exception as e:
            self.status_var.set(f"완전 초기화 실패: {e}")
            messagebox.showerror("오류", f"완전 초기화 실패:\n{e}")
    
    def reset_to_clean_state(self):
        """깨끗한 상태로 완전 초기화"""
        # 이미지 완전 제거
        self.current_image = None
        self.original_image = None
        self.photo = None
        
        # 캔버스 초기화
        self.canvas.delete("all")
        self.canvas.configure(scrollregion=(0, 0, 0, 0))
        
        # 설정 초기화
        self.model_var.set("n")
        self.confidence_var.set(0.5)
        self.confidence_label.config(text="0.5")
        self.edge_method.set("canny")
        self.canny_low.set(50)
        self.canny_high.set(150)
        
        # 필터링 설정 초기화
        if hasattr(self, 'min_face_size'):
            self.min_face_size.set(30)
            self.max_face_size.set(1000)
            self.overlap_threshold.set(0.5)
            self.quality_threshold.set(0.3)
            self.enable_filtering.set(True)
        
        # 임시 파일 정리
        self.cleanup_temp_files()
    
    def cleanup_temp_files(self):
        """임시 파일 정리"""
        temp_files = ["temp_image.jpg", "temp_output.jpg"]
        for temp_file in temp_files:
            if os.path.exists(temp_file):
                try:
                    os.remove(temp_file)
                except:
                    pass
    
    def clear_canvas(self):
        """캔버스만 깨끗하게 정리"""
        self.canvas.delete("all")
        self.canvas.configure(scrollregion=(0, 0, 0, 0))
        self.status_var.set("캔버스 정리 완료")
    
    def setup_shortcuts(self):
        """키보드 단축키 설정"""
        # 파일 관련
        self.root.bind('<Control-o>', lambda e: self.load_image())
        self.root.bind('<Control-s>', lambda e: self.save_result())
        
        # 초기화 관련
        self.root.bind('<Control-r>', lambda e: self.reset_image())
        self.root.bind('<Control-Shift-R>', lambda e: self.reset_settings())
        self.root.bind('<Control-Shift-A>', lambda e: self.reset_all())
        self.root.bind('<Control-Alt-Delete>', lambda e: self.reset_complete())
        
        # 기능 실행
        self.root.bind('<F1>', lambda e: self.detect_faces())
        self.root.bind('<F2>', lambda e: self.detect_edges())
        self.root.bind('<F3>', lambda e: self.combined_detection())
        
        # 도움말 표시
        self.root.bind('<F12>', lambda e: self.show_help())
    
    def show_help(self):
        """도움말 표시"""
        help_text = """
🔥 동물 얼굴 & 경계선 탐지기 단축키 🔥

📁 파일 관련:
  Ctrl+O : 이미지 열기
  Ctrl+S : 결과 저장

🔄 스마트 초기화 관련:
  Ctrl+R : 원본 이미지로 복원
  Ctrl+Shift+R : 설정만 초기화 (이미지 유지)
  Ctrl+Shift+A : 스마트 초기화 (이미지 유지)
  Ctrl+Alt+Del : 완전 초기화 (이미지 포함 모든 것 삭제)

🎯 기능 실행:
  F1 : 동물 얼굴 탐지
  F2 : 경계선 탐지
  F3 : 결합 처리 (얼굴+경계선)

❓ 도움말:
  F12 : 이 도움말 표시

💡 스마트 초기화 팁: 
✅ 이미지 유지: 같은 이미지로 다른 설정 실험 가능
🔄 설정 초기화: 기본값으로 빠른 리셋
🧹 임시파일 정리: 자동으로 깔끔하게 정리
⚠️ 완전 초기화: 정말 필요할 때만 사용 (위험)
        """
        messagebox.showinfo("키보드 단축키 도움말", help_text)
    
    def show_about(self):
        """프로그램 정보 표시"""
        about_text = """
🐕 동물 얼굴 & 경계선 탐지기 v1.0 🐕

📋 주요 기능:
• YOLO 기반 동물 얼굴 탐지
• 4가지 경계선 탐지 알고리즘
• 실시간 파라미터 조정
• 결합 처리 (얼굴 + 경계선)
• 완전한 초기화 시스템

🔧 지원 동물:
개, 고양이, 말, 양, 소, 코끼리, 곰, 얼룩말, 기린

⚙️ 기술 스택:
• Python 3.x
• OpenCV
• YOLOv8 (Ultralytics)
• tkinter
• PIL/Pillow
• NumPy

👨‍💻 개발: Claude Code Assistant
📅 버전: 2025.08.27
        """
        messagebox.showinfo("프로그램 정보", about_text)

def main():
    """메인 함수"""
    root = tk.Tk()
    app = AnimalFaceDetectorGUI(root)
    root.mainloop()

if __name__ == "__main__":
    main()