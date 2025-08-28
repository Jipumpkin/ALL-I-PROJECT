import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from PIL import Image, ImageTk
import os
import subprocess
import sys
from pathlib import Path

# 기존 기능들 import
from animal_face_recognition import AnimalFaceRecognition
from main import create_care_visualization, identify_dog_breed, analyze_image_with_gpt4v

class AnimalCareGUI:
    """동물 케어 통합 GUI 애플리케이션"""
    
    def __init__(self, root):
        self.root = root
        self.root.title("🐕 유기견 케어 통합 시스템")
        self.root.geometry("1000x700")
        
        # 변수 초기화
        self.selected_dog_image = None
        self.selected_space_image = None
        self.selected_activity = tk.StringVar(value="밥주기")
        
        # 동물 얼굴 인식 객체
        self.face_recognizer = AnimalFaceRecognition()
        
        self.setup_gui()
        
    def setup_gui(self):
        """GUI 구성 요소 설정"""
        # 메인 노트북 (탭) 위젯
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # 각 기능별 탭 생성
        self.create_face_recognition_tab()
        self.create_care_visualization_tab()
        self.create_image_synthesis_tab()
        self.create_settings_tab()
        
    def create_face_recognition_tab(self):
        """동물 얼굴 인식 탭"""
        frame = ttk.Frame(self.notebook)
        self.notebook.add(frame, text="🔍 유사 동물 찾기")
        
        # 제목
        title_label = ttk.Label(frame, text="동물 얼굴 인식 및 유사 동물 찾기", 
                               font=("Arial", 16, "bold"))
        title_label.pack(pady=10)
        
        # 설명
        desc_label = ttk.Label(frame, 
                              text="업로드한 동물 사진과 유사한 동물을 데이터베이스에서 찾아드립니다.",
                              font=("Arial", 10))
        desc_label.pack(pady=5)
        
        # 이미지 선택 프레임
        img_frame = ttk.LabelFrame(frame, text="이미지 선택", padding=10)
        img_frame.pack(fill=tk.X, padx=20, pady=10)
        
        self.face_query_image_label = ttk.Label(img_frame, text="선택된 이미지: 없음")
        self.face_query_image_label.pack(pady=5)
        
        ttk.Button(img_frame, text="동물 사진 선택", 
                  command=self.select_query_image).pack(pady=5)
        
        # 데이터베이스 설정 프레임
        db_frame = ttk.LabelFrame(frame, text="데이터베이스 설정", padding=10)
        db_frame.pack(fill=tk.X, padx=20, pady=10)
        
        self.db_path_label = ttk.Label(db_frame, text="데이터베이스 경로: ./data/animal_database")
        self.db_path_label.pack(pady=5)
        
        db_buttons_frame = ttk.Frame(db_frame)
        db_buttons_frame.pack(pady=5)
        
        ttk.Button(db_buttons_frame, text="데이터베이스 폴더 선택", 
                  command=self.select_database_folder).pack(side=tk.LEFT, padx=5)
        ttk.Button(db_buttons_frame, text="데이터베이스 로드", 
                  command=self.load_database).pack(side=tk.LEFT, padx=5)
        
        # 검색 설정 프레임
        search_frame = ttk.LabelFrame(frame, text="검색 설정", padding=10)
        search_frame.pack(fill=tk.X, padx=20, pady=10)
        
        # 결과 개수
        ttk.Label(search_frame, text="검색 결과 개수:").pack(anchor=tk.W)
        self.result_count = tk.IntVar(value=5)
        ttk.Scale(search_frame, from_=1, to=10, variable=self.result_count, 
                 orient=tk.HORIZONTAL).pack(fill=tk.X, pady=5)
        
        # 유사도 임계값
        ttk.Label(search_frame, text="유사도 임계값:").pack(anchor=tk.W)
        self.similarity_threshold = tk.DoubleVar(value=0.3)
        ttk.Scale(search_frame, from_=0.0, to=1.0, variable=self.similarity_threshold, 
                 orient=tk.HORIZONTAL).pack(fill=tk.X, pady=5)
        
        # 검색 버튼
        ttk.Button(frame, text="🔍 유사 동물 검색", 
                  command=self.search_similar_animals,
                  style="Accent.TButton").pack(pady=20)
        
    def create_care_visualization_tab(self):
        """케어 활동 시각화 탭"""
        frame = ttk.Frame(self.notebook)
        self.notebook.add(frame, text="💝 케어 시각화")
        
        # 제목
        title_label = ttk.Label(frame, text="유기견 케어 활동 시각화", 
                               font=("Arial", 16, "bold"))
        title_label.pack(pady=10)
        
        # 설명
        desc_label = ttk.Label(frame, 
                              text="유기견이 새 가정에서 케어받는 따뜻한 모습을 AI로 생성합니다.",
                              font=("Arial", 10))
        desc_label.pack(pady=5)
        
        # 이미지 선택 프레임
        img_frame = ttk.LabelFrame(frame, text="이미지 선택", padding=10)
        img_frame.pack(fill=tk.X, padx=20, pady=10)
        
        # 유기견 사진
        dog_frame = ttk.Frame(img_frame)
        dog_frame.pack(fill=tk.X, pady=5)
        
        self.care_dog_image_label = ttk.Label(dog_frame, text="유기견 사진: 선택안됨")
        self.care_dog_image_label.pack(side=tk.LEFT)
        ttk.Button(dog_frame, text="선택", 
                  command=self.select_dog_image_for_care).pack(side=tk.RIGHT)
        
        # 공간 사진
        space_frame = ttk.Frame(img_frame)
        space_frame.pack(fill=tk.X, pady=5)
        
        self.care_space_image_label = ttk.Label(space_frame, text="케어 공간: 선택안됨")
        self.care_space_image_label.pack(side=tk.LEFT)
        ttk.Button(space_frame, text="선택", 
                  command=self.select_space_image_for_care).pack(side=tk.RIGHT)
        
        # 케어 활동 선택 프레임
        activity_frame = ttk.LabelFrame(frame, text="케어 활동 선택", padding=10)
        activity_frame.pack(fill=tk.X, padx=20, pady=10)
        
        activities = [("🛁 목욕하기", "목욕하기"), ("🧼 씻기기", "씻기기"), ("🍽️ 밥주기", "밥주기")]
        
        for text, value in activities:
            ttk.Radiobutton(activity_frame, text=text, variable=self.selected_activity, 
                           value=value).pack(anchor=tk.W, pady=2)
        
        # 생성 버튼
        ttk.Button(frame, text="🎨 케어 시각화 생성", 
                  command=self.generate_care_visualization,
                  style="Accent.TButton").pack(pady=20)
        
    def create_image_synthesis_tab(self):
        """이미지 합성 탭"""
        frame = ttk.Frame(self.notebook)
        self.notebook.add(frame, text="🖼️ 이미지 합성")
        
        # 제목
        title_label = ttk.Label(frame, text="유기견 + 배경 이미지 합성", 
                               font=("Arial", 16, "bold"))
        title_label.pack(pady=10)
        
        # 설명
        desc_label = ttk.Label(frame, 
                              text="유기견을 원하는 배경에 자연스럽게 합성합니다.",
                              font=("Arial", 10))
        desc_label.pack(pady=5)
        
        # 이미지 선택 프레임
        img_frame = ttk.LabelFrame(frame, text="이미지 선택", padding=10)
        img_frame.pack(fill=tk.X, padx=20, pady=10)
        
        # 유기견 사진
        dog_frame = ttk.Frame(img_frame)
        dog_frame.pack(fill=tk.X, pady=5)
        
        self.synth_dog_image_label = ttk.Label(dog_frame, text="유기견 사진: 선택안됨")
        self.synth_dog_image_label.pack(side=tk.LEFT)
        ttk.Button(dog_frame, text="선택", 
                  command=self.select_dog_image_for_synthesis).pack(side=tk.RIGHT)
        
        # 배경 사진
        bg_frame = ttk.Frame(img_frame)
        bg_frame.pack(fill=tk.X, pady=5)
        
        self.synth_bg_image_label = ttk.Label(bg_frame, text="배경 이미지: 선택안됨")
        self.synth_bg_image_label.pack(side=tk.LEFT)
        ttk.Button(bg_frame, text="선택", 
                  command=self.select_background_image).pack(side=tk.RIGHT)
        
        # 합성 버튼
        ttk.Button(frame, text="🎨 이미지 합성", 
                  command=self.synthesize_images,
                  style="Accent.TButton").pack(pady=20)
        
    def create_settings_tab(self):
        """설정 탭"""
        frame = ttk.Frame(self.notebook)
        self.notebook.add(frame, text="⚙️ 설정")
        
        # 제목
        title_label = ttk.Label(frame, text="시스템 설정", 
                               font=("Arial", 16, "bold"))
        title_label.pack(pady=10)
        
        # API 키 설정
        api_frame = ttk.LabelFrame(frame, text="OpenAI API 설정", padding=10)
        api_frame.pack(fill=tk.X, padx=20, pady=10)
        
        ttk.Label(api_frame, text="API 키 상태:").pack(anchor=tk.W)
        self.api_status_label = ttk.Label(api_frame, text="확인 중...", foreground="orange")
        self.api_status_label.pack(anchor=tk.W, pady=5)
        
        ttk.Button(api_frame, text="API 키 확인", 
                  command=self.check_api_key).pack(pady=5)
        
        # 정보
        info_frame = ttk.LabelFrame(frame, text="시스템 정보", padding=10)
        info_frame.pack(fill=tk.X, padx=20, pady=10)
        
        info_text = """
        • 동물 얼굴 인식: OpenCV + 히스토그램 + HOG 특징
        • 케어 시각화: DALL-E 3 + GPT-4V 분석
        • 이미지 합성: AI 기반 자연스러운 합성
        
        지원 파일 형식: JPG, JPEG, PNG, BMP
        """
        
        ttk.Label(info_frame, text=info_text, justify=tk.LEFT).pack(anchor=tk.W)
        
    # 이벤트 핸들러 메서드들
    def select_query_image(self):
        """쿼리 이미지 선택"""
        file_path = filedialog.askopenfilename(
            title="동물 사진 선택",
            filetypes=[("이미지 파일", "*.jpg *.jpeg *.png *.bmp"), ("모든 파일", "*.*")]
        )
        if file_path:
            self.query_image_path = file_path
            self.face_query_image_label.config(text=f"선택된 이미지: {Path(file_path).name}")
            
    def select_database_folder(self):
        """데이터베이스 폴더 선택"""
        folder_path = filedialog.askdirectory(title="동물 데이터베이스 폴더 선택")
        if folder_path:
            self.database_folder = folder_path
            self.db_path_label.config(text=f"데이터베이스 경로: {folder_path}")
            
    def load_database(self):
        """데이터베이스 로드"""
        try:
            if hasattr(self, 'database_folder'):
                folder = self.database_folder
            else:
                folder = "./data/animal_database"
                os.makedirs(folder, exist_ok=True)
                
            success = self.face_recognizer.load_animal_database(folder)
            if success:
                messagebox.showinfo("성공", f"데이터베이스가 성공적으로 로드되었습니다.\n총 {len(self.face_recognizer.animal_database)}개의 동물 이미지")
            else:
                messagebox.showwarning("경고", "데이터베이스를 로드할 수 없습니다.\n폴더에 이미지 파일이 있는지 확인해주세요.")
                
        except Exception as e:
            messagebox.showerror("오류", f"데이터베이스 로드 중 오류가 발생했습니다:\n{e}")
            
    def search_similar_animals(self):
        """유사 동물 검색"""
        if not hasattr(self, 'query_image_path'):
            messagebox.showwarning("경고", "먼저 동물 사진을 선택해주세요.")
            return
            
        if not self.face_recognizer.animal_database:
            messagebox.showwarning("경고", "먼저 데이터베이스를 로드해주세요.")
            return
            
        try:
            similar_animals = self.face_recognizer.find_similar_animals(
                self.query_image_path,
                top_n=self.result_count.get(),
                similarity_threshold=self.similarity_threshold.get()
            )
            
            if similar_animals:
                self.face_recognizer.display_results(self.query_image_path, similar_animals)
                messagebox.showinfo("완료", f"{len(similar_animals)}마리의 유사한 동물을 찾았습니다!")
            else:
                messagebox.showinfo("결과", "설정된 유사도 임계값에 해당하는 동물을 찾을 수 없습니다.\n임계값을 낮춰보세요.")
                
        except Exception as e:
            messagebox.showerror("오류", f"검색 중 오류가 발생했습니다:\n{e}")
            
    def select_dog_image_for_care(self):
        """케어용 유기견 이미지 선택"""
        file_path = filedialog.askopenfilename(
            title="유기견 사진 선택",
            filetypes=[("이미지 파일", "*.jpg *.jpeg *.png *.bmp"), ("모든 파일", "*.*")]
        )
        if file_path:
            self.care_dog_image = file_path
            self.care_dog_image_label.config(text=f"유기견 사진: {Path(file_path).name}")
            
    def select_space_image_for_care(self):
        """케어용 공간 이미지 선택"""
        file_path = filedialog.askopenfilename(
            title="케어 공간 사진 선택",
            filetypes=[("이미지 파일", "*.jpg *.jpeg *.png *.bmp"), ("모든 파일", "*.*")]
        )
        if file_path:
            self.care_space_image = file_path
            self.care_space_image_label.config(text=f"케어 공간: {Path(file_path).name}")
            
    def generate_care_visualization(self):
        """케어 시각화 생성"""
        if not hasattr(self, 'care_dog_image'):
            messagebox.showwarning("경고", "유기견 사진을 선택해주세요.")
            return
            
        if not hasattr(self, 'care_space_image'):
            messagebox.showwarning("경고", "케어 공간 사진을 선택해주세요.")
            return
            
        try:
            # 별도 스크립트로 실행 (main.py 기능 활용)
            messagebox.showinfo("시작", f"'{self.selected_activity.get()}' 케어 시각화를 생성합니다.\n잠시만 기다려주세요...")
            
            # 여기서 main.py의 기능을 호출하거나 별도 프로세스로 실행
            subprocess.Popen([
                sys.executable, "main.py",
                "--dog", self.care_dog_image,
                "--space", self.care_space_image,
                "--activity", self.selected_activity.get()
            ])
            
        except Exception as e:
            messagebox.showerror("오류", f"케어 시각화 생성 중 오류가 발생했습니다:\n{e}")
            
    def select_dog_image_for_synthesis(self):
        """합성용 유기견 이미지 선택"""
        file_path = filedialog.askopenfilename(
            title="유기견 사진 선택",
            filetypes=[("이미지 파일", "*.jpg *.jpeg *.png *.bmp"), ("모든 파일", "*.*")]
        )
        if file_path:
            self.synth_dog_image = file_path
            self.synth_dog_image_label.config(text=f"유기견 사진: {Path(file_path).name}")
            
    def select_background_image(self):
        """배경 이미지 선택"""
        file_path = filedialog.askopenfilename(
            title="배경 이미지 선택",
            filetypes=[("이미지 파일", "*.jpg *.jpeg *.png *.bmp"), ("모든 파일", "*.*")]
        )
        if file_path:
            self.synth_bg_image = file_path
            self.synth_bg_image_label.config(text=f"배경 이미지: {Path(file_path).name}")
            
    def synthesize_images(self):
        """이미지 합성"""
        if not hasattr(self, 'synth_dog_image'):
            messagebox.showwarning("경고", "유기견 사진을 선택해주세요.")
            return
            
        if not hasattr(self, 'synth_bg_image'):
            messagebox.showwarning("경고", "배경 이미지를 선택해주세요.")
            return
            
        try:
            messagebox.showinfo("시작", "이미지 합성을 시작합니다.\n잠시만 기다려주세요...")
            
            # 이미지 합성 로직 (main.py의 타겟 이미지 합성 기능 활용)
            # 실제로는 main.py의 함수를 호출하거나 별도 프로세스로 실행
            
        except Exception as e:
            messagebox.showerror("오류", f"이미지 합성 중 오류가 발생했습니다:\n{e}")
            
    def check_api_key(self):
        """API 키 확인"""
        try:
            import os
            from dotenv import load_dotenv
            load_dotenv()
            
            api_key = os.getenv('OPENAI_API_KEY')
            if api_key and len(api_key) > 10:
                self.api_status_label.config(text="✅ API 키 설정됨", foreground="green")
            else:
                self.api_status_label.config(text="❌ API 키 없음", foreground="red")
                messagebox.showwarning("경고", ".env 파일에 OPENAI_API_KEY를 설정해주세요.")
                
        except Exception as e:
            self.api_status_label.config(text="❌ 확인 실패", foreground="red")
            messagebox.showerror("오류", f"API 키 확인 중 오류:\n{e}")

def main():
    """메인 함수"""
    root = tk.Tk()
    
    # 테마 설정 (가능한 경우)
    try:
        # Windows 스타일 적용
        style = ttk.Style()
        available_themes = style.theme_names()
        if 'winnative' in available_themes:
            style.theme_use('winnative')
        elif 'clam' in available_themes:
            style.theme_use('clam')
            
        # 강조 버튼 스타일 생성
        style.configure('Accent.TButton', foreground='white', background='#0078D4')
        
    except Exception:
        pass  # 테마 설정 실패해도 계속 진행
    
    app = AnimalCareGUI(root)
    root.mainloop()

if __name__ == "__main__":
    main()