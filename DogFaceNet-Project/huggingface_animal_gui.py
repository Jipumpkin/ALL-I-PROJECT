#!/usr/bin/env python3
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
            messagebox.showerror("오류", "transformers 라이브러리가 설치되지 않았습니다.\npip install transformers torch")
    
    def setup_gui(self):
        # 제목
        title = tk.Label(self.root, text="🤗 Hugging Face 동물 분류기", 
                        font=("Arial", 16, "bold"))
        title.pack(pady=10)
        
        # 설명
        desc = tk.Label(self.root, 
                       text="동물 이미지를 선택하면 AI가 자동으로 분류합니다\n지원: 고양이, 개, 말, 사자, 호랑이, 코끼리",
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
            self.result_text.insert(tk.END, f"📁 파일: {image_path}\n")
            self.result_text.insert(tk.END, f"📊 분석 결과:\n")
            self.result_text.insert(tk.END, "=" * 40 + "\n")
            
            for i, result in enumerate(results[:5], 1):
                label = result['label']
                score = result['score'] * 100
                self.result_text.insert(tk.END, f"{i}. {label}: {score:.1f}%\n")
            
            self.result_text.insert(tk.END, "=" * 40 + "\n")
            
            # 최고 예측 강조
            best_result = results[0]
            best_label = best_result['label']
            best_score = best_result['score'] * 100
            
            if best_score > 50:
                self.result_text.insert(tk.END, f"\n🎯 예측: {best_label} ({best_score:.1f}%)\n")
                self.status_label.config(text=f"✅ 완료! 예측: {best_label}", fg="green")
            else:
                self.result_text.insert(tk.END, f"\n⚠️ 확신도가 낮습니다. 다른 이미지를 시도해보세요.\n")
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
