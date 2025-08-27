#!/usr/bin/env python3
"""
Hugging Face 동물 분류 모델 테스트 스크립트
"""
import os
import sys
from pathlib import Path
import time

def check_dependencies():
    """필요한 라이브러리 확인"""
    print("필요한 라이브러리 확인 중...")
    
    try:
        import torch
        print(f"OK PyTorch: {torch.__version__}")
    except ImportError:
        print("X PyTorch가 설치되지 않았습니다.")
        print("설치: pip install torch torchvision")
        return False
    
    try:
        import transformers
        print(f"OK Transformers: {transformers.__version__}")
    except ImportError:
        print("X Transformers가 설치되지 않았습니다.")
        print("설치: pip install transformers")
        return False
    
    try:
        from PIL import Image
        print("OK Pillow: 이미지 처리 준비")
    except ImportError:
        print("X Pillow가 설치되지 않았습니다.")
        print("설치: pip install pillow")
        return False
    
    return True

def download_sample_images():
    """샘플 이미지 다운로드"""
    print("\n샘플 이미지 준비 중...")
    
    sample_images_dir = Path("sample_animals")
    sample_images_dir.mkdir(exist_ok=True)
    
    # 샘플 이미지 URL들 (무료 이미지)
    sample_urls = {
        "dog.jpg": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Collage_of_Nine_Dogs.jpg/640px-Collage_of_Nine_Dogs.jpg",
        "cat.jpg": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Kittyply_edit1.jpg/640px-Kittyply_edit1.jpg",
        "horse.jpg": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Nokota_Horses_cropped.jpg/640px-Nokota_Horses_cropped.jpg"
    }
    
    try:
        import urllib.request
        
        for filename, url in sample_urls.items():
            file_path = sample_images_dir / filename
            if not file_path.exists():
                print(f"다운로드 중: {filename}")
                urllib.request.urlretrieve(url, file_path)
                print(f"OK {filename} 저장 완료")
            else:
                print(f"OK {filename} 이미 존재")
                
    except Exception as e:
        print(f"X 샘플 이미지 다운로드 실패: {e}")
        print("수동으로 동물 이미지를 sample_animals/ 폴더에 넣어주세요.")
        return False
    
    return True

def test_huggingface_model():
    """Hugging Face 모델 테스트"""
    print("\nHugging Face 동물 분류 모델 테스트")
    print("=" * 60)
    
    try:
        from transformers import pipeline
        from PIL import Image
        import torch
        
        print("모델 로딩 중... (처음 실행시 시간이 걸릴 수 있습니다)")
        
        # GPU 확인
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"사용 디바이스: {device.upper()}")
        
        # 동물 분류 파이프라인 생성
        classifier = pipeline(
            "image-classification",
            model="shaktibiplab/Animal-Classification",
            device=0 if device == "cuda" else -1
        )
        
        print("OK 모델 로딩 완료!")
        
        # 샘플 이미지들로 테스트
        sample_dir = Path("sample_animals")
        
        if sample_dir.exists():
            image_files = list(sample_dir.glob("*.jpg")) + list(sample_dir.glob("*.png"))
            
            if image_files:
                print(f"\n{len(image_files)}개 이미지로 테스트 시작:")
                print("-" * 60)
                
                for image_path in image_files:
                    try:
                        print(f"\n분석 중: {image_path.name}")
                        
                        # 이미지 로드
                        image = Image.open(image_path)
                        print(f"   이미지 크기: {image.size}")
                        
                        # 예측 실행
                        start_time = time.time()
                        results = classifier(image_path)
                        end_time = time.time()
                        
                        print(f"   처리 시간: {end_time - start_time:.2f}초")
                        print("   예측 결과:")
                        
                        for i, result in enumerate(results[:3]):  # 상위 3개 결과
                            label = result['label']
                            score = result['score']
                            confidence = score * 100
                            print(f"     {i+1}. {label}: {confidence:.1f}%")
                        
                        print("-" * 40)
                        
                    except Exception as e:
                        print(f"X {image_path.name} 처리 실패: {e}")
            else:
                print("X sample_animals 폴더에 이미지가 없습니다.")
        else:
            print("X sample_animals 폴더가 없습니다.")
        
        # 사용자 이미지 테스트
        print("\n직접 이미지를 테스트하려면:")
        print("1. 이미지 파일을 sample_animals/ 폴더에 넣기")
        print("2. 이 스크립트를 다시 실행")
        
        return True
        
    except Exception as e:
        print(f"X 모델 테스트 실패: {e}")
        return False

def create_simple_gui():
    """간단한 GUI 버전 생성"""
    
    gui_code = '''#!/usr/bin/env python3
"""
Hugging Face 동물 분류 간단 GUI
"""
import tkinter as tk
from tkinter import filedialog, messagebox
from PIL import Image, ImageTk
import threading

try:
    from transformers import pipeline
    HF_AVAILABLE = True
except ImportError:
    HF_AVAILABLE = False

class AnimalClassifierGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("🤗 Hugging Face 동물 분류기")
        self.root.geometry("600x500")
        
        self.classifier = None
        self.setup_gui()
        
        if HF_AVAILABLE:
            self.load_model()
        else:
            messagebox.showerror("오류", "transformers 라이브러리가 설치되지 않았습니다.\\npip install transformers torch")
    
    def setup_gui(self):
        # 제목
        title = tk.Label(self.root, text="🤗 Hugging Face 동물 분류기", 
                        font=("Arial", 16, "bold"))
        title.pack(pady=10)
        
        # 설명
        desc = tk.Label(self.root, 
                       text="동물 이미지를 선택하면 AI가 자동으로 분류합니다\\n지원: 고양이, 개, 말, 사자, 호랑이, 코끼리",
                       font=("Arial", 10))
        desc.pack(pady=5)
        
        # 이미지 선택 버튼
        self.select_btn = tk.Button(self.root, text="📁 이미지 선택", 
                                   command=self.select_image,
                                   font=("Arial", 12), 
                                   bg="#4CAF50", fg="white")
        self.select_btn.pack(pady=10)
        
        # 이미지 표시 영역
        self.image_label = tk.Label(self.root, text="이미지가 선택되지 않았습니다", 
                                   width=50, height=15, bg="#f0f0f0")
        self.image_label.pack(pady=10)
        
        # 결과 표시 영역
        self.result_text = tk.Text(self.root, height=8, width=70, font=("Arial", 10))
        self.result_text.pack(pady=10, fill=tk.BOTH, expand=True)
        
        # 상태 표시
        self.status_label = tk.Label(self.root, text="모델 로딩 중...", fg="orange")
        self.status_label.pack(pady=5)
    
    def load_model(self):
        def load():
            try:
                self.status_label.config(text="🧠 모델 로딩 중... 잠시만 기다려주세요", fg="orange")
                self.classifier = pipeline("image-classification", 
                                         model="shaktibiplab/Animal-Classification")
                self.status_label.config(text="✅ 모델 로딩 완료! 이미지를 선택해주세요", fg="green")
                self.select_btn.config(state=tk.NORMAL)
            except Exception as e:
                self.status_label.config(text=f"❌ 모델 로딩 실패: {e}", fg="red")
        
        # 백그라운드에서 모델 로딩
        thread = threading.Thread(target=load)
        thread.daemon = True
        thread.start()
    
    def select_image(self):
        if not self.classifier:
            messagebox.showwarning("경고", "모델이 아직 로딩되지 않았습니다.")
            return
        
        file_path = filedialog.askopenfilename(
            title="동물 이미지 선택",
            filetypes=[("이미지 파일", "*.jpg *.jpeg *.png *.bmp"), ("모든 파일", "*.*")]
        )
        
        if file_path:
            self.classify_image(file_path)
    
    def classify_image(self, image_path):
        try:
            # 이미지 표시
            image = Image.open(image_path)
            # 크기 조정
            image.thumbnail((300, 300), Image.Resampling.LANCZOS)
            photo = ImageTk.PhotoImage(image)
            self.image_label.config(image=photo, text="")
            self.image_label.image = photo  # 참조 유지
            
            # 분류 실행
            self.status_label.config(text="🔍 이미지 분석 중...", fg="orange")
            self.root.update()
            
            results = self.classifier(image_path)
            
            # 결과 표시
            self.result_text.delete(1.0, tk.END)
            self.result_text.insert(tk.END, f"📁 파일: {image_path}\\n")
            self.result_text.insert(tk.END, f"📊 분석 결과:\\n")
            self.result_text.insert(tk.END, "=" * 40 + "\\n")
            
            for i, result in enumerate(results[:5], 1):
                label = result['label']
                score = result['score'] * 100
                self.result_text.insert(tk.END, f"{i}. {label}: {score:.1f}%\\n")
            
            self.result_text.insert(tk.END, "=" * 40 + "\\n")
            
            # 최고 예측 강조
            best_result = results[0]
            best_label = best_result['label']
            best_score = best_result['score'] * 100
            
            if best_score > 50:
                self.result_text.insert(tk.END, f"\\n🎯 예측: {best_label} ({best_score:.1f}%)\\n")
                self.status_label.config(text=f"✅ 완료! 예측: {best_label}", fg="green")
            else:
                self.result_text.insert(tk.END, f"\\n⚠️ 확신도가 낮습니다. 다른 이미지를 시도해보세요.\\n")
                self.status_label.config(text="⚠️ 낮은 확신도", fg="orange")
                
        except Exception as e:
            messagebox.showerror("오류", f"이미지 분석 실패: {e}")
            self.status_label.config(text="❌ 분석 실패", fg="red")

def main():
    root = tk.Tk()
    app = AnimalClassifierGUI(root)
    root.mainloop()

if __name__ == "__main__":
    main()
'''
    
    gui_file = Path("huggingface_animal_gui.py")
    with open(gui_file, 'w', encoding='utf-8') as f:
        f.write(gui_code)
    
    print(f"OK GUI 스크립트 생성: {gui_file}")
    return gui_file

def main():
    print("Hugging Face 동물 분류 모델 테스트")
    print("=" * 60)
    
    # 1. 의존성 확인
    if not check_dependencies():
        return
    
    # 2. 샘플 이미지 준비
    download_sample_images()
    
    # 3. 모델 테스트
    success = test_huggingface_model()
    
    # 4. GUI 생성
    gui_file = create_simple_gui()
    
    print("\n테스트 완료!")
    print("=" * 60)
    
    if success:
        print("OK Hugging Face 모델 테스트 성공!")
        print(f"\n다음 단계:")
        print(f"1. GUI 실행: python {gui_file}")
        print("2. 더 많은 이미지로 테스트")
        print("3. 기존 프로젝트에 통합")
    else:
        print("X 일부 테스트 실패")
        print("의존성을 다시 확인해주세요.")

if __name__ == "__main__":
    main()