#!/usr/bin/env python3
"""
Basic Enhanced Animal Detector - PyTorch/YOLO 없이 동작하는 버전
"""
import cv2
import numpy as np
from pathlib import Path
import json
from datetime import datetime

class BasicEnhancedDetector:
    """기본 라이브러리만 사용하는 향상된 탐지기"""
    
    def __init__(self):
        self.cascades = {}
        self.load_cascades()
    
    def load_cascades(self):
        """Haar Cascade들 로드"""
        print("Loading Haar Cascades...")
        
        cascade_path = cv2.data.haarcascades
        cascade_files = {
            'frontal_face': 'haarcascade_frontalface_default.xml',
            'frontal_face_alt': 'haarcascade_frontalface_alt.xml',
            'profile_face': 'haarcascade_profileface.xml',
            'eye': 'haarcascade_eye.xml',
        }
        
        for name, file in cascade_files.items():
            try:
                full_path = cascade_path + file
                cascade = cv2.CascadeClassifier(full_path)
                if not cascade.empty():
                    self.cascades[name] = cascade
                    print(f"OK: {name}")
                else:
                    print(f"FAILED: {name}")
            except Exception as e:
                print(f"ERROR loading {name}: {e}")
    
    def enhanced_preprocessing(self, image):
        """향상된 전처리"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
        
        # 1. CLAHE 적용
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced = clahe.apply(gray)
        
        # 2. 가우시안 블러
        blurred = cv2.GaussianBlur(enhanced, (3, 3), 0)
        
        # 3. 히스토그램 균등화
        equalized = cv2.equalizeHist(blurred)
        
        return {
            'original': gray,
            'clahe': enhanced,
            'blurred': blurred,
            'equalized': equalized
        }
    
    def detect_with_multiple_cascades(self, image):
        """여러 Cascade로 탐지"""
        preprocessed = self.enhanced_preprocessing(image)
        all_detections = []
        
        for cascade_name, cascade in self.cascades.items():
            for preprocess_name, processed_img in preprocessed.items():
                # 다양한 파라미터로 탐지
                params_sets = [
                    {'scaleFactor': 1.05, 'minNeighbors': 3},
                    {'scaleFactor': 1.1, 'minNeighbors': 4},
                    {'scaleFactor': 1.15, 'minNeighbors': 5},
                ]
                
                for params in params_sets:
                    faces = cascade.detectMultiScale(
                        processed_img,
                        scaleFactor=params['scaleFactor'],
                        minNeighbors=params['minNeighbors'],
                        minSize=(20, 20),
                        maxSize=(300, 300)
                    )
                    
                    for (x, y, w, h) in faces:
                        # 크기 기반 신뢰도
                        area = w * h
                        img_area = processed_img.shape[0] * processed_img.shape[1]
                        size_ratio = area / img_area
                        confidence = min(0.95, 0.4 + size_ratio * 3)
                        
                        all_detections.append({
                            'method': f'{cascade_name}_{preprocess_name}',
                            'bbox': (x, y, w, h),
                            'confidence': confidence,
                            'params': params
                        })
        
        return self.apply_nms(all_detections)
    
    def detect_circles(self, image):
        """원형 특징(눈, 코) 탐지"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
        
        # 가우시안 블러 적용
        blurred = cv2.GaussianBlur(gray, (9, 9), 2)
        
        # 다양한 파라미터로 원 탐지
        param_sets = [
            {'dp': 1, 'minDist': 30, 'param1': 50, 'param2': 30, 'minRadius': 5, 'maxRadius': 50},
            {'dp': 1.2, 'minDist': 25, 'param1': 40, 'param2': 25, 'minRadius': 8, 'maxRadius': 80},
            {'dp': 2, 'minDist': 20, 'param1': 60, 'param2': 35, 'minRadius': 10, 'maxRadius': 60},
        ]
        
        circle_detections = []
        
        for params in param_sets:
            circles = cv2.HoughCircles(
                blurred,
                cv2.HOUGH_GRADIENT,
                dp=params['dp'],
                minDist=params['minDist'],
                param1=params['param1'],
                param2=params['param2'],
                minRadius=params['minRadius'],
                maxRadius=params['maxRadius']
            )
            
            if circles is not None:
                circles = np.round(circles[0, :]).astype("int")
                for (x, y, r) in circles[:10]:  # 최대 10개
                    confidence = min(1.0, r / 40.0)  # 반지름 기반 신뢰도
                    circle_detections.append({
                        'method': 'HoughCircles',
                        'bbox': (x-r, y-r, 2*r, 2*r),
                        'confidence': confidence,
                        'type': 'circle'
                    })
        
        return circle_detections[:5]  # 상위 5개
    
    def detect_contours(self, image):
        """윤곽선 기반 탐지"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
        
        # 전처리
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # 적응적 임계값
        thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY_INV, 11, 2
        )
        
        # 모폴로지 연산
        kernel = np.ones((3, 3), np.uint8)
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        
        # 윤곽선 찾기
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        contour_detections = []
        height, width = gray.shape
        min_area = (width * height) * 0.005  # 0.5%
        max_area = (width * height) * 0.4    # 40%
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if min_area < area < max_area:
                x, y, w, h = cv2.boundingRect(contour)
                
                # 종횡비 확인
                aspect_ratio = w / h
                if 0.4 < aspect_ratio < 2.5:
                    # 면적 기반 신뢰도
                    confidence = min(0.8, area / max_area * 2)
                    
                    contour_detections.append({
                        'method': 'Contour',
                        'bbox': (x, y, w, h),
                        'confidence': confidence,
                        'area': area
                    })
        
        # 신뢰도순 정렬하여 상위 5개
        contour_detections.sort(key=lambda x: x['confidence'], reverse=True)
        return contour_detections[:5]
    
    def apply_nms(self, detections, threshold=0.3):
        """Non-Maximum Suppression"""
        if not detections:
            return []
        
        # 신뢰도순 정렬
        detections = sorted(detections, key=lambda x: x['confidence'], reverse=True)
        
        kept = []
        for detection in detections:
            x1, y1, w1, h1 = detection['bbox']
            
            # 기존 탐지와 겹침 확인
            overlap = False
            for kept_det in kept:
                x2, y2, w2, h2 = kept_det['bbox']
                
                # IoU 계산
                xi1, yi1 = max(x1, x2), max(y1, y2)
                xi2, yi2 = min(x1+w1, x2+w2), min(y1+h1, y2+h2)
                
                if xi1 < xi2 and yi1 < yi2:
                    inter_area = (xi2 - xi1) * (yi2 - yi1)
                    union_area = w1*h1 + w2*h2 - inter_area
                    iou = inter_area / union_area if union_area > 0 else 0
                    
                    if iou > threshold:
                        overlap = True
                        break
            
            if not overlap:
                kept.append(detection)
                
            if len(kept) >= 10:  # 최대 10개
                break
        
        return kept
    
    def ensemble_detection(self, image_path):
        """앙상블 탐지 수행"""
        image = cv2.imread(str(image_path))
        if image is None:
            return None, [], {}
        
        all_detections = []
        method_images = {}
        
        print("Running cascade detection...")
        cascade_dets = self.detect_with_multiple_cascades(image)
        all_detections.extend(cascade_dets)
        
        print("Running circle detection...")
        circle_dets = self.detect_circles(image)
        all_detections.extend(circle_dets)
        
        print("Running contour detection...")
        contour_dets = self.detect_contours(image)
        all_detections.extend(contour_dets)
        
        # 최종 NMS
        final_detections = self.apply_nms(all_detections, threshold=0.4)
        
        # 결과 이미지 생성
        result_image = self.draw_detections(image, final_detections)
        
        # 방법별 이미지
        method_images['cascades'] = self.draw_detections(image.copy(), cascade_dets)
        method_images['circles'] = self.draw_detections(image.copy(), circle_dets)
        method_images['contours'] = self.draw_detections(image.copy(), contour_dets)
        
        return result_image, final_detections, method_images
    
    def draw_detections(self, image, detections):
        """탐지 결과 시각화"""
        result = image.copy()
        
        colors = {
            'cascade': (0, 255, 0),    # 초록
            'circle': (255, 255, 0),   # 노랑
            'contour': (255, 0, 255),  # 마젠타
            'default': (0, 0, 255)     # 빨강
        }
        
        for det in detections:
            x, y, w, h = det['bbox']
            confidence = det['confidence']
            method = det['method'].lower()
            
            # 색상 선택
            color = colors['default']
            for key in colors:
                if key in method:
                    color = colors[key]
                    break
            
            # 바운딩 박스
            thickness = 3 if confidence > 0.7 else 2
            cv2.rectangle(result, (x, y), (x+w, y+h), color, thickness)
            
            # 라벨
            label = f"{det['method']}: {confidence:.2f}"
            cv2.putText(result, label, (x, y-10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
            
            # 중심점
            center_x, center_y = x + w//2, y + h//2
            cv2.circle(result, (center_x, center_y), 3, color, -1)
        
        # 탐지 수 표시
        cv2.putText(result, f"Detections: {len(detections)}", (10, 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        
        return result
    
    def save_results(self, image, detections, output_path):
        """결과 저장"""
        # 이미지 저장
        cv2.imwrite(str(output_path), image)
        
        # JSON 정보 저장
        info_path = Path(output_path).with_suffix('.json')
        with open(info_path, 'w') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'total_detections': len(detections),
                'detections': [
                    {
                        'method': det.get('method', 'Unknown'),
                        'bbox': [int(x) for x in det['bbox']],
                        'confidence': float(det['confidence'])
                    }
                    for det in detections
                ]
            }, f, indent=2)
        
        print(f"Results saved: {output_path}")
        print(f"Info saved: {info_path}")


def test_basic_enhanced():
    """기본 Enhanced Detector 테스트"""
    print("Basic Enhanced Animal Detection Test")
    print("="*40)
    
    detector = BasicEnhancedDetector()
    
    # 테스트 이미지
    test_image = 'test_face.jpg'
    if not Path(test_image).exists():
        print("Creating test image...")
        import numpy as np
        
        # 테스트 이미지 생성
        img = np.ones((400, 400, 3), dtype=np.uint8) * 128
        cv2.circle(img, (200, 150), 60, (255, 255, 255), -1)  # 얼굴
        cv2.circle(img, (180, 130), 10, (0, 0, 0), -1)        # 왼쪽 눈
        cv2.circle(img, (220, 130), 10, (0, 0, 0), -1)        # 오른쪽 눈
        cv2.ellipse(img, (200, 170), (20, 10), 0, 0, 360, (0, 0, 0), -1)  # 코
        
        cv2.imwrite(test_image, img)
        print(f"Test image created: {test_image}")
    
    # 탐지 수행
    print("Running enhanced detection...")
    final_image, detections, method_images = detector.ensemble_detection(test_image)
    
    if detections:
        print(f"SUCCESS: Found {len(detections)} detections")
        for i, det in enumerate(detections, 1):
            print(f"  {i}. {det['method']}: {det['confidence']:.3f} at {det['bbox']}")
    else:
        print("No detections found")
    
    # 결과 저장
    detector.save_results(final_image, detections, 'basic_enhanced_result.jpg')
    
    # 방법별 결과 저장
    for method, img in method_images.items():
        output_file = f'basic_enhanced_{method}.jpg'
        cv2.imwrite(output_file, img)
        print(f"Method result saved: {output_file}")
    
    return True

if __name__ == "__main__":
    test_basic_enhanced()