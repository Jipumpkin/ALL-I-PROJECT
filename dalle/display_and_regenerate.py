#!/usr/bin/env python3
"""
DALL-E 케어 이미지 결과물 표시 및 재생성 스크립트
생성된 이미지를 런타임 중에 표시하고 재생성 옵션을 제공합니다.
"""
import os
import sys
import json
import tkinter as tk
from tkinter import ttk, messagebox
from PIL import Image, ImageTk
import subprocess
from pathlib import Path
from datetime import datetime

class ImageDisplayApp:
    def __init__(self, root):
        self.root = root
        self.root.title("DALL-E 케어 이미지 결과물")
        self.root.geometry("800x900")
        
        self.results_dir = Path("results")
        self.current_image_path = None
        self.current_meta_path = None
        
        self.setup_ui()
        self.load_latest_result()
        
    def setup_ui(self):
        """UI 구성 요소 설정"""
        # 메인 프레임
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # 제목
        title_label = ttk.Label(main_frame, text="🐾 DALL-E 케어 이미지 합성 결과", 
                               font=("Arial", 16, "bold"))
        title_label.grid(row=0, column=0, columnspan=2, pady=(0, 20))
        
        # 이미지 표시 영역
        self.image_frame = ttk.LabelFrame(main_frame, text="생성된 이미지", padding="10")
        self.image_frame.grid(row=1, column=0, columnspan=2, pady=(0, 20), sticky=(tk.W, tk.E))
        
        self.image_label = ttk.Label(self.image_frame, text="이미지를 불러오는 중...")
        self.image_label.pack()
        
        # 메타데이터 영역
        self.meta_frame = ttk.LabelFrame(main_frame, text="생성 정보", padding="10")
        self.meta_frame.grid(row=2, column=0, columnspan=2, pady=(0, 20), sticky=(tk.W, tk.E))
        
        self.meta_text = tk.Text(self.meta_frame, height=8, width=80, wrap=tk.WORD)
        self.meta_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        scrollbar = ttk.Scrollbar(self.meta_frame, orient=tk.VERTICAL, command=self.meta_text.yview)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.meta_text.config(yscrollcommand=scrollbar.set)
        
        # 버튼 영역
        button_frame = ttk.Frame(main_frame)
        button_frame.grid(row=3, column=0, columnspan=2, pady=(20, 0))
        
        # 재생성 버튼
        self.regenerate_btn = ttk.Button(button_frame, text="🔄 재생성하기", 
                                        command=self.ask_regenerate)
        self.regenerate_btn.pack(side=tk.LEFT, padx=(0, 10))
        
        # 새로운 이미지 생성 버튼
        self.new_btn = ttk.Button(button_frame, text="➕ 새 이미지 생성", 
                                 command=self.create_new_image)
        self.new_btn.pack(side=tk.LEFT, padx=(0, 10))
        
        # 파일 탐색기에서 열기 버튼
        self.open_folder_btn = ttk.Button(button_frame, text="📁 폴더 열기", 
                                         command=self.open_results_folder)
        self.open_folder_btn.pack(side=tk.LEFT, padx=(0, 10))
        
        # 닫기 버튼
        self.close_btn = ttk.Button(button_frame, text="❌ 닫기", 
                                   command=self.root.quit)
        self.close_btn.pack(side=tk.LEFT)
        
    def load_latest_result(self):
        """가장 최근 생성된 결과 로드"""
        try:
            # results 디렉토리에서 가장 최근 이미지 찾기
            image_files = list(self.results_dir.glob("care_*.png"))
            if not image_files:
                self.show_no_results()
                return
                
            # 가장 최근 파일 선택 (파일명의 타임스탬프 기준)
            latest_image = max(image_files, key=lambda x: x.stat().st_mtime)
            self.current_image_path = latest_image
            
            # 대응하는 메타데이터 파일 찾기
            meta_file = latest_image.with_name(latest_image.name.replace("care_", "meta_").replace(".png", ".json"))
            if meta_file.exists():
                self.current_meta_path = meta_file
                
            self.display_image()
            self.display_metadata()
            
        except Exception as e:
            messagebox.showerror("오류", f"결과 로드 중 오류가 발생했습니다: {str(e)}")
            
    def show_no_results(self):
        """결과가 없을 때 표시"""
        self.image_label.config(text="생성된 이미지가 없습니다.\n'새 이미지 생성' 버튼을 클릭해보세요.")
        self.meta_text.insert(tk.END, "아직 생성된 이미지가 없습니다.")
        
    def display_image(self):
        """이미지 표시"""
        try:
            if not self.current_image_path or not self.current_image_path.exists():
                return
                
            # 이미지 로드 및 리사이즈
            image = Image.open(self.current_image_path)
            
            # 최대 크기 설정 (비율 유지하며 리사이즈)
            max_size = (600, 400)
            image.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # tkinter에서 사용할 수 있도록 변환
            photo = ImageTk.PhotoImage(image)
            
            # 이미지 표시
            self.image_label.config(image=photo, text="")
            self.image_label.image = photo  # 참조 유지
            
        except Exception as e:
            self.image_label.config(text=f"이미지 로드 실패: {str(e)}")
            
    def display_metadata(self):
        """메타데이터 표시"""
        try:
            if not self.current_meta_path or not self.current_meta_path.exists():
                self.meta_text.insert(tk.END, "메타데이터를 찾을 수 없습니다.")
                return
                
            with open(self.current_meta_path, 'r', encoding='utf-8') as f:
                meta_data = json.load(f)
                
            # 메타데이터 포맷팅하여 표시
            self.meta_text.delete(1.0, tk.END)
            
            display_text = f"""📋 생성 정보
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 케어 활동: {meta_data.get('activity', 'N/A')}
📅 생성 시간: {meta_data.get('timestamp', 'N/A')}
📁 파일명: {self.current_image_path.name if self.current_image_path else 'N/A'}

🔍 동물 분석:
{meta_data.get('animal_analysis', 'N/A')}

🏠 공간 분석:
{meta_data.get('space_analysis', 'N/A')[:500]}...

🎨 합성 프롬프트:
{meta_data.get('synthesis_prompt', 'N/A')[:300]}...

🌐 DALL-E URL:
{meta_data.get('dalle_url', 'N/A')}
"""
            
            self.meta_text.insert(tk.END, display_text)
            
        except Exception as e:
            self.meta_text.insert(tk.END, f"메타데이터 로드 실패: {str(e)}")
            
    def ask_regenerate(self):
        """재생성 확인 대화상자"""
        if not self.current_meta_path:
            messagebox.showwarning("경고", "재생성할 원본 데이터가 없습니다.")
            return
            
        result = messagebox.askyesno(
            "이미지 재생성", 
            "동일한 설정으로 이미지를 재생성하시겠습니까?\n\n"
            "⚠️ OpenAI API 사용량이 발생합니다.\n"
            "💰 예상 비용: $0.040 (DALL-E 3 1024x1024)"
        )
        
        if result:
            self.regenerate_image()
            
    def regenerate_image(self):
        """이미지 재생성 실행"""
        try:
            # 진행 대화상자 표시
            progress_window = tk.Toplevel(self.root)
            progress_window.title("이미지 생성 중...")
            progress_window.geometry("300x100")
            progress_window.transient(self.root)
            progress_window.grab_set()
            
            ttk.Label(progress_window, text="🎨 DALL-E로 이미지를 생성하고 있습니다...").pack(pady=20)
            progress_bar = ttk.Progressbar(progress_window, mode='indeterminate')
            progress_bar.pack(pady=10)
            progress_bar.start()
            
            self.root.update()
            
            # 메타데이터에서 원본 설정 추출 (실제 구현에서는 원본 animal, space 이미지 경로 필요)
            # 여기서는 예시로 CLI 재실행
            messagebox.showinfo("안내", "실제 재생성을 위해서는 원본 animal.jpg와 space.jpg 파일이 필요합니다.")
            
            progress_window.destroy()
            
        except Exception as e:
            messagebox.showerror("오류", f"재생성 중 오류가 발생했습니다: {str(e)}")
            
    def create_new_image(self):
        """새로운 이미지 생성"""
        messagebox.showinfo(
            "새 이미지 생성", 
            "새로운 이미지를 생성하려면 CLI를 사용하세요:\n\n"
            "python care_synthesizer_cli.py \\\n"
            "  --animal your_animal.jpg \\\n"
            "  --space your_space.jpg \\\n"
            "  --activity [밥주기|씻기기|미용하기]"
        )
        
    def open_results_folder(self):
        """결과 폴더를 파일 탐색기에서 열기"""
        try:
            if os.name == 'nt':  # Windows
                os.startfile(self.results_dir)
            elif os.name == 'posix':  # macOS, Linux
                subprocess.run(['open', self.results_dir])
        except Exception as e:
            messagebox.showerror("오류", f"폴더 열기 실패: {str(e)}")

def main():
    """메인 함수"""
    root = tk.Tk()
    app = ImageDisplayApp(root)
    
    # ESC 키로 종료
    root.bind('<Escape>', lambda e: root.quit())
    
    # 창 최소 크기 설정
    root.minsize(600, 700)
    
    # 창을 화면 중앙에 배치
    root.eval('tk::PlaceWindow . center')
    
    try:
        root.mainloop()
    except KeyboardInterrupt:
        print("\n프로그램이 중단되었습니다.")

if __name__ == "__main__":
    main()