#!/usr/bin/env python3
"""
통합 동물 인식 GUI - Hugging Face 모델과 기존 기능들을 모두 포함
"""
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import threading
import time
from pathlib import Path

# 라이브러리 사용 가능 여부 확인
TRANSFORMERS_AVAILABLE = False
CV2_AVAILABLE = False

try:
    from transformers import pipeline
    from PIL import Image, ImageTk
    import torch
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    pass

try:
    import cv2
    import numpy as np
    from sklearn.metrics.pairwise import cosine_similarity
    CV2_AVAILABLE = True
except ImportError:
    pass

class IntegratedAnimalGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("통합 동물 인식 시스템")
        self.root.geometry("800x700")
        
        # 모델 저장
        self.huggingface_classifier = None
        self.face_recognition_system = None
        self.face_detector = None
        
        self.setup_gui()
        self.setup_models()
    
    def setup_gui(self):
        """GUI 구성"""
        # 제목
        title = tk.Label(self.root, text="통합 동물 인식 시스템", 
                        font=("Arial", 18, "bold"))
        title.pack(pady=10)
        
        # 탭 구성
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # 탭들 생성
        self.create_huggingface_tab()
        self.create_face_detection_tab()
        self.create_face_recognition_tab() 
        self.create_image_synthesis_tab()
        self.create_about_tab()
        
        # 상태바
        self.status_label = tk.Label(self.root, text="시스템 초기화 중...", 
                                   relief=tk.SUNKEN, anchor=tk.W)
        self.status_label.pack(side=tk.BOTTOM, fill=tk.X)
    
    def create_huggingface_tab(self):
        """Hugging Face 동물 분류 탭"""
        tab = ttk.Frame(self.notebook)
        self.notebook.add(tab, text="AI 동물 분류")
        
        # 설명
        desc = tk.Label(tab, text="Hugging Face Vision Transformer를 사용한 동물 이미지 분류", 
                       font=("Arial", 12), fg="blue")
        desc.pack(pady=10)
        
        # 이미지 선택 버튼
        btn_frame = tk.Frame(tab)
        btn_frame.pack(pady=10)
        
        self.hf_select_btn = tk.Button(btn_frame, text="이미지 선택", 
                                      command=self.select_hf_image,
                                      bg="#4CAF50", fg="white", font=("Arial", 12))
        self.hf_select_btn.pack(side=tk.LEFT, padx=5)
        
        self.hf_analyze_btn = tk.Button(btn_frame, text="분석 시작", 
                                       command=self.analyze_hf_image,
                                       bg="#2196F3", fg="white", font=("Arial", 12))
        self.hf_analyze_btn.pack(side=tk.LEFT, padx=5)
        
        # 이미지 표시 영역
        self.hf_image_frame = tk.Frame(tab, bg="#f0f0f0", width=300, height=300)
        self.hf_image_frame.pack(pady=10)
        self.hf_image_frame.pack_propagate(False)
        
        self.hf_image_label = tk.Label(self.hf_image_frame, text="이미지를 선택해주세요", 
                                      bg="#f0f0f0")
        self.hf_image_label.pack(expand=True)
        
        # 결과 표시 영역
        result_frame = tk.Frame(tab)
        result_frame.pack(fill=tk.BOTH, expand=True, pady=10)
        
        tk.Label(result_frame, text="분석 결과:", font=("Arial", 12, "bold")).pack(anchor=tk.W)
        
        # 스크롤바 있는 텍스트 위젯
        text_frame = tk.Frame(result_frame)
        text_frame.pack(fill=tk.BOTH, expand=True)
        
        self.hf_result_text = tk.Text(text_frame, height=12, font=("Arial", 10))
        scrollbar = tk.Scrollbar(text_frame, orient=tk.VERTICAL, command=self.hf_result_text.yview)
        self.hf_result_text.configure(yscrollcommand=scrollbar.set)
        
        self.hf_result_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # 선택된 이미지 경로 저장
        self.selected_hf_image = None
    
    def create_face_detection_tab(self):
        """동물 얼굴 탐지 탭"""
        tab = ttk.Frame(self.notebook)
        self.notebook.add(tab, text="얼굴 탐지")
        
        desc = tk.Label(tab, text="다양한 방법으로 동물 얼굴과 특징을 탐지합니다", 
                       font=("Arial", 12), fg="red")
        desc.pack(pady=10)
        
        # 탐지 방법 선택
        method_frame = tk.LabelFrame(tab, text="탐지 방법 선택", font=("Arial", 10, "bold"))
        method_frame.pack(fill=tk.X, padx=10, pady=10)
        
        self.detection_method = tk.StringVar(value="haar")
        
        methods = [
            ("Haar Cascade", "haar"),
            ("윤곽선 분석", "contour"), 
            ("MTCNN", "mtcnn"),
            ("동물 특징 탐지", "features")
        ]
        
        for i, (text, value) in enumerate(methods):
            tk.Radiobutton(method_frame, text=text, variable=self.detection_method, 
                          value=value, font=("Arial", 10)).grid(row=0, column=i, padx=10, pady=5)
        
        # 버튼들
        btn_frame = tk.Frame(tab)
        btn_frame.pack(pady=10)
        
        self.detect_select_btn = tk.Button(btn_frame, text="이미지 선택", 
                                          command=self.select_detection_image,
                                          bg="#E91E63", fg="white", font=("Arial", 12))
        self.detect_select_btn.pack(side=tk.LEFT, padx=5)
        
        self.detect_start_btn = tk.Button(btn_frame, text="얼굴 탐지 시작", 
                                         command=self.start_face_detection,
                                         bg="#9C27B0", fg="white", font=("Arial", 12))
        self.detect_start_btn.pack(side=tk.LEFT, padx=5)
        
        self.detect_save_btn = tk.Button(btn_frame, text="결과 저장", 
                                        command=self.save_detection_result,
                                        bg="#607D8B", fg="white", font=("Arial", 12))
        self.detect_save_btn.pack(side=tk.LEFT, padx=5)
        
        # 결과 표시 영역 (좌우 분할)
        result_main_frame = tk.Frame(tab)
        result_main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # 원본 이미지 표시
        left_frame = tk.Frame(result_main_frame)
        left_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=5)
        
        tk.Label(left_frame, text="원본 이미지:", font=("Arial", 10, "bold")).pack(anchor=tk.W)
        self.original_image_frame = tk.Frame(left_frame, bg="#f0f0f0", width=300, height=200)
        self.original_image_frame.pack(fill=tk.BOTH, expand=True)
        self.original_image_frame.pack_propagate(False)
        
        self.original_image_label = tk.Label(self.original_image_frame, text="이미지를 선택해주세요", 
                                           bg="#f0f0f0")
        self.original_image_label.pack(expand=True)
        
        # 탐지 결과 이미지 표시
        right_frame = tk.Frame(result_main_frame)
        right_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=5)
        
        tk.Label(right_frame, text="탐지 결과:", font=("Arial", 10, "bold")).pack(anchor=tk.W)
        self.detection_result_frame = tk.Frame(right_frame, bg="#f0f0f0", width=300, height=200)
        self.detection_result_frame.pack(fill=tk.BOTH, expand=True)
        self.detection_result_frame.pack_propagate(False)
        
        self.detection_result_label = tk.Label(self.detection_result_frame, text="탐지 결과가 여기 표시됩니다", 
                                             bg="#f0f0f0")
        self.detection_result_label.pack(expand=True)
        
        # 텍스트 결과 표시
        text_result_frame = tk.Frame(tab)
        text_result_frame.pack(fill=tk.X, padx=10, pady=10)
        
        tk.Label(text_result_frame, text="탐지 상세 정보:", font=("Arial", 10, "bold")).pack(anchor=tk.W)
        
        self.detection_text_result = tk.Text(text_result_frame, height=8, font=("Arial", 9))
        detection_scrollbar = tk.Scrollbar(text_result_frame, orient=tk.VERTICAL, 
                                         command=self.detection_text_result.yview)
        self.detection_text_result.configure(yscrollcommand=detection_scrollbar.set)
        
        self.detection_text_result.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        detection_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # 변수 초기화
        self.selected_detection_image = None
        self.current_detection_result = None
    
    def create_face_recognition_tab(self):
        """동물 얼굴 인식 탭"""
        tab = ttk.Frame(self.notebook)
        self.notebook.add(tab, text="얼굴 인식 검색")
        
        desc = tk.Label(tab, text="동물 얼굴 특징을 분석하여 유사한 동물을 찾습니다", 
                       font=("Arial", 12), fg="green")
        desc.pack(pady=10)
        
        # 버튼들
        btn_frame = tk.Frame(tab)
        btn_frame.pack(pady=10)
        
        tk.Button(btn_frame, text="검색할 이미지 선택", 
                 command=self.select_face_image,
                 bg="#FF9800", fg="white").pack(side=tk.LEFT, padx=5)
        
        tk.Button(btn_frame, text="데이터베이스 폴더 선택", 
                 command=self.select_database_folder,
                 bg="#9C27B0", fg="white").pack(side=tk.LEFT, padx=5)
        
        tk.Button(btn_frame, text="유사 이미지 검색", 
                 command=self.search_similar_faces,
                 bg="#F44336", fg="white").pack(side=tk.LEFT, padx=5)
        
        # 결과 표시
        self.face_result_text = tk.Text(tab, height=20, font=("Arial", 10))
        self.face_result_text.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # 선택된 경로들 저장
        self.selected_face_image = None
        self.selected_database_folder = None
    
    def create_image_synthesis_tab(self):
        """이미지 합성 탭"""
        tab = ttk.Frame(self.notebook)
        self.notebook.add(tab, text="이미지 합성")
        
        desc = tk.Label(tab, text="동물과 배경을 합성하여 새로운 이미지를 생성합니다", 
                       font=("Arial", 12), fg="purple")
        desc.pack(pady=10)
        
        # 설정 영역
        settings_frame = tk.LabelFrame(tab, text="합성 설정", font=("Arial", 11, "bold"))
        settings_frame.pack(fill=tk.X, padx=10, pady=10)
        
        # 활동 선택
        tk.Label(settings_frame, text="활동 선택:", font=("Arial", 10)).grid(row=0, column=0, sticky=tk.W, padx=5, pady=5)
        self.activity_var = tk.StringVar(value="밥주기")
        activity_combo = ttk.Combobox(settings_frame, textvariable=self.activity_var,
                                    values=["밥주기", "산책하기", "놀아주기", "목욕시키기", "잠자기"])
        activity_combo.grid(row=0, column=1, padx=5, pady=5)
        
        # 파일 선택 버튼들
        tk.Button(settings_frame, text="동물 이미지 선택", 
                 command=self.select_animal_image,
                 bg="#4CAF50", fg="white").grid(row=1, column=0, padx=5, pady=5)
        
        tk.Button(settings_frame, text="배경 이미지 선택", 
                 command=self.select_background_image,
                 bg="#2196F3", fg="white").grid(row=1, column=1, padx=5, pady=5)
        
        tk.Button(settings_frame, text="합성 시작", 
                 command=self.start_synthesis,
                 bg="#FF5722", fg="white").grid(row=1, column=2, padx=5, pady=5)
        
        # 결과 표시
        self.synthesis_result_text = tk.Text(tab, height=15, font=("Arial", 10))
        self.synthesis_result_text.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # 선택된 파일들
        self.selected_animal_image = None
        self.selected_background_image = None
    
    def create_about_tab(self):
        """정보 탭"""
        tab = ttk.Frame(self.notebook)
        self.notebook.add(tab, text="시스템 정보")
        
        info_text = """
통합 동물 인식 시스템

주요 기능:
1. AI 동물 분류: Hugging Face Vision Transformer 모델 사용
2. 얼굴 탐지: OpenCV, MTCNN을 활용한 동물 얼굴 탐지
3. 얼굴 인식 검색: OpenCV 기반 동물 얼굴 특징 분석
4. 이미지 합성: DALL-E API를 활용한 동물 케어 시나리오 생성

사용된 기술:
- Hugging Face Transformers
- OpenCV
- PIL (Python Imaging Library)
- scikit-learn
- Tkinter GUI

개발 정보:
- Python 기반 데스크톱 애플리케이션
- 실시간 이미지 처리 및 분석
- 모듈화된 구조로 확장 가능

시스템 상태:
"""
        
        # 라이브러리 상태 추가
        if TRANSFORMERS_AVAILABLE:
            info_text += "OK Transformers 라이브러리: 사용 가능\n"
        else:
            info_text += "X Transformers 라이브러리: 설치 필요\n"
            
        if CV2_AVAILABLE:
            info_text += "OK OpenCV 라이브러리: 사용 가능\n"
        else:
            info_text += "X OpenCV 라이브러리: 설치 필요\n"
        
        info_label = tk.Label(tab, text=info_text, justify=tk.LEFT, 
                             font=("Arial", 10), anchor=tk.NW)
        info_label.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
    
    def setup_models(self):
        """백그라운드에서 모델 초기화"""
        def load_models():
            try:
                if TRANSFORMERS_AVAILABLE:
                    self.status_label.config(text="AI 모델 로딩 중...")
                    self.root.update()
                    
                    # Vision Transformer 모델 로드
                    self.huggingface_classifier = pipeline(
                        "image-classification",
                        model="google/vit-base-patch16-224",
                        device=-1  # CPU 사용
                    )
                    
                self.status_label.config(text="시스템 준비 완료")
                
            except Exception as e:
                self.status_label.config(text=f"모델 로딩 실패: {e}")
        
        # 백그라운드 스레드에서 모델 로딩
        thread = threading.Thread(target=load_models)
        thread.daemon = True
        thread.start()
    
    def select_hf_image(self):
        """Hugging Face용 이미지 선택"""
        file_path = filedialog.askopenfilename(
            title="동물 이미지 선택",
            filetypes=[("이미지 파일", "*.jpg *.jpeg *.png *.bmp"), ("모든 파일", "*.*")]
        )
        
        if file_path:
            self.selected_hf_image = file_path
            
            # 이미지 표시
            try:
                image = Image.open(file_path)
                # 크기 조정
                image.thumbnail((280, 280), Image.Resampling.LANCZOS)
                photo = ImageTk.PhotoImage(image)
                self.hf_image_label.config(image=photo, text="")
                self.hf_image_label.image = photo  # 참조 유지
                
                self.hf_result_text.delete(1.0, tk.END)
                self.hf_result_text.insert(tk.END, f"선택된 파일: {Path(file_path).name}\n")
                self.hf_result_text.insert(tk.END, f"이미지 크기: {Image.open(file_path).size}\n\n")
                
            except Exception as e:
                messagebox.showerror("오류", f"이미지 로드 실패: {e}")
    
    def analyze_hf_image(self):
        """Hugging Face 모델로 이미지 분석"""
        if not self.selected_hf_image:
            messagebox.showwarning("경고", "먼저 이미지를 선택해주세요.")
            return
        
        if not TRANSFORMERS_AVAILABLE or not self.huggingface_classifier:
            messagebox.showerror("오류", "AI 모델이 로드되지 않았습니다.")
            return
        
        def analyze():
            try:
                self.status_label.config(text="이미지 분석 중...")
                self.root.update()
                
                # 이미지 로드 및 분석
                image = Image.open(self.selected_hf_image)
                start_time = time.time()
                results = self.huggingface_classifier(image)
                end_time = time.time()
                
                # 결과 표시
                self.hf_result_text.insert(tk.END, f"분석 완료! (소요시간: {end_time - start_time:.2f}초)\n")
                self.hf_result_text.insert(tk.END, "=" * 50 + "\n")
                self.hf_result_text.insert(tk.END, "예측 결과 (상위 10개):\n\n")
                
                # 동물 관련 키워드
                animal_keywords = ['dog', 'cat', 'puppy', 'kitten', 'animal', 'pet', 
                                 'labrador', 'retriever', 'terrier', 'spaniel', 'beagle',
                                 'pug', 'bulldog', 'shepherd', 'hound', 'pointer']
                
                for i, result in enumerate(results[:10], 1):
                    label = result['label']
                    score = result['score'] * 100
                    marker = " <<<< 동물 관련!" if any(keyword in label.lower() for keyword in animal_keywords) else ""
                    
                    self.hf_result_text.insert(tk.END, f"{i:2d}. {label}: {score:.2f}%{marker}\n")
                
                self.hf_result_text.insert(tk.END, "\n" + "=" * 50 + "\n")
                
                # 최고 예측 결과 강조
                best_result = results[0]
                self.hf_result_text.insert(tk.END, f"최고 예측: {best_result['label']} ({best_result['score']*100:.2f}%)\n\n")
                
                # 자동 스크롤
                self.hf_result_text.see(tk.END)
                
                self.status_label.config(text="분석 완료")
                
            except Exception as e:
                messagebox.showerror("오류", f"분석 실패: {e}")
                self.status_label.config(text="분석 실패")
        
        # 백그라운드에서 분석 실행
        thread = threading.Thread(target=analyze)
        thread.daemon = True
        thread.start()
    
    def select_face_image(self):
        """얼굴 인식용 이미지 선택"""
        file_path = filedialog.askopenfilename(
            title="검색할 동물 이미지 선택",
            filetypes=[("이미지 파일", "*.jpg *.jpeg *.png *.bmp"), ("모든 파일", "*.*")]
        )
        
        if file_path:
            self.selected_face_image = file_path
            self.face_result_text.insert(tk.END, f"검색 이미지 선택: {Path(file_path).name}\n")
    
    def select_database_folder(self):
        """데이터베이스 폴더 선택"""
        folder_path = filedialog.askdirectory(title="동물 이미지 데이터베이스 폴더 선택")
        
        if folder_path:
            self.selected_database_folder = folder_path
            # 폴더 내 이미지 파일 개수 확인
            image_files = list(Path(folder_path).glob("*.jpg")) + list(Path(folder_path).glob("*.png"))
            self.face_result_text.insert(tk.END, f"데이터베이스 폴더: {folder_path}\n")
            self.face_result_text.insert(tk.END, f"발견된 이미지: {len(image_files)}개\n\n")
    
    def search_similar_faces(self):
        """유사한 얼굴 검색"""
        if not self.selected_face_image or not self.selected_database_folder:
            messagebox.showwarning("경고", "검색 이미지와 데이터베이스 폴더를 모두 선택해주세요.")
            return
        
        if not CV2_AVAILABLE:
            messagebox.showerror("오류", "OpenCV가 설치되지 않았습니다.")
            return
        
        self.face_result_text.insert(tk.END, "얼굴 유사도 검색 시작...\n")
        self.face_result_text.insert(tk.END, "(이 기능은 데모 버전입니다)\n\n")
        
        # 실제 구현은 더 복잡하지만, 데모용 간단 버전
        database_path = Path(self.selected_database_folder)
        image_files = list(database_path.glob("*.jpg")) + list(database_path.glob("*.png"))
        
        self.face_result_text.insert(tk.END, f"총 {len(image_files)}개 이미지에서 검색 중...\n")
        self.face_result_text.insert(tk.END, "검색 완료! (실제 구현 시 OpenCV 특징점 매칭 수행)\n\n")
    
    def select_animal_image(self):
        """동물 이미지 선택"""
        file_path = filedialog.askopenfilename(
            title="동물 이미지 선택",
            filetypes=[("이미지 파일", "*.jpg *.jpeg *.png *.bmp")]
        )
        
        if file_path:
            self.selected_animal_image = file_path
            self.synthesis_result_text.insert(tk.END, f"동물 이미지: {Path(file_path).name}\n")
    
    def select_background_image(self):
        """배경 이미지 선택"""
        file_path = filedialog.askopenfilename(
            title="배경 이미지 선택",
            filetypes=[("이미지 파일", "*.jpg *.jpeg *.png *.bmp")]
        )
        
        if file_path:
            self.selected_background_image = file_path
            self.synthesis_result_text.insert(tk.END, f"배경 이미지: {Path(file_path).name}\n")
    
    def start_synthesis(self):
        """이미지 합성 시작"""
        if not self.selected_animal_image:
            messagebox.showwarning("경고", "동물 이미지를 선택해주세요.")
            return
        
        activity = self.activity_var.get()
        self.synthesis_result_text.insert(tk.END, f"\n합성 작업 시작: {activity}\n")
        self.synthesis_result_text.insert(tk.END, "실제 구현 시 DALL-E API나 Stable Diffusion을 사용합니다.\n")
        self.synthesis_result_text.insert(tk.END, "(현재는 데모 모드)\n\n")
    
    def select_detection_image(self):
        """얼굴 탐지용 이미지 선택"""
        file_path = filedialog.askopenfilename(
            title="얼굴 탐지할 동물 이미지 선택",
            filetypes=[("이미지 파일", "*.jpg *.jpeg *.png *.bmp"), ("모든 파일", "*.*")]
        )
        
        if file_path:
            self.selected_detection_image = file_path
            
            # 원본 이미지 표시
            try:
                image = Image.open(file_path)
                # 크기 조정
                image.thumbnail((280, 180), Image.Resampling.LANCZOS)
                photo = ImageTk.PhotoImage(image)
                self.original_image_label.config(image=photo, text="")
                self.original_image_label.image = photo  # 참조 유지
                
                self.detection_text_result.delete(1.0, tk.END)
                self.detection_text_result.insert(tk.END, f"선택된 파일: {Path(file_path).name}\n")
                self.detection_text_result.insert(tk.END, f"이미지 크기: {Image.open(file_path).size}\n\n")
                
                # 탐지 결과 영역 초기화
                self.detection_result_label.config(image="", text="탐지 결과가 여기 표시됩니다")
                if hasattr(self.detection_result_label, 'image'):
                    self.detection_result_label.image = None
                
            except Exception as e:
                messagebox.showerror("오류", f"이미지 로드 실패: {e}")
    
    def start_face_detection(self):
        """얼굴 탐지 시작"""
        if not self.selected_detection_image:
            messagebox.showwarning("경고", "먼저 이미지를 선택해주세요.")
            return
        
        def detect():
            try:
                # 얼굴 탐지기 초기화 (필요시)
                if not self.face_detector:
                    from animal_face_detector import AnimalFaceDetector
                    self.face_detector = AnimalFaceDetector()
                
                self.status_label.config(text="얼굴 탐지 중...")
                self.root.update()
                
                method = self.detection_method.get()
                
                if method == "features":
                    # 동물 특징 탐지
                    result_image, features = self.face_detector.detect_animal_features(self.selected_detection_image)
                    if result_image is not None:
                        self.display_detection_result(result_image, [], features)
                        summary = self.face_detector.get_detection_summary([], features)
                    else:
                        raise Exception(features)  # features가 오류 메시지
                elif method == "mtcnn":
                    # MTCNN 탐지
                    result_image, faces = self.face_detector.detect_faces_mtcnn(self.selected_detection_image)
                    if result_image is not None:
                        self.display_detection_result(result_image, faces)
                        summary = self.face_detector.get_detection_summary(faces)
                    else:
                        raise Exception(faces)  # faces가 오류 메시지
                else:
                    # OpenCV 기반 탐지 (haar 또는 contour)
                    result_image, faces = self.face_detector.detect_faces_opencv(self.selected_detection_image, method=method)
                    if result_image is not None:
                        self.display_detection_result(result_image, faces)
                        summary = self.face_detector.get_detection_summary(faces)
                    else:
                        raise Exception(faces)  # faces가 오류 메시지
                
                # 결과 텍스트 표시
                self.detection_text_result.insert(tk.END, f"탐지 방법: {method}\n")
                self.detection_text_result.insert(tk.END, summary)
                self.detection_text_result.insert(tk.END, "\n" + "="*50 + "\n")
                self.detection_text_result.see(tk.END)
                
                self.status_label.config(text="얼굴 탐지 완료")
                
            except Exception as e:
                messagebox.showerror("오류", f"얼굴 탐지 실패: {e}")
                self.status_label.config(text="얼굴 탐지 실패")
        
        # 백그라운드에서 탐지 실행
        thread = threading.Thread(target=detect)
        thread.daemon = True
        thread.start()
    
    def display_detection_result(self, result_image, faces=None, features=None):
        """탐지 결과 이미지 표시"""
        try:
            # OpenCV 이미지를 PIL로 변환
            if result_image.dtype == 'uint8':
                # BGR을 RGB로 변환
                result_image_rgb = cv2.cvtColor(result_image, cv2.COLOR_BGR2RGB)
            else:
                result_image_rgb = result_image
            
            # PIL Image로 변환
            pil_image = Image.fromarray(result_image_rgb)
            
            # 크기 조정
            pil_image.thumbnail((280, 180), Image.Resampling.LANCZOS)
            
            # Tkinter PhotoImage로 변환
            photo = ImageTk.PhotoImage(pil_image)
            
            # 표시
            self.detection_result_label.config(image=photo, text="")
            self.detection_result_label.image = photo  # 참조 유지
            
            # 현재 결과 저장 (나중에 저장하기 위해)
            self.current_detection_result = result_image
            
        except Exception as e:
            print(f"결과 이미지 표시 오류: {e}")
            self.detection_result_label.config(text=f"이미지 표시 오류: {e}")
    
    def save_detection_result(self):
        """탐지 결과 저장"""
        if self.current_detection_result is None:
            messagebox.showwarning("경고", "저장할 탐지 결과가 없습니다.")
            return
        
        file_path = filedialog.asksaveasfilename(
            title="탐지 결과 저장",
            defaultextension=".jpg",
            filetypes=[("JPEG 파일", "*.jpg"), ("PNG 파일", "*.png"), ("모든 파일", "*.*")]
        )
        
        if file_path:
            try:
                success = self.face_detector.save_result_image(self.current_detection_result, file_path)
                if success:
                    messagebox.showinfo("성공", f"결과가 저장되었습니다:\n{file_path}")
                    self.detection_text_result.insert(tk.END, f"결과 저장: {Path(file_path).name}\n")
                else:
                    messagebox.showerror("오류", "파일 저장에 실패했습니다.")
            except Exception as e:
                messagebox.showerror("오류", f"저장 중 오류: {e}")

def main():
    # 라이브러리 상태 확인
    print("통합 동물 인식 시스템 시작")
    print("=" * 50)
    
    if TRANSFORMERS_AVAILABLE:
        print("OK Transformers 라이브러리 사용 가능")
    else:
        print("X Transformers 라이브러리 없음 (pip install transformers)")
    
    if CV2_AVAILABLE:
        print("OK OpenCV 라이브러리 사용 가능")  
    else:
        print("X OpenCV 라이브러리 없음 (pip install opencv-python)")
    
    print("=" * 50)
    
    # GUI 시작
    root = tk.Tk()
    app = IntegratedAnimalGUI(root)
    root.mainloop()

if __name__ == "__main__":
    main()