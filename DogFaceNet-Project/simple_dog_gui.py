#!/usr/bin/env python3
"""
Simple Dog Face Parser GUI - 간단한 강아지 얼굴 파싱 GUI
"""
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import cv2
import numpy as np
from PIL import Image, ImageTk
from pathlib import Path

class SimpleDogParserGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Simple Dog Face Parser")
        self.root.geometry("1000x700")
        
        # 변수들
        self.current_image = None
        self.current_image_path = None
        self.face_cascade = None
        self.eye_cascade = None
        self.parsing_results = None
        
        # GUI 구성
        self.setup_gui()
        self.load_cascades()
    
    def setup_gui(self):
        """GUI 구성"""
        # 제목
        title = tk.Label(self.root, text="🐕 Simple Dog Face Parser", 
                        font=("Arial", 16, "bold"))
        title.pack(pady=10)
        
        # 컨트롤 바
        control_frame = tk.Frame(self.root)
        control_frame.pack(pady=10)
        
        self.select_btn = tk.Button(control_frame, text="Select Image", 
                                   command=self.select_image,
                                   bg="#4CAF50", fg="white", font=("Arial", 11))
        self.select_btn.pack(side=tk.LEFT, padx=5)
        
        self.parse_btn = tk.Button(control_frame, text="Parse Face", 
                                  command=self.parse_face,
                                  bg="#2196F3", fg="white", font=("Arial", 11),
                                  state=tk.DISABLED)
        self.parse_btn.pack(side=tk.LEFT, padx=5)
        
        self.save_btn = tk.Button(control_frame, text="Save Results", 
                                 command=self.save_results,
                                 bg="#FF9800", fg="white", font=("Arial", 11),
                                 state=tk.DISABLED)
        self.save_btn.pack(side=tk.LEFT, padx=5)
        
        # 메인 컨텐츠
        content_frame = tk.Frame(self.root)
        content_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # 이미지 표시 영역
        image_frame = tk.LabelFrame(content_frame, text="Dog Image")
        image_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 5))
        
        self.image_canvas = tk.Canvas(image_frame, bg="white")
        self.image_canvas.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # 결과 표시 영역
        results_frame = tk.LabelFrame(content_frame, text="Parsing Results", width=300)
        results_frame.pack(side=tk.RIGHT, fill=tk.Y, padx=(5, 0))
        results_frame.pack_propagate(False)
        
        # 통계
        stats_label = tk.Label(results_frame, text="Statistics:", font=("Arial", 10, "bold"))
        stats_label.pack(anchor=tk.W, padx=5, pady=5)
        
        self.stats_text = tk.Text(results_frame, height=8, font=("Courier", 9))
        self.stats_text.pack(fill=tk.X, padx=5, pady=5)
        
        # 추출된 영역 목록
        regions_label = tk.Label(results_frame, text="Extracted Regions:", font=("Arial", 10, "bold"))
        regions_label.pack(anchor=tk.W, padx=5, pady=(10, 5))
        
        self.regions_listbox = tk.Listbox(results_frame, height=10, font=("Arial", 9))
        self.regions_listbox.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        self.regions_listbox.bind("<<ListboxSelect>>", self.on_region_selected)
        
        # 상태바
        self.status_label = tk.Label(self.root, text="Ready - Select a dog image", 
                                    relief=tk.SUNKEN, anchor=tk.W)
        self.status_label.pack(fill=tk.X, pady=(10, 0))
    
    def load_cascades(self):
        """Cascade 로드"""
        try:
            cascade_path = cv2.data.haarcascades
            
            self.face_cascade = cv2.CascadeClassifier(cascade_path + 'haarcascade_frontalface_default.xml')
            self.eye_cascade = cv2.CascadeClassifier(cascade_path + 'haarcascade_eye.xml')
            
            if self.face_cascade.empty() or self.eye_cascade.empty():
                raise Exception("Failed to load cascades")
            
            self.status_label.config(text="Cascades loaded successfully")
        except Exception as e:
            self.status_label.config(text=f"Error loading cascades: {e}")
            messagebox.showerror("Error", f"Failed to load OpenCV cascades:\n{e}")
    
    def select_image(self):
        """이미지 선택"""
        file_path = filedialog.askopenfilename(
            title="Select Dog Image",
            filetypes=[
                ("Image files", "*.jpg *.jpeg *.png *.bmp"),
                ("All files", "*.*")
            ]
        )
        
        if file_path:
            self.current_image_path = file_path
            self.load_and_display_image(file_path)
            self.parse_btn.config(state=tk.NORMAL)
            self.clear_results()
    
    def load_and_display_image(self, file_path):
        """이미지 로드 및 표시"""
        try:
            # OpenCV로 이미지 로드
            self.current_image = cv2.imread(file_path)
            
            # PIL로 변환하여 표시
            rgb_image = cv2.cvtColor(self.current_image, cv2.COLOR_BGR2RGB)
            pil_image = Image.fromarray(rgb_image)
            
            # 캔버스 크기에 맞게 리사이즈
            self.image_canvas.update()
            canvas_width = self.image_canvas.winfo_width()
            canvas_height = self.image_canvas.winfo_height()
            
            if canvas_width > 1 and canvas_height > 1:
                pil_image.thumbnail((canvas_width-10, canvas_height-10), Image.Resampling.LANCZOS)
            
            # PhotoImage로 변환
            self.photo = ImageTk.PhotoImage(pil_image)
            
            # 캔버스에 표시
            self.image_canvas.delete("all")
            self.image_canvas.create_image(canvas_width//2, canvas_height//2, 
                                         anchor=tk.CENTER, image=self.photo)
            
            # 스케일링 정보 저장
            original_size = self.current_image.shape[:2]
            display_size = (pil_image.width, pil_image.height)
            self.scale_x = original_size[1] / display_size[0]  # width
            self.scale_y = original_size[0] / display_size[1]  # height
            
            self.status_label.config(text=f"Image loaded: {Path(file_path).name}")
            
        except Exception as e:
            self.status_label.config(text=f"Error loading image: {e}")
            messagebox.showerror("Error", f"Failed to load image:\n{e}")
    
    def parse_face(self):
        """강아지 얼굴 파싱"""
        if self.current_image is None:
            return
        
        self.status_label.config(text="Parsing dog face...")
        self.parse_btn.config(state=tk.DISABLED)
        
        try:
            # 그레이스케일 변환
            gray = cv2.cvtColor(self.current_image, cv2.COLOR_BGR2GRAY)
            
            # 얼굴 탐지
            faces = self.face_cascade.detectMultiScale(
                gray, scaleFactor=1.1, minNeighbors=4, minSize=(50, 50)
            )
            
            if len(faces) == 0:
                self.status_label.config(text="No dog faces detected")
                messagebox.showwarning("No Detection", "No dog faces were detected in the image.")
                self.parse_btn.config(state=tk.NORMAL)
                return
            
            # 결과 저장
            self.parsing_results = {
                'faces': [],
                'regions': {}
            }
            
            result_image = self.current_image.copy()
            
            for i, (x, y, w, h) in enumerate(faces):
                # 얼굴 박스
                cv2.rectangle(result_image, (x, y), (x+w, y+h), (0, 255, 0), 2)
                cv2.putText(result_image, f"Dog Face {i+1}", (x, y-10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                
                # 얼굴 ROI
                face_roi_gray = gray[y:y+h, x:x+w]
                face_roi_color = result_image[y:y+h, x:x+w]
                
                # 눈 탐지
                eyes = self.eye_cascade.detectMultiScale(face_roi_gray, scaleFactor=1.1, minNeighbors=3)
                
                face_data = {
                    'bbox': (x, y, w, h),
                    'eyes': [],
                    'regions': {}
                }
                
                # 눈 표시
                for j, (ex, ey, ew, eh) in enumerate(eyes):
                    cv2.rectangle(face_roi_color, (ex, ey), (ex+ew, ey+eh), (255, 255, 0), 2)
                    cv2.putText(face_roi_color, f"Eye{j+1}", (ex, ey-5),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 0), 1)
                    
                    face_data['eyes'].append((ex, ey, ew, eh))
                    
                    # 눈 영역 추출
                    eye_region = self.current_image[y+ey:y+ey+eh, x+ex:x+ex+ew]
                    face_data['regions'][f'eye_{j+1}'] = eye_region
                
                # 코 영역 (추정)
                nose_x, nose_y = int(w*0.4), int(h*0.6)
                nose_w, nose_h = int(w*0.2), int(h*0.2)
                
                cv2.rectangle(face_roi_color, (nose_x, nose_y), (nose_x+nose_w, nose_y+nose_h), 
                             (255, 0, 255), 2)
                cv2.putText(face_roi_color, "Nose", (nose_x, nose_y-5),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 0, 255), 1)
                
                # 코 영역 추출
                nose_region = self.current_image[y+nose_y:y+nose_y+nose_h, x+nose_x:x+nose_x+nose_w]
                face_data['regions']['nose'] = nose_region
                
                # 입 영역 (추정)  
                mouth_x, mouth_y = int(w*0.3), int(h*0.75)
                mouth_w, mouth_h = int(w*0.4), int(h*0.2)
                
                cv2.rectangle(face_roi_color, (mouth_x, mouth_y), (mouth_x+mouth_w, mouth_y+mouth_h),
                             (0, 255, 255), 2)
                cv2.putText(face_roi_color, "Mouth", (mouth_x, mouth_y-5),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 255), 1)
                
                # 입 영역 추출
                mouth_region = self.current_image[y+mouth_y:y+mouth_y+mouth_h, x+mouth_x:x+mouth_x+mouth_w]
                face_data['regions']['mouth'] = mouth_region
                
                # 전체 얼굴 추출
                full_face = self.current_image[y:y+h, x:x+w]
                face_data['regions']['full_face'] = full_face
                
                self.parsing_results['faces'].append(face_data)
                
                # 전역 영역에도 추가 (인덱스 포함)
                for region_name, region_img in face_data['regions'].items():
                    self.parsing_results['regions'][f'face{i+1}_{region_name}'] = region_img
            
            # 결과 이미지 표시
            self.display_result_image(result_image)
            
            # 결과 업데이트
            self.update_results_display()
            
            self.save_btn.config(state=tk.NORMAL)
            self.status_label.config(text=f"Parsing complete: {len(faces)} face(s) found")
            
        except Exception as e:
            self.status_label.config(text=f"Parsing error: {e}")
            messagebox.showerror("Error", f"Error during parsing:\n{e}")
        
        finally:
            self.parse_btn.config(state=tk.NORMAL)
    
    def display_result_image(self, result_image):
        """결과 이미지 표시"""
        try:
            # BGR -> RGB 변환
            rgb_image = cv2.cvtColor(result_image, cv2.COLOR_BGR2RGB)
            pil_image = Image.fromarray(rgb_image)
            
            # 캔버스 크기에 맞게 리사이즈
            canvas_width = self.image_canvas.winfo_width()
            canvas_height = self.image_canvas.winfo_height()
            
            if canvas_width > 1 and canvas_height > 1:
                pil_image.thumbnail((canvas_width-10, canvas_height-10), Image.Resampling.LANCZOS)
            
            # PhotoImage로 변환
            self.photo = ImageTk.PhotoImage(pil_image)
            
            # 캔버스에 표시
            self.image_canvas.delete("all")
            self.image_canvas.create_image(canvas_width//2, canvas_height//2, 
                                         anchor=tk.CENTER, image=self.photo)
        except Exception as e:
            self.status_label.config(text=f"Error displaying result: {e}")
    
    def update_results_display(self):
        """결과 표시 업데이트"""
        if not self.parsing_results:
            return
        
        # 통계 업데이트
        self.stats_text.delete(1.0, tk.END)
        
        faces_count = len(self.parsing_results['faces'])
        regions_count = len(self.parsing_results['regions'])
        
        total_eyes = sum(len(face['eyes']) for face in self.parsing_results['faces'])
        
        stats = f"""Parsing Results:
{"="*20}
Dog Faces: {faces_count}
Total Regions: {regions_count}
Eyes Detected: {total_eyes}

Per Face:
"""
        
        for i, face in enumerate(self.parsing_results['faces'], 1):
            x, y, w, h = face['bbox']
            eyes_count = len(face['eyes'])
            regions_count = len(face['regions'])
            
            stats += f"""
Face {i}:
  Size: {w} x {h}
  Eyes: {eyes_count}
  Regions: {regions_count}
"""
        
        self.stats_text.insert(tk.END, stats)
        
        # 영역 목록 업데이트
        self.regions_listbox.delete(0, tk.END)
        for region_name in self.parsing_results['regions'].keys():
            self.regions_listbox.insert(tk.END, region_name)
    
    def on_region_selected(self, event):
        """영역 선택 시 미리보기 (간단 버전)"""
        selection = self.regions_listbox.curselection()
        if not selection or not self.parsing_results:
            return
        
        region_name = self.regions_listbox.get(selection[0])
        region_img = self.parsing_results['regions'][region_name]
        
        # 새 창에서 영역 표시
        self.show_region_window(region_name, region_img)
    
    def show_region_window(self, region_name, region_img):
        """영역을 새 창에서 표시"""
        try:
            region_window = tk.Toplevel(self.root)
            region_window.title(f"Region: {region_name}")
            region_window.geometry("300x300")
            
            # BGR -> RGB 변환
            rgb_img = cv2.cvtColor(region_img, cv2.COLOR_BGR2RGB) if len(region_img.shape) == 3 else region_img
            pil_img = Image.fromarray(rgb_img)
            
            # 창 크기에 맞게 리사이즈
            pil_img.thumbnail((280, 280), Image.Resampling.LANCZOS)
            photo = ImageTk.PhotoImage(pil_img)
            
            canvas = tk.Canvas(region_window, width=300, height=300)
            canvas.pack(fill=tk.BOTH, expand=True)
            
            canvas.create_image(150, 150, anchor=tk.CENTER, image=photo)
            canvas.image = photo  # 참조 유지
            
        except Exception as e:
            self.status_label.config(text=f"Error showing region: {e}")
    
    def save_results(self):
        """결과 저장"""
        if not self.parsing_results:
            return
        
        save_dir = filedialog.askdirectory(title="Select Save Directory")
        if not save_dir:
            return
        
        save_path = Path(save_dir)
        
        try:
            # 영역 이미지들 저장
            for region_name, region_img in self.parsing_results['regions'].items():
                filename = f"{region_name}.jpg"
                cv2.imwrite(str(save_path / filename), region_img)
            
            # 통계 정보 저장
            stats_file = save_path / "parsing_stats.txt"
            with open(stats_file, 'w') as f:
                stats_text = self.stats_text.get(1.0, tk.END)
                f.write(stats_text)
            
            self.status_label.config(text=f"Results saved to {save_path}")
            messagebox.showinfo("Success", f"Results saved successfully to:\n{save_path}")
            
        except Exception as e:
            self.status_label.config(text=f"Save error: {e}")
            messagebox.showerror("Error", f"Failed to save results:\n{e}")
    
    def clear_results(self):
        """결과 초기화"""
        self.parsing_results = None
        self.stats_text.delete(1.0, tk.END)
        self.regions_listbox.delete(0, tk.END)
        self.save_btn.config(state=tk.DISABLED)


def main():
    """메인 함수"""
    root = tk.Tk()
    app = SimpleDogParserGUI(root)
    root.mainloop()


if __name__ == "__main__":
    print("Simple Dog Face Parser GUI")
    print("="*30)
    main()