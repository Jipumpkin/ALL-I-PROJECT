#!/usr/bin/env python3
"""
Dog Face Parser - 강아지 얼굴 전용 파싱 시스템
강아지 얼굴의 세부 부위(눈, 코, 입, 귀, 눈썹 등)를 개별적으로 탐지하고 추출
"""
import cv2
import numpy as np
from pathlib import Path
import json
from datetime import datetime
import math

class DogFaceParser:
    """강아지 얼굴 파싱 전용 클래스"""
    
    def __init__(self):
        self.cascades = {}
        self.face_regions = {}
        self.dog_features = {}
        
        # 강아지 얼굴 특징점 정의
        self.dog_anatomy = {
            'eyes': {'expected_count': 2, 'relative_position': (0.3, 0.4), 'size_ratio': 0.1},
            'nose': {'expected_count': 1, 'relative_position': (0.5, 0.6), 'size_ratio': 0.08},
            'mouth': {'expected_count': 1, 'relative_position': (0.5, 0.75), 'size_ratio': 0.15},
            'ears': {'expected_count': 2, 'relative_position': (0.2, 0.8, 0.2), 'size_ratio': 0.2},
            'snout': {'relative_position': (0.4, 0.6, 0.5, 0.8), 'size_ratio': 0.3}
        }
        
        self.load_cascades()
    
    def load_cascades(self):
        """강아지 탐지에 최적화된 Cascade 로드"""
        print("Loading Dog-optimized Haar Cascades...")
        
        cascade_path = cv2.data.haarcascades
        cascade_files = {
            'frontal_face': 'haarcascade_frontalface_default.xml',
            'frontal_face_alt': 'haarcascade_frontalface_alt.xml', 
            'profile_face': 'haarcascade_profileface.xml',
            'eye': 'haarcascade_eye.xml',
            'eye_tree': 'haarcascade_eye_tree_eyeglasses.xml'
        }
        
        for name, file in cascade_files.items():
            try:
                full_path = cascade_path + file
                cascade = cv2.CascadeClassifier(full_path)
                if not cascade.empty():
                    self.cascades[name] = cascade
                    print(f"OK: {name}")
                else:
                    print(f"FAIL: {name}")
            except Exception as e:
                print(f"ERROR loading {name}: {e}")
    
    def preprocess_for_dog_detection(self, image):
        """강아지 탐지에 최적화된 전처리"""
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # 1. 강아지 털 패턴을 고려한 CLAHE
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        enhanced = clahe.apply(gray)
        
        # 2. 강아지 얼굴 형태에 맞는 가우시안 블러
        blurred = cv2.GaussianBlur(enhanced, (5, 5), 0)
        
        # 3. 엣지 강화 (털과 피부 경계 강조)
        kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
        sharpened = cv2.filter2D(blurred, -1, kernel)
        
        # 4. 노이즈 제거
        denoised = cv2.bilateralFilter(sharpened, 9, 75, 75)
        
        return {
            'original': gray,
            'enhanced': enhanced,
            'blurred': blurred,
            'sharpened': sharpened,
            'denoised': denoised
        }
    
    def detect_dog_face(self, image):
        """강아지 얼굴 탐지 (개선된 알고리즘)"""
        preprocessed = self.preprocess_for_dog_detection(image)
        face_candidates = []
        
        # 다양한 전처리 이미지와 파라미터로 탐지
        detection_configs = [
            # (이미지, scaleFactor, minNeighbors, minSize, maxSize)
            (preprocessed['enhanced'], 1.05, 3, (40, 40), (300, 300)),
            (preprocessed['denoised'], 1.1, 4, (30, 30), (250, 250)),
            (preprocessed['sharpened'], 1.15, 5, (50, 50), (400, 400)),
            (preprocessed['blurred'], 1.08, 3, (35, 35), (200, 200))
        ]
        
        for cascade_name, cascade in self.cascades.items():
            if 'face' not in cascade_name:
                continue
                
            for processed_img, scale, neighbors, min_size, max_size in detection_configs:
                faces = cascade.detectMultiScale(
                    processed_img,
                    scaleFactor=scale,
                    minNeighbors=neighbors,
                    minSize=min_size,
                    maxSize=max_size,
                    flags=cv2.CASCADE_SCALE_IMAGE
                )
                
                for (x, y, w, h) in faces:
                    # 강아지 얼굴 형태 검증
                    if self.validate_dog_face_shape(x, y, w, h, processed_img.shape):
                        confidence = self.calculate_dog_face_confidence(
                            processed_img[y:y+h, x:x+w], cascade_name, scale, neighbors
                        )
                        
                        face_candidates.append({
                            'bbox': (x, y, w, h),
                            'confidence': confidence,
                            'method': f'{cascade_name}_{scale}',
                            'area': w * h
                        })
        
        # NMS 적용 및 최적 얼굴 선택
        return self.select_best_dog_faces(face_candidates)
    
    def validate_dog_face_shape(self, x, y, w, h, img_shape):
        """강아지 얼굴 형태 유효성 검증"""
        img_h, img_w = img_shape
        
        # 1. 크기 검증 (이미지 대비 적절한 크기)
        face_area = w * h
        img_area = img_w * img_h
        area_ratio = face_area / img_area
        
        if not (0.01 < area_ratio < 0.6):  # 1% ~ 60%
            return False
        
        # 2. 종횡비 검증 (강아지 얼굴 비율)
        aspect_ratio = w / h
        if not (0.7 < aspect_ratio < 1.8):  # 강아지는 다양한 비율 허용
            return False
        
        # 3. 위치 검증 (가장자리 너무 가까이 있으면 제외)
        if x < img_w * 0.05 or y < img_h * 0.05:
            return False
        if x + w > img_w * 0.95 or y + h > img_h * 0.95:
            return False
        
        return True
    
    def calculate_dog_face_confidence(self, face_roi, method, scale_factor, min_neighbors):
        """강아지 얼굴 신뢰도 계산"""
        base_confidence = 0.5
        
        # 1. 크기 기반 점수
        area = face_roi.shape[0] * face_roi.shape[1]
        size_score = min(1.0, area / 10000.0)  # 100x100 기준
        
        # 2. 탐지 방법 기반 점수
        method_scores = {
            'frontal_face': 0.9,
            'frontal_face_alt': 0.8,
            'profile_face': 0.7
        }
        method_score = method_scores.get(method.split('_')[0] + '_' + method.split('_')[1], 0.6)
        
        # 3. 파라미터 기반 점수
        param_score = (min_neighbors - 2) / 8.0  # minNeighbors가 높을수록 신뢰도 증가
        param_score += (1.2 - scale_factor) * 2  # scaleFactor가 낮을수록 정밀
        
        # 4. 얼굴 내 특징 검증
        feature_score = self.analyze_face_features(face_roi)
        
        # 최종 신뢰도
        confidence = base_confidence + (size_score * 0.2) + (method_score * 0.3) + \
                    (param_score * 0.2) + (feature_score * 0.3)
        
        return min(1.0, confidence)
    
    def analyze_face_features(self, face_roi):
        """얼굴 ROI 내 특징 분석"""
        try:
            h, w = face_roi.shape
            score = 0.0
            
            # 1. 눈 영역 분석 (상단 1/3 지역)
            eye_region = face_roi[int(h*0.2):int(h*0.5), int(w*0.1):int(w*0.9)]
            eye_circles = cv2.HoughCircles(
                eye_region, cv2.HOUGH_GRADIENT, 1, int(w*0.3),
                param1=50, param2=30, minRadius=3, maxRadius=int(w*0.15)
            )
            if eye_circles is not None and len(eye_circles[0]) >= 1:
                score += 0.3  # 눈 검출 시 보너스
            
            # 2. 코/입 영역 분석 (하단 2/3 지역)
            nose_region = face_roi[int(h*0.4):int(h*0.9), int(w*0.3):int(w*0.7)]
            
            # 엣지 밀도 분석
            edges = cv2.Canny(nose_region, 50, 150)
            edge_density = np.sum(edges) / (edges.shape[0] * edges.shape[1])
            if 0.01 < edge_density < 0.1:  # 적절한 엣지 밀도
                score += 0.2
            
            # 3. 대칭성 검사
            left_half = face_roi[:, :w//2]
            right_half = cv2.flip(face_roi[:, w//2:], 1)
            
            if left_half.shape == right_half.shape:
                correlation = cv2.matchTemplate(left_half, right_half, cv2.TM_CCOEFF_NORMED)
                if correlation[0][0] > 0.3:  # 어느 정도 대칭
                    score += 0.2
            
            return min(1.0, score)
            
        except:
            return 0.1
    
    def select_best_dog_faces(self, candidates):
        """최적의 강아지 얼굴 선택"""
        if not candidates:
            return []
        
        # 1. 신뢰도 기준으로 정렬
        candidates.sort(key=lambda x: x['confidence'], reverse=True)
        
        # 2. NMS 적용
        final_faces = []
        for candidate in candidates:
            overlap = False
            for selected in final_faces:
                if self.calculate_overlap(candidate['bbox'], selected['bbox']) > 0.3:
                    overlap = True
                    break
            
            if not overlap:
                final_faces.append(candidate)
                
            if len(final_faces) >= 3:  # 최대 3개 얼굴
                break
        
        return final_faces
    
    def parse_dog_face_features(self, image, face_bbox):
        """강아지 얼굴 내 세부 특징 파싱"""
        x, y, w, h = face_bbox
        face_roi = image[y:y+h, x:x+w]
        
        features = {
            'eyes': [],
            'nose': [],
            'mouth': [],
            'ears': [],
            'facial_landmarks': []
        }
        
        # 1. 눈 탐지
        features['eyes'] = self.detect_dog_eyes(face_roi, (x, y))
        
        # 2. 코 탐지  
        features['nose'] = self.detect_dog_nose(face_roi, (x, y))
        
        # 3. 입 탐지
        features['mouth'] = self.detect_dog_mouth(face_roi, (x, y))
        
        # 4. 귀 탐지 (얼굴 확장 영역에서)
        extended_roi = self.get_extended_face_region(image, face_bbox)
        features['ears'] = self.detect_dog_ears(extended_roi, face_bbox)
        
        # 5. 얼굴 랜드마크
        features['facial_landmarks'] = self.detect_facial_landmarks(face_roi, (x, y))
        
        return features
    
    def detect_dog_eyes(self, face_roi, face_offset):
        """강아지 눈 탐지"""
        eyes = []
        h, w = face_roi.shape[:2]
        
        # 눈 영역 (얼굴 상단 절반)
        eye_region = face_roi[int(h*0.15):int(h*0.55), int(w*0.1):int(w*0.9)]
        
        # 이미지 유효성 검사
        if eye_region.size == 0 or len(eye_region.shape) != 2:
            return eyes
        
        # 1. Haar Cascade로 눈 탐지
        if 'eye' in self.cascades:
            detected_eyes = self.cascades['eye'].detectMultiScale(
                eye_region, scaleFactor=1.1, minNeighbors=3, minSize=(8, 8), maxSize=(50, 50)
            )
            
            for (ex, ey, ew, eh) in detected_eyes:
                # 전체 이미지 좌표로 변환
                abs_x = face_offset[0] + int(w*0.1) + ex
                abs_y = face_offset[1] + int(h*0.15) + ey
                
                eyes.append({
                    'bbox': (abs_x, abs_y, ew, eh),
                    'center': (abs_x + ew//2, abs_y + eh//2),
                    'confidence': 0.8,
                    'method': 'haar_cascade'
                })
        
        # 2. 원형 검출로 눈 탐지
        eye_circles = cv2.HoughCircles(
            eye_region, cv2.HOUGH_GRADIENT, 1, int(w*0.2),
            param1=50, param2=25, minRadius=5, maxRadius=int(w*0.12)
        )
        
        if eye_circles is not None:
            for (cx, cy, r) in np.round(eye_circles[0, :]).astype("int")[:4]:
                abs_x = face_offset[0] + int(w*0.1) + cx - r
                abs_y = face_offset[1] + int(h*0.15) + cy - r
                
                eyes.append({
                    'bbox': (abs_x, abs_y, 2*r, 2*r),
                    'center': (abs_x + r, abs_y + r),
                    'confidence': min(1.0, r / 20.0),
                    'method': 'hough_circle'
                })
        
        # 중복 제거 및 최적 눈 선택
        return self.filter_best_eyes(eyes, max_eyes=2)
    
    def detect_dog_nose(self, face_roi, face_offset):
        """강아지 코 탐지"""
        noses = []
        h, w = face_roi.shape[:2]
        
        # 코 영역 (얼굴 중앙 하단)
        nose_region = face_roi[int(h*0.45):int(h*0.75), int(w*0.35):int(w*0.65)]
        
        # 이미지 유효성 검사
        if nose_region.size == 0 or len(nose_region.shape) != 2:
            return noses
        
        # 1. 타원/원형 검출
        nose_circles = cv2.HoughCircles(
            nose_region, cv2.HOUGH_GRADIENT, 1, 30,
            param1=40, param2=20, minRadius=3, maxRadius=25
        )
        
        if nose_circles is not None:
            for (cx, cy, r) in np.round(nose_circles[0, :]).astype("int")[:2]:
                abs_x = face_offset[0] + int(w*0.35) + cx - r
                abs_y = face_offset[1] + int(h*0.45) + cy - r
                
                # 코 형태 검증
                nose_roi = nose_region[max(0, cy-r):min(nose_region.shape[0], cy+r), 
                                     max(0, cx-r):min(nose_region.shape[1], cx+r)]
                
                if nose_roi.size > 0:
                    darkness_score = self.analyze_nose_darkness(nose_roi)
                    
                    noses.append({
                        'bbox': (abs_x, abs_y, 2*r, 2*r),
                        'center': (abs_x + r, abs_y + r),
                        'confidence': darkness_score,
                        'method': 'circle_detection'
                    })
        
        # 2. 윤곽선 기반 코 탐지
        edges = cv2.Canny(nose_region, 50, 150)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if 20 < area < 500:  # 적절한 크기
                x_c, y_c, w_c, h_c = cv2.boundingRect(contour)
                
                # 코 형태 비율 검증
                aspect_ratio = w_c / h_c
                if 0.6 < aspect_ratio < 1.8:
                    abs_x = face_offset[0] + int(w*0.35) + x_c
                    abs_y = face_offset[1] + int(h*0.45) + y_c
                    
                    noses.append({
                        'bbox': (abs_x, abs_y, w_c, h_c),
                        'center': (abs_x + w_c//2, abs_y + h_c//2),
                        'confidence': min(1.0, area / 200.0),
                        'method': 'contour_detection'
                    })
        
        # 최적 코 선택
        if noses:
            noses.sort(key=lambda x: x['confidence'], reverse=True)
            return [noses[0]]
        return []
    
    def detect_dog_mouth(self, face_roi, face_offset):
        """강아지 입 탐지"""
        mouths = []
        h, w = face_roi.shape[:2]
        
        # 입 영역 (얼굴 하단)
        mouth_region = face_roi[int(h*0.65):int(h*0.95), int(w*0.2):int(w*0.8)]
        
        # 이미지 유효성 검사
        if mouth_region.size == 0 or len(mouth_region.shape) != 2:
            return mouths
        
        # 엣지 검출
        edges = cv2.Canny(mouth_region, 30, 100)
        
        # 수평선 검출 (입술선)
        lines = cv2.HoughLines(edges, 1, np.pi/180, threshold=20)
        
        if lines is not None:
            horizontal_lines = []
            for rho, theta in lines[:10, 0]:
                # 수평에 가까운 선만 선택
                angle = theta * 180 / np.pi
                if 80 < angle < 100 or -10 < angle < 10:
                    horizontal_lines.append((rho, theta))
            
            if horizontal_lines:
                # 가장 긴 수평선을 입으로 간주
                rho, theta = horizontal_lines[0]
                
                # 입 영역 추정
                mouth_y = int(rho * np.sin(theta))
                mouth_x = int(w * 0.2)
                mouth_w = int(w * 0.6)
                mouth_h = 15
                
                abs_x = face_offset[0] + mouth_x
                abs_y = face_offset[1] + int(h*0.65) + mouth_y
                
                mouths.append({
                    'bbox': (abs_x, abs_y, mouth_w, mouth_h),
                    'center': (abs_x + mouth_w//2, abs_y + mouth_h//2),
                    'confidence': 0.7,
                    'method': 'line_detection'
                })
        
        return mouths
    
    def detect_dog_ears(self, extended_roi, face_bbox):
        """강아지 귀 탐지"""
        ears = []
        fx, fy, fw, fh = face_bbox
        
        # 귀 검색 영역 (얼굴 양쪽과 위쪽)
        search_regions = [
            # 왼쪽 귀
            (max(0, fx - fw//3), fy, fw//2, int(fh*0.8)),
            # 오른쪽 귀  
            (fx + fw - fw//6, fy, fw//2, int(fh*0.8)),
            # 위쪽 (서있는 귀)
            (fx, max(0, fy - fh//4), fw, fh//2)
        ]
        
        for i, (sx, sy, sw, sh) in enumerate(search_regions):
            # 영역 유효성 검사
            if sx + sw > extended_roi.shape[1] or sy + sh > extended_roi.shape[0]:
                continue
            
            ear_region = extended_roi[sy:sy+sh, sx:sx+sw]
            if ear_region.size == 0:
                continue
            
            # 엣지 기반 귀 탐지
            edges = cv2.Canny(ear_region, 50, 150)
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            for contour in contours:
                area = cv2.contourArea(contour)
                if 100 < area < 2000:
                    ex, ey, ew, eh = cv2.boundingRect(contour)
                    
                    # 귀 형태 검증
                    aspect_ratio = ew / eh
                    if (i < 2 and eh > ew) or (i == 2 and 0.5 < aspect_ratio < 2.0):
                        ears.append({
                            'bbox': (sx + ex, sy + ey, ew, eh),
                            'center': (sx + ex + ew//2, sy + ey + eh//2),
                            'confidence': min(1.0, area / 1000.0),
                            'method': 'contour_detection',
                            'side': 'left' if i == 0 else 'right' if i == 1 else 'top'
                        })
        
        return ears[:2]  # 최대 2개 귀
    
    def detect_facial_landmarks(self, face_roi, face_offset):
        """얼굴 랜드마크 검출"""
        landmarks = []
        h, w = face_roi.shape[:2]
        
        # ORB 특징점 검출
        orb = cv2.ORB_create(nfeatures=100)
        keypoints = orb.detect(face_roi, None)
        
        # 특징점을 얼굴 영역별로 분류
        for kp in keypoints:
            x, y = kp.pt
            abs_x = face_offset[0] + int(x)
            abs_y = face_offset[1] + int(y)
            
            # 영역 분류
            region = 'unknown'
            if y < h * 0.4:
                region = 'forehead'
            elif y < h * 0.6:
                region = 'eye_area'
            elif y < h * 0.8:
                region = 'nose_area'
            else:
                region = 'mouth_area'
            
            landmarks.append({
                'point': (abs_x, abs_y),
                'region': region,
                'response': kp.response
            })
        
        return landmarks[:20]  # 상위 20개
    
    def extract_face_regions(self, image, face_bbox, features):
        """얼굴 영역별 이미지 추출"""
        x, y, w, h = face_bbox
        face_roi = image[y:y+h, x:x+w]
        
        regions = {}
        
        # 전체 얼굴
        regions['full_face'] = face_roi
        
        # 눈 영역들
        for i, eye in enumerate(features['eyes']):
            ex, ey, ew, eh = eye['bbox']
            # 전체 이미지에서 추출
            if ex >= 0 and ey >= 0:
                eye_roi = image[ey:ey+eh, ex:ex+ew]
                regions[f'eye_{i+1}'] = eye_roi
        
        # 코 영역
        for i, nose in enumerate(features['nose']):
            nx, ny, nw, nh = nose['bbox']
            if nx >= 0 and ny >= 0:
                nose_roi = image[ny:ny+nh, nx:nx+nw]
                regions[f'nose_{i+1}'] = nose_roi
        
        # 입 영역
        for i, mouth in enumerate(features['mouth']):
            mx, my, mw, mh = mouth['bbox']
            if mx >= 0 and my >= 0:
                mouth_roi = image[my:my+mh, mx:mx+mw]
                regions[f'mouth_{i+1}'] = mouth_roi
        
        # 귀 영역들
        for i, ear in enumerate(features['ears']):
            ear_x, ear_y, ear_w, ear_h = ear['bbox']
            if ear_x >= 0 and ear_y >= 0:
                ear_roi = image[ear_y:ear_y+ear_h, ear_x:ear_x+ear_w]
                regions[f'ear_{ear["side"]}'] = ear_roi
        
        return regions
    
    def parse_dog_image(self, image_path):
        """강아지 이미지 전체 파싱 프로세스"""
        print(f"Parsing dog image: {image_path}")
        
        # 이미지 로드
        image = cv2.imread(str(image_path))
        if image is None:
            return None, "Failed to load image"
        
        # 1. 강아지 얼굴 탐지
        print("Detecting dog faces...")
        dog_faces = self.detect_dog_face(image)
        
        if not dog_faces:
            return None, "No dog faces detected"
        
        results = []
        
        # 2. 각 얼굴에 대해 세부 특징 파싱
        for i, face in enumerate(dog_faces):
            print(f"Parsing face {i+1}/{len(dog_faces)}...")
            
            # 특징 파싱
            features = self.parse_dog_face_features(image, face['bbox'])
            
            # 영역 추출
            regions = self.extract_face_regions(image, face['bbox'], features)
            
            # 결과 정리
            face_result = {
                'face_id': i + 1,
                'bbox': face['bbox'],
                'confidence': face['confidence'],
                'features': features,
                'regions': regions,
                'method': face['method']
            }
            
            results.append(face_result)
        
        return results, "Success"
    
    # 유틸리티 함수들
    def calculate_overlap(self, bbox1, bbox2):
        """두 바운딩 박스의 겹침 정도 계산"""
        x1, y1, w1, h1 = bbox1
        x2, y2, w2, h2 = bbox2
        
        xi1, yi1 = max(x1, x2), max(y1, y2)
        xi2, yi2 = min(x1+w1, x2+w2), min(y1+h1, y2+h2)
        
        if xi1 < xi2 and yi1 < yi2:
            inter_area = (xi2 - xi1) * (yi2 - yi1)
            union_area = w1*h1 + w2*h2 - inter_area
            return inter_area / union_area if union_area > 0 else 0
        return 0
    
    def get_extended_face_region(self, image, face_bbox):
        """얼굴 주변 확장 영역 추출"""
        x, y, w, h = face_bbox
        img_h, img_w = image.shape[:2]
        
        # 20% 확장
        margin_w, margin_h = int(w * 0.2), int(h * 0.2)
        
        ext_x = max(0, x - margin_w)
        ext_y = max(0, y - margin_h)
        ext_w = min(img_w - ext_x, w + 2 * margin_w)
        ext_h = min(img_h - ext_y, h + 2 * margin_h)
        
        return image[ext_y:ext_y+ext_h, ext_x:ext_x+ext_w]
    
    def filter_best_eyes(self, eyes, max_eyes=2):
        """최적의 눈 선택"""
        if not eyes:
            return []
        
        # 신뢰도 순 정렬
        eyes.sort(key=lambda x: x['confidence'], reverse=True)
        
        # 중복 제거
        filtered = []
        for eye in eyes:
            overlap = False
            for selected in filtered:
                if self.calculate_overlap(eye['bbox'], selected['bbox']) > 0.5:
                    overlap = True
                    break
            
            if not overlap:
                filtered.append(eye)
                
            if len(filtered) >= max_eyes:
                break
        
        return filtered
    
    def analyze_nose_darkness(self, nose_roi):
        """코의 어둠 정도 분석 (강아지 코는 보통 어둡다)"""
        if nose_roi.size == 0:
            return 0.1
        
        # 평균 밝기
        avg_brightness = np.mean(nose_roi)
        
        # 어두울수록 높은 점수 (강아지 코 특징)
        darkness_score = max(0, (255 - avg_brightness) / 255.0)
        
        return min(1.0, darkness_score + 0.2)  # 최소 0.2 보장


def test_dog_face_parser():
    """강아지 얼굴 파서 테스트"""
    print("Dog Face Parser Test")
    print("="*30)
    
    parser = DogFaceParser()
    
    # 테스트 이미지 생성 (강아지 얼굴 모양)
    test_image_path = 'test_dog_face.jpg'
    
    if not Path(test_image_path).exists():
        print("Creating test dog face image...")
        
        # 강아지 얼굴 모양의 테스트 이미지
        img = np.ones((500, 400, 3), dtype=np.uint8) * 200
        
        # 얼굴 윤곽 (타원)
        cv2.ellipse(img, (200, 200), (120, 140), 0, 0, 360, (180, 150, 120), -1)
        
        # 눈들
        cv2.circle(img, (160, 160), 15, (50, 50, 50), -1)  # 왼쪽 눈
        cv2.circle(img, (240, 160), 15, (50, 50, 50), -1)  # 오른쪽 눈
        
        # 코
        cv2.ellipse(img, (200, 220), (12, 8), 0, 0, 360, (30, 30, 30), -1)
        
        # 입
        cv2.ellipse(img, (200, 260), (25, 15), 0, 0, 180, (100, 100, 100), 2)
        
        # 귀들
        cv2.ellipse(img, (120, 120), (30, 60), -30, 0, 360, (150, 120, 100), -1)
        cv2.ellipse(img, (280, 120), (30, 60), 30, 0, 360, (150, 120, 100), -1)
        
        cv2.imwrite(test_image_path, img)
        print(f"Test image created: {test_image_path}")
    
    # 파싱 실행
    results, message = parser.parse_dog_image(test_image_path)
    
    if results:
        print(f"SUCCESS: {message}")
        print(f"Found {len(results)} dog face(s)")
        
        for i, result in enumerate(results, 1):
            print(f"\nDog Face #{i}:")
            print(f"  Confidence: {result['confidence']:.3f}")
            print(f"  BBox: {result['bbox']}")
            print(f"  Eyes: {len(result['features']['eyes'])}")
            print(f"  Nose: {len(result['features']['nose'])}")
            print(f"  Mouth: {len(result['features']['mouth'])}")
            print(f"  Ears: {len(result['features']['ears'])}")
            print(f"  Landmarks: {len(result['features']['facial_landmarks'])}")
            print(f"  Extracted regions: {list(result['regions'].keys())}")
    else:
        print(f"FAILED: {message}")
    
    return results is not None

if __name__ == "__main__":
    test_dog_face_parser()