#!/usr/bin/env python3
"""
Dog Face Parser GUI - 강아지 얼굴 파싱 전용 인터페이스
강아지 얼굴의 세부 부위를 시각적으로 분석하고 표시
"""
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import cv2
import numpy as np
from PIL import Image, ImageTk
import threading
from pathlib import Path
import json
from datetime import datetime

try:
    from dog_face_parser import DogFaceParser
    PARSER_AVAILABLE = True
except ImportError:
    PARSER_AVAILABLE = False

class DogFaceParserGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Dog Face Parser - 강아지 얼굴 세부 분석")
        self.root.geometry("1400x900")
        self.root.configure(bg='#f0f0f0')
        
        # 변수들
        self.current_image_path = None
        self.parser = None
        self.parsing_results = []
        self.current_face_index = 0
        self.region_images = {}
        
        # 색상 설정
        self.colors = {
            'face': (0, 255, 0),
            'eyes': (255, 255, 0),
            'nose': (255, 0, 255),
            'mouth': (0, 255, 255),
            'ears': (255, 165, 0),
            'landmarks': (255, 0, 0)
        }
        
        # GUI 구성
        self.setup_gui()
        
        # 파서 초기화
        if PARSER_AVAILABLE:
            self.init_parser()
    
    def setup_gui(self):
        """GUI 구성"""
        # 메인 컨테이너
        main_container = tk.Frame(self.root, bg='#f0f0f0')
        main_container.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # 헤더
        self.create_header(main_container)
        
        # 컨트롤 바
        self.create_control_bar(main_container)
        
        # 메인 컨텐츠 영역
        content_frame = tk.Frame(main_container, bg='white')
        content_frame.pack(fill=tk.BOTH, expand=True, pady=10)
        
        # 3개 패널로 구성
        self.create_image_panel(content_frame)      # 왼쪽: 메인 이미지
        self.create_analysis_panel(content_frame)   # 가운데: 분석 결과
        self.create_regions_panel(content_frame)    # 오른쪽: 추출된 영역들
        
        # 상태바
        self.create_status_bar(main_container)
    
    def create_header(self, parent):
        """헤더 생성"""
        header_frame = tk.Frame(parent, bg='#2E7D32', height=60)
        header_frame.pack(fill=tk.X, pady=(0, 10))
        header_frame.pack_propagate(False)
        
        title = tk.Label(header_frame, text="🐕 Dog Face Parser - 강아지 얼굴 세부 분석", 
                        font=("Arial", 18, "bold"), fg='white', bg='#2E7D32')
        title.pack(pady=15)
    
    def create_control_bar(self, parent):
        """컨트롤 바"""
        control_frame = tk.Frame(parent, bg='#e8f5e8', height=50)
        control_frame.pack(fill=tk.X, pady=(0, 10))
        control_frame.pack_propagate(False)
        
        # 버튼들
        btn_frame = tk.Frame(control_frame, bg='#e8f5e8')
        btn_frame.pack(side=tk.LEFT, padx=10, pady=10)
        
        self.select_btn = tk.Button(btn_frame, text="📁 Select Dog Image", 
                                   command=self.select_image,
                                   bg="#4CAF50", fg="white", font=("Arial", 11, "bold"),
                                   padx=20, pady=5)
        self.select_btn.pack(side=tk.LEFT, padx=5)
        
        self.parse_btn = tk.Button(btn_frame, text="🔍 Parse Face", 
                                  command=self.start_parsing,
                                  bg="#2196F3", fg="white", font=("Arial", 11, "bold"),
                                  padx=20, pady=5, state=tk.DISABLED)
        self.parse_btn.pack(side=tk.LEFT, padx=5)
        
        self.save_btn = tk.Button(btn_frame, text="💾 Save Analysis", 
                                 command=self.save_analysis,
                                 bg="#FF9800", fg="white", font=("Arial", 11, "bold"),
                                 padx=20, pady=5, state=tk.DISABLED)
        self.save_btn.pack(side=tk.LEFT, padx=5)
        
        self.clear_btn = tk.Button(btn_frame, text="🔄 Clear", 
                                  command=self.clear_all,
                                  bg="#F44336", fg="white", font=("Arial", 11, "bold"),
                                  padx=20, pady=5)
        self.clear_btn.pack(side=tk.LEFT, padx=5)
        
        # 얼굴 선택기 (오른쪽)
        face_frame = tk.Frame(control_frame, bg='#e8f5e8')
        face_frame.pack(side=tk.RIGHT, padx=10, pady=10)
        
        tk.Label(face_frame, text="Face:", bg='#e8f5e8', font=("Arial", 10)).pack(side=tk.LEFT)
        
        self.face_var = tk.StringVar(value="No faces detected")
        self.face_combo = ttk.Combobox(face_frame, textvariable=self.face_var, 
                                      state="readonly", width=15)
        self.face_combo.pack(side=tk.LEFT, padx=5)
        self.face_combo.bind("<<ComboboxSelected>>", self.on_face_selected)
    
    def create_image_panel(self, parent):
        """메인 이미지 패널"""
        image_frame = tk.LabelFrame(parent, text="Dog Image Analysis", 
                                   font=("Arial", 12, "bold"), bg='white')
        image_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 5))
        
        # 이미지 캔버스
        self.image_canvas = tk.Canvas(image_frame, bg='white', cursor='crosshair')
        self.image_canvas.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # 캔버스 이벤트
        self.image_canvas.bind("<Button-1>", self.on_canvas_click)
        self.image_canvas.bind("<Motion>", self.on_canvas_motion)
        
        # 컨트롤 하단
        img_control_frame = tk.Frame(image_frame, bg='white')
        img_control_frame.pack(fill=tk.X, padx=5, pady=5)
        
        # 표시 옵션
        tk.Label(img_control_frame, text="Show:", bg='white', font=("Arial", 10, "bold")).pack(side=tk.LEFT)
        
        self.show_vars = {}
        show_options = [
            ('Face', 'face', True),
            ('Eyes', 'eyes', True), 
            ('Nose', 'nose', True),
            ('Mouth', 'mouth', True),
            ('Ears', 'ears', True),
            ('Landmarks', 'landmarks', False)
        ]
        
        for text, key, default in show_options:
            var = tk.BooleanVar(value=default)
            self.show_vars[key] = var
            cb = tk.Checkbutton(img_control_frame, text=text, variable=var,
                               command=self.update_image_display,
                               bg='white', font=("Arial", 9))
            cb.pack(side=tk.LEFT, padx=5)
    
    def create_analysis_panel(self, parent):
        """분석 결과 패널"""
        analysis_frame = tk.LabelFrame(parent, text="Analysis Results", 
                                      font=("Arial", 12, "bold"), bg='white', width=350)
        analysis_frame.pack(side=tk.LEFT, fill=tk.Y, padx=5)
        analysis_frame.pack_propagate(False)
        
        # 요약 정보
        summary_frame = tk.LabelFrame(analysis_frame, text="Summary", font=("Arial", 10, "bold"))
        summary_frame.pack(fill=tk.X, padx=5, pady=5)
        
        self.summary_text = tk.Text(summary_frame, height=6, font=("Courier", 9), 
                                   wrap=tk.WORD, bg='#f9f9f9')
        self.summary_text.pack(fill=tk.X, padx=5, pady=5)
        
        # 세부 특징 정보
        details_frame = tk.LabelFrame(analysis_frame, text="Feature Details", font=("Arial", 10, "bold"))
        details_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # 트리뷰로 계층적 표시
        tree_frame = tk.Frame(details_frame)
        tree_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        self.details_tree = ttk.Treeview(tree_frame, columns=('Value', 'Confidence'), show='tree headings')
        self.details_tree.heading('#0', text='Feature')
        self.details_tree.heading('Value', text='Value')
        self.details_tree.heading('Confidence', text='Confidence')
        
        self.details_tree.column('#0', width=120)
        self.details_tree.column('Value', width=100)
        self.details_tree.column('Confidence', width=80)
        
        # 스크롤바
        tree_scroll = ttk.Scrollbar(tree_frame, orient=tk.VERTICAL, command=self.details_tree.yview)
        self.details_tree.configure(yscrollcommand=tree_scroll.set)
        
        self.details_tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        tree_scroll.pack(side=tk.RIGHT, fill=tk.Y)
        
        # 트리 선택 이벤트
        self.details_tree.bind("<<TreeviewSelect>>", self.on_feature_selected)
    
    def create_regions_panel(self, parent):
        """추출된 영역 패널"""
        regions_frame = tk.LabelFrame(parent, text="Extracted Regions", 
                                     font=("Arial", 12, "bold"), bg='white', width=300)
        regions_frame.pack(side=tk.RIGHT, fill=tk.Y, padx=(5, 0))
        regions_frame.pack_propagate(False)
        
        # 영역 목록
        regions_list_frame = tk.Frame(regions_frame, bg='white')
        regions_list_frame.pack(fill=tk.X, padx=5, pady=5)
        
        tk.Label(regions_list_frame, text="Select Region:", bg='white', 
                font=("Arial", 10, "bold")).pack(anchor=tk.W)
        
        self.regions_listbox = tk.Listbox(regions_list_frame, height=8, font=("Arial", 9))
        self.regions_listbox.pack(fill=tk.X, pady=5)
        self.regions_listbox.bind("<<ListboxSelect>>", self.on_region_selected)
        
        # 선택된 영역 표시
        region_display_frame = tk.LabelFrame(regions_frame, text="Region Preview", 
                                           font=("Arial", 10, "bold"))
        region_display_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        self.region_canvas = tk.Canvas(region_display_frame, bg='white', height=200)
        self.region_canvas.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # 영역 정보
        region_info_frame = tk.Frame(regions_frame, bg='white')
        region_info_frame.pack(fill=tk.X, padx=5, pady=5)
        
        self.region_info_text = tk.Text(region_info_frame, height=4, font=("Courier", 8),
                                       bg='#f9f9f9', wrap=tk.WORD)
        self.region_info_text.pack(fill=tk.X)
    
    def create_status_bar(self, parent):
        """상태바"""
        self.status_frame = tk.Frame(parent, bg='#e0e0e0', height=25)
        self.status_frame.pack(fill=tk.X, side=tk.BOTTOM)
        self.status_frame.pack_propagate(False)
        
        self.status_label = tk.Label(self.status_frame, text="Ready - Select a dog image to start", 
                                    bg='#e0e0e0', anchor=tk.W, font=("Arial", 9))
        self.status_label.pack(side=tk.LEFT, padx=10, fill=tk.X, expand=True)
        
        self.progress_label = tk.Label(self.status_frame, text="", 
                                      bg='#e0e0e0', anchor=tk.E, font=("Arial", 9))
        self.progress_label.pack(side=tk.RIGHT, padx=10)
    
    def init_parser(self):
        """파서 초기화"""
        try:
            self.parser = DogFaceParser()
            self.update_status("Dog Face Parser initialized successfully")
        except Exception as e:
            self.update_status(f"Parser initialization failed: {e}")
            messagebox.showerror("Error", f"Failed to initialize parser:\n{e}")
    
    def select_image(self):
        """이미지 선택"""
        file_path = filedialog.askopenfilename(
            title="Select Dog Image",
            filetypes=[
                ("Image files", "*.jpg *.jpeg *.png *.bmp *.gif"),
                ("All files", "*.*")
            ]
        )
        
        if file_path:
            self.current_image_path = file_path
            self.display_original_image(file_path)
            self.parse_btn.config(state=tk.NORMAL if PARSER_AVAILABLE else tk.DISABLED)
            self.clear_results()
            self.update_status(f"Image loaded: {Path(file_path).name}")
    
    def display_original_image(self, image_path):
        """원본 이미지 표시"""
        try:
            # 이미지 로드
            pil_image = Image.open(image_path)
            
            # 캔버스 크기에 맞게 리사이즈
            self.image_canvas.update()
            canvas_width = self.image_canvas.winfo_width()
            canvas_height = self.image_canvas.winfo_height()
            
            if canvas_width > 1 and canvas_height > 1:
                # 비율 유지하며 리사이즈
                pil_image.thumbnail((canvas_width-10, canvas_height-10), Image.Resampling.LANCZOS)
            
            # PhotoImage로 변환
            self.original_photo = ImageTk.PhotoImage(pil_image)
            
            # 캔버스에 표시
            self.image_canvas.delete("all")
            self.image_canvas.create_image(canvas_width//2, canvas_height//2, 
                                         anchor=tk.CENTER, image=self.original_photo)
            
            # 이미지 정보 저장 (좌표 계산용)
            self.image_scale = min(canvas_width / pil_image.width, canvas_height / pil_image.height)
            self.image_offset_x = (canvas_width - pil_image.width * self.image_scale) // 2
            self.image_offset_y = (canvas_height - pil_image.height * self.image_scale) // 2
            
        except Exception as e:
            self.update_status(f"Error displaying image: {e}")
    
    def start_parsing(self):
        """파싱 시작"""
        if not self.current_image_path or not self.parser:
            return
        
        # UI 비활성화
        self.parse_btn.config(state=tk.DISABLED)
        self.update_status("Parsing dog face...")
        self.progress_label.config(text="Processing...")
        
        # 백그라운드에서 파싱 실행
        thread = threading.Thread(target=self.run_parsing, daemon=True)
        thread.start()
    
    def run_parsing(self):
        """파싱 실행 (백그라운드)"""
        try:
            # 파싱 수행
            results, message = self.parser.parse_dog_image(self.current_image_path)
            
            # 결과 저장
            self.parsing_results = results if results else []
            
            # UI 업데이트 (메인 스레드에서)
            if results:
                self.root.after(0, self.update_parsing_results)
            else:
                self.root.after(0, lambda: self.update_status(f"Parsing failed: {message}"))
            
        except Exception as e:
            self.root.after(0, lambda: self.update_status(f"Parsing error: {e}"))
        finally:
            self.root.after(0, lambda: self.parse_btn.config(state=tk.NORMAL))
            self.root.after(0, lambda: self.progress_label.config(text=""))
    
    def update_parsing_results(self):
        """파싱 결과 UI 업데이트"""
        if not self.parsing_results:
            self.update_status("No dog faces detected in the image")
            return
        
        # 얼굴 선택기 업데이트
        face_options = [f"Face {i+1} ({result['confidence']:.3f})" 
                       for i, result in enumerate(self.parsing_results)]
        self.face_combo['values'] = face_options
        self.face_combo.set(face_options[0])
        self.current_face_index = 0
        
        # 결과 표시
        self.display_current_face()
        
        # 저장 버튼 활성화
        self.save_btn.config(state=tk.NORMAL)
        
        self.update_status(f"Parsing complete: {len(self.parsing_results)} dog face(s) found")
    
    def display_current_face(self):
        """현재 선택된 얼굴 표시"""
        if not self.parsing_results or self.current_face_index >= len(self.parsing_results):
            return
        
        result = self.parsing_results[self.current_face_index]
        
        # 이미지에 분석 결과 오버레이
        self.draw_analysis_overlay(result)
        
        # 요약 정보 업데이트
        self.update_summary(result)
        
        # 세부 정보 업데이트
        self.update_details_tree(result)
        
        # 영역 목록 업데이트
        self.update_regions_list(result)
    
    def draw_analysis_overlay(self, result):
        """분석 결과를 이미지에 오버레이"""
        # 원본 이미지부터 다시 시작
        self.display_original_image(self.current_image_path)
        
        # 각 특징별로 그리기
        if self.show_vars['face'].get():
            self.draw_face_bbox(result['bbox'])
        
        features = result['features']
        
        if self.show_vars['eyes'].get() and features['eyes']:
            for eye in features['eyes']:
                self.draw_feature_bbox(eye['bbox'], self.colors['eyes'], "Eye")
        
        if self.show_vars['nose'].get() and features['nose']:
            for nose in features['nose']:
                self.draw_feature_bbox(nose['bbox'], self.colors['nose'], "Nose")
        
        if self.show_vars['mouth'].get() and features['mouth']:
            for mouth in features['mouth']:
                self.draw_feature_bbox(mouth['bbox'], self.colors['mouth'], "Mouth")
        
        if self.show_vars['ears'].get() and features['ears']:
            for ear in features['ears']:
                self.draw_feature_bbox(ear['bbox'], self.colors['ears'], f"Ear ({ear['side']})")
        
        if self.show_vars['landmarks'].get() and features['facial_landmarks']:
            for landmark in features['facial_landmarks']:
                self.draw_landmark_point(landmark['point'], landmark['region'])
    
    def draw_face_bbox(self, bbox):
        """얼굴 바운딩 박스 그리기"""
        x, y, w, h = bbox
        
        # 캔버스 좌표로 변환
        canvas_x1 = self.image_offset_x + x * self.image_scale
        canvas_y1 = self.image_offset_y + y * self.image_scale
        canvas_x2 = canvas_x1 + w * self.image_scale
        canvas_y2 = canvas_y1 + h * self.image_scale
        
        # 얼굴 박스 (두껍게)
        self.image_canvas.create_rectangle(
            canvas_x1, canvas_y1, canvas_x2, canvas_y2,
            outline='#00FF00', width=3, tags='overlay'
        )
        
        # 라벨
        self.image_canvas.create_text(
            canvas_x1 + 5, canvas_y1 - 15,
            text="Dog Face", fill='#00FF00',
            font=("Arial", 10, "bold"), anchor=tk.W, tags='overlay'
        )
    
    def draw_feature_bbox(self, bbox, color, label):
        """특징 바운딩 박스 그리기"""
        x, y, w, h = bbox
        
        # 캔버스 좌표로 변환
        canvas_x1 = self.image_offset_x + x * self.image_scale
        canvas_y1 = self.image_offset_y + y * self.image_scale
        canvas_x2 = canvas_x1 + w * self.image_scale
        canvas_y2 = canvas_y1 + h * self.image_scale
        
        # 색상을 hex로 변환
        color_hex = f"#{color[2]:02x}{color[1]:02x}{color[0]:02x}"
        
        # 박스
        self.image_canvas.create_rectangle(
            canvas_x1, canvas_y1, canvas_x2, canvas_y2,
            outline=color_hex, width=2, tags='overlay'
        )
        
        # 라벨
        self.image_canvas.create_text(
            canvas_x1, canvas_y1 - 5,
            text=label, fill=color_hex,
            font=("Arial", 8, "bold"), anchor=tk.W, tags='overlay'
        )
    
    def draw_landmark_point(self, point, region):
        """랜드마크 포인트 그리기"""
        x, y = point
        
        canvas_x = self.image_offset_x + x * self.image_scale
        canvas_y = self.image_offset_y + y * self.image_scale
        
        # 작은 원
        self.image_canvas.create_oval(
            canvas_x-2, canvas_y-2, canvas_x+2, canvas_y+2,
            fill='red', outline='red', tags='overlay'
        )
    
    def update_summary(self, result):
        """요약 정보 업데이트"""
        self.summary_text.delete(1.0, tk.END)
        
        features = result['features']
        summary = f"""Dog Face Analysis Summary
{"="*30}
Face Confidence: {result['confidence']:.3f}
Face Size: {result['bbox'][2]} x {result['bbox'][3]}

Detected Features:
• Eyes: {len(features['eyes'])}
• Nose: {len(features['nose'])}
• Mouth: {len(features['mouth'])}
• Ears: {len(features['ears'])}
• Landmarks: {len(features['facial_landmarks'])}

Detection Method: {result['method']}
"""
        
        self.summary_text.insert(tk.END, summary)
    
    def update_details_tree(self, result):
        """세부 정보 트리 업데이트"""
        # 기존 항목들 삭제
        for item in self.details_tree.get_children():
            self.details_tree.delete(item)
        
        features = result['features']
        
        # 얼굴 정보
        face_item = self.details_tree.insert('', 'end', text='Face', 
                                           values=(f"{result['bbox'][2]}x{result['bbox'][3]}", 
                                                  f"{result['confidence']:.3f}"))
        
        # 눈들
        if features['eyes']:
            eyes_item = self.details_tree.insert('', 'end', text='Eyes', 
                                                values=(f"{len(features['eyes'])} detected", ""))
            for i, eye in enumerate(features['eyes']):
                self.details_tree.insert(eyes_item, 'end', text=f'Eye {i+1}',
                                       values=(f"{eye['bbox'][2]}x{eye['bbox'][3]}", 
                                              f"{eye['confidence']:.3f}"))
        
        # 코
        if features['nose']:
            nose_item = self.details_tree.insert('', 'end', text='Nose',
                                                values=(f"{len(features['nose'])} detected", ""))
            for i, nose in enumerate(features['nose']):
                self.details_tree.insert(nose_item, 'end', text=f'Nose {i+1}',
                                       values=(f"{nose['bbox'][2]}x{nose['bbox'][3]}", 
                                              f"{nose['confidence']:.3f}"))
        
        # 입
        if features['mouth']:
            mouth_item = self.details_tree.insert('', 'end', text='Mouth',
                                                 values=(f"{len(features['mouth'])} detected", ""))
            for i, mouth in enumerate(features['mouth']):
                self.details_tree.insert(mouth_item, 'end', text=f'Mouth {i+1}',
                                       values=(f"{mouth['bbox'][2]}x{mouth['bbox'][3]}", 
                                              f"{mouth['confidence']:.3f}"))
        
        # 귀들
        if features['ears']:
            ears_item = self.details_tree.insert('', 'end', text='Ears',
                                                values=(f"{len(features['ears'])} detected", ""))
            for i, ear in enumerate(features['ears']):
                self.details_tree.insert(ears_item, 'end', text=f'Ear {i+1} ({ear["side"]})',
                                       values=(f"{ear['bbox'][2]}x{ear['bbox'][3]}", 
                                              f"{ear['confidence']:.3f}"))
        
        # 랜드마크
        if features['facial_landmarks']:
            landmarks_item = self.details_tree.insert('', 'end', text='Landmarks',
                                                     values=(f"{len(features['facial_landmarks'])} points", ""))
            
            # 영역별로 그룹화
            regions = {}
            for landmark in features['facial_landmarks']:
                region = landmark['region']
                if region not in regions:
                    regions[region] = []
                regions[region].append(landmark)
            
            for region, points in regions.items():
                region_item = self.details_tree.insert(landmarks_item, 'end', text=region.title(),
                                                      values=(f"{len(points)} points", ""))
    
    def update_regions_list(self, result):
        """추출된 영역 목록 업데이트"""
        self.regions_listbox.delete(0, tk.END)
        self.region_images = result['regions']
        
        for region_name in self.region_images.keys():
            self.regions_listbox.insert(tk.END, region_name)
    
    def on_face_selected(self, event):
        """얼굴 선택 시 호출"""
        selection = self.face_combo.current()
        if 0 <= selection < len(self.parsing_results):
            self.current_face_index = selection
            self.display_current_face()
    
    def on_feature_selected(self, event):
        """특징 트리 선택 시 호출"""
        selection = self.details_tree.selection()
        if selection:
            item = selection[0]
            feature_name = self.details_tree.item(item, 'text')
            # 해당 특징을 이미지에서 하이라이트할 수 있음
    
    def on_region_selected(self, event):
        """영역 선택 시 호출"""
        selection = self.regions_listbox.curselection()
        if selection:
            region_name = self.regions_listbox.get(selection[0])
            self.display_selected_region(region_name)
    
    def display_selected_region(self, region_name):
        """선택된 영역 표시"""
        if region_name not in self.region_images:
            return
        
        try:
            region_img = self.region_images[region_name]
            
            # OpenCV BGR to RGB
            if len(region_img.shape) == 3:
                region_rgb = cv2.cvtColor(region_img, cv2.COLOR_BGR2RGB)
            else:
                region_rgb = region_img
            
            # PIL Image로 변환
            pil_img = Image.fromarray(region_rgb)
            
            # 캔버스 크기에 맞게 리사이즈
            canvas_width = self.region_canvas.winfo_width()
            canvas_height = self.region_canvas.winfo_height()
            
            if canvas_width > 1 and canvas_height > 1:
                pil_img.thumbnail((canvas_width-10, canvas_height-10), Image.Resampling.LANCZOS)
            
            # PhotoImage로 변환
            photo = ImageTk.PhotoImage(pil_img)
            
            # 캔버스에 표시
            self.region_canvas.delete("all")
            self.region_canvas.create_image(canvas_width//2, canvas_height//2, 
                                          anchor=tk.CENTER, image=photo)
            self.region_canvas.image = photo  # 참조 유지
            
            # 영역 정보 표시
            self.region_info_text.delete(1.0, tk.END)
            info = f"""Region: {region_name}
Size: {region_img.shape[1]} x {region_img.shape[0]}
Channels: {region_img.shape[2] if len(region_img.shape) == 3 else 1}
Data type: {region_img.dtype}"""
            
            self.region_info_text.insert(tk.END, info)
            
        except Exception as e:
            self.update_status(f"Error displaying region: {e}")
    
    def save_analysis(self):
        """분석 결과 저장"""
        if not self.parsing_results:
            return
        
        # 저장 디렉토리 선택
        save_dir = filedialog.askdirectory(title="Select Save Directory")
        if not save_dir:
            return
        
        save_path = Path(save_dir)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        try:
            # 1. 분석 결과 JSON 저장
            json_file = save_path / f"dog_face_analysis_{timestamp}.json"
            
            # 결과 데이터 준비 (regions는 제외, 너무 크므로)
            save_data = []
            for result in self.parsing_results:
                save_result = {
                    'face_id': result['face_id'],
                    'bbox': result['bbox'],
                    'confidence': float(result['confidence']),
                    'method': result['method'],
                    'features': {
                        'eyes': [{'bbox': [int(x) for x in eye['bbox']], 
                                'confidence': float(eye['confidence']),
                                'method': eye['method']} for eye in result['features']['eyes']],
                        'nose': [{'bbox': [int(x) for x in nose['bbox']], 
                                'confidence': float(nose['confidence']),
                                'method': nose['method']} for nose in result['features']['nose']],
                        'mouth': [{'bbox': [int(x) for x in mouth['bbox']], 
                                 'confidence': float(mouth['confidence']),
                                 'method': mouth['method']} for mouth in result['features']['mouth']],
                        'ears': [{'bbox': [int(x) for x in ear['bbox']], 
                                'confidence': float(ear['confidence']),
                                'method': ear['method'],
                                'side': ear['side']} for ear in result['features']['ears']],
                        'facial_landmarks': [{'point': [int(x) for x in lm['point']],
                                            'region': lm['region']} for lm in result['features']['facial_landmarks']]
                    }
                }
                save_data.append(save_result)
            
            with open(json_file, 'w') as f:
                json.dump({
                    'source_image': self.current_image_path,
                    'timestamp': timestamp,
                    'total_faces': len(self.parsing_results),
                    'faces': save_data
                }, f, indent=2)
            
            # 2. 분석된 이미지 저장 (현재 표시된 것)
            # 스크린샷 방식으로 캔버스 내용 저장
            
            # 3. 추출된 영역들 개별 저장
            current_result = self.parsing_results[self.current_face_index]
            regions_dir = save_path / f"regions_{timestamp}"
            regions_dir.mkdir(exist_ok=True)
            
            for region_name, region_img in current_result['regions'].items():
                region_file = regions_dir / f"{region_name}.jpg"
                cv2.imwrite(str(region_file), region_img)
            
            self.update_status(f"Analysis saved to {save_path}")
            messagebox.showinfo("Success", f"Analysis results saved to:\n{save_path}")
            
        except Exception as e:
            self.update_status(f"Save failed: {e}")
            messagebox.showerror("Error", f"Failed to save analysis:\n{e}")
    
    def update_image_display(self):
        """이미지 표시 업데이트 (체크박스 변경 시)"""
        if self.parsing_results:
            self.display_current_face()
    
    def clear_all(self):
        """모든 내용 초기화"""
        self.current_image_path = None
        self.parsing_results = []
        self.current_face_index = 0
        self.region_images = {}
        
        # UI 초기화
        self.image_canvas.delete("all")
        self.region_canvas.delete("all")
        
        self.summary_text.delete(1.0, tk.END)
        self.region_info_text.delete(1.0, tk.END)
        
        for item in self.details_tree.get_children():
            self.details_tree.delete(item)
        
        self.regions_listbox.delete(0, tk.END)
        
        self.face_combo.set("No faces detected")
        self.face_combo['values'] = []
        
        # 버튼 상태
        self.parse_btn.config(state=tk.DISABLED)
        self.save_btn.config(state=tk.DISABLED)
        
        self.update_status("Cleared - Select a new image")
    
    def clear_results(self):
        """결과만 초기화"""
        self.parsing_results = []
        self.current_face_index = 0
        self.region_images = {}
        
        # 오버레이 제거
        self.image_canvas.delete("overlay")
        
        self.save_btn.config(state=tk.DISABLED)
    
    # 이벤트 핸들러들
    def on_canvas_click(self, event):
        """캔버스 클릭 시 좌표 정보 표시"""
        if hasattr(self, 'image_scale'):
            # 이미지 좌표로 변환
            img_x = (event.x - self.image_offset_x) / self.image_scale
            img_y = (event.y - self.image_offset_y) / self.image_scale
            
            self.progress_label.config(text=f"({int(img_x)}, {int(img_y)})")
    
    def on_canvas_motion(self, event):
        """마우스 움직임 시 좌표 표시"""
        if hasattr(self, 'image_scale'):
            img_x = (event.x - self.image_offset_x) / self.image_scale
            img_y = (event.y - self.image_offset_y) / self.image_scale
            
            # 이미지 영역 내에서만 표시
            if 0 <= img_x <= 1000 and 0 <= img_y <= 1000:  # 대략적인 이미지 크기
                self.progress_label.config(text=f"({int(img_x)}, {int(img_y)})")
    
    def update_status(self, message):
        """상태 메시지 업데이트"""
        self.status_label.config(text=message)


def main():
    """메인 함수"""
    root = tk.Tk()
    app = DogFaceParserGUI(root)
    
    if not PARSER_AVAILABLE:
        messagebox.showerror("Error", 
                           "DogFaceParser module not found!\n"
                           "Make sure dog_face_parser.py is in the same directory.")
    
    root.mainloop()


if __name__ == "__main__":
    print("Dog Face Parser GUI v1.0")
    print("="*40)
    
    if not PARSER_AVAILABLE:
        print("WARNING: DogFaceParser not available!")
        print("Make sure dog_face_parser.py is in the same directory")
    else:
        print("Ready to analyze dog faces!")
    
    main()