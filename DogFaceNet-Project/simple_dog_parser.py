#!/usr/bin/env python3
"""
Simple Dog Face Parser - 간단한 강아지 얼굴 파싱 테스트
"""
import cv2
import numpy as np
from pathlib import Path
import json

class SimpleDogParser:
    """간단한 강아지 얼굴 파서"""
    
    def __init__(self):
        self.cascades = {}
        self.load_cascades()
    
    def load_cascades(self):
        """Cascade 로드"""
        print("Loading Haar Cascades...")
        
        cascade_path = cv2.data.haarcascades
        cascade_files = {
            'face': 'haarcascade_frontalface_default.xml',
            'eye': 'haarcascade_eye.xml'
        }
        
        for name, file in cascade_files.items():
            try:
                full_path = cascade_path + file
                cascade = cv2.CascadeClassifier(full_path)
                if not cascade.empty():
                    self.cascades[name] = cascade
                    print(f"  OK: {name}")
            except Exception as e:
                print(f"  ERROR: {name} - {e}")
    
    def detect_dog_face(self, image):
        """강아지 얼굴 탐지"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
        
        faces = []
        
        if 'face' in self.cascades:
            detected = self.cascades['face'].detectMultiScale(
                gray, scaleFactor=1.1, minNeighbors=4, minSize=(50, 50)
            )
            
            for (x, y, w, h) in detected:
                faces.append({
                    'bbox': (x, y, w, h),
                    'confidence': 0.8
                })
        
        return faces
    
    def parse_face_features(self, image, face_bbox):
        """얼굴 특징 파싱"""
        x, y, w, h = face_bbox
        face_roi = image[y:y+h, x:x+w]
        
        if len(face_roi.shape) == 3:
            face_gray = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
        else:
            face_gray = face_roi
        
        features = {
            'eyes': [],
            'nose': [],
            'mouth': []
        }
        
        # 1. 눈 탐지
        if 'eye' in self.cascades and face_gray.size > 0:
            eye_region = face_gray[int(h*0.1):int(h*0.6), int(w*0.1):int(w*0.9)]
            
            if eye_region.size > 0:
                eyes = self.cascades['eye'].detectMultiScale(
                    eye_region, scaleFactor=1.1, minNeighbors=3, minSize=(10, 10)
                )
                
                for (ex, ey, ew, eh) in eyes:
                    abs_x = x + int(w*0.1) + ex
                    abs_y = y + int(h*0.1) + ey
                    
                    features['eyes'].append({
                        'bbox': (abs_x, abs_y, ew, eh),
                        'confidence': 0.7
                    })
        
        # 2. 코 탐지 (원형 검출)
        nose_region = face_gray[int(h*0.4):int(h*0.8), int(w*0.3):int(w*0.7)]
        
        if nose_region.size > 0:
            circles = cv2.HoughCircles(
                nose_region, cv2.HOUGH_GRADIENT, 1, 30,
                param1=50, param2=30, minRadius=5, maxRadius=30
            )
            
            if circles is not None:
                for (cx, cy, r) in np.round(circles[0, :]).astype("int")[:1]:
                    abs_x = x + int(w*0.3) + cx - r
                    abs_y = y + int(h*0.4) + cy - r
                    
                    features['nose'].append({
                        'bbox': (abs_x, abs_y, 2*r, 2*r),
                        'confidence': 0.6
                    })
        
        # 3. 입 영역 추정
        mouth_x = x + int(w*0.2)
        mouth_y = y + int(h*0.7)
        mouth_w = int(w*0.6)
        mouth_h = int(h*0.2)
        
        features['mouth'].append({
            'bbox': (mouth_x, mouth_y, mouth_w, mouth_h),
            'confidence': 0.5
        })
        
        return features
    
    def extract_face_regions(self, image, face_bbox, features):
        """얼굴 영역 추출"""
        x, y, w, h = face_bbox
        
        regions = {}
        
        # 전체 얼굴
        regions['full_face'] = image[y:y+h, x:x+w]
        
        # 눈 영역들
        for i, eye in enumerate(features['eyes']):
            ex, ey, ew, eh = eye['bbox']
            if 0 <= ey < image.shape[0] and 0 <= ex < image.shape[1]:
                eye_roi = image[max(0, ey):min(image.shape[0], ey+eh), 
                               max(0, ex):min(image.shape[1], ex+ew)]
                if eye_roi.size > 0:
                    regions[f'eye_{i+1}'] = eye_roi
        
        # 코 영역
        for i, nose in enumerate(features['nose']):
            nx, ny, nw, nh = nose['bbox']
            if 0 <= ny < image.shape[0] and 0 <= nx < image.shape[1]:
                nose_roi = image[max(0, ny):min(image.shape[0], ny+nh),
                                max(0, nx):min(image.shape[1], nx+nw)]
                if nose_roi.size > 0:
                    regions[f'nose_{i+1}'] = nose_roi
        
        # 입 영역
        for i, mouth in enumerate(features['mouth']):
            mx, my, mw, mh = mouth['bbox']
            if 0 <= my < image.shape[0] and 0 <= mx < image.shape[1]:
                mouth_roi = image[max(0, my):min(image.shape[0], my+mh),
                                 max(0, mx):min(image.shape[1], mx+mw)]
                if mouth_roi.size > 0:
                    regions[f'mouth_{i+1}'] = mouth_roi
        
        return regions
    
    def parse_dog_image(self, image_path):
        """강아지 이미지 파싱"""
        print(f"Parsing: {image_path}")
        
        # 이미지 로드
        image = cv2.imread(str(image_path))
        if image is None:
            return None, "Failed to load image"
        
        # 1. 얼굴 탐지
        faces = self.detect_dog_face(image)
        print(f"Detected {len(faces)} face(s)")
        
        if not faces:
            return None, "No faces detected"
        
        results = []
        
        # 2. 각 얼굴 파싱
        for i, face in enumerate(faces):
            print(f"Parsing face {i+1}...")
            
            # 특징 파싱
            features = self.parse_face_features(image, face['bbox'])
            
            # 영역 추출
            regions = self.extract_face_regions(image, face['bbox'], features)
            
            result = {
                'face_id': i + 1,
                'bbox': face['bbox'],
                'confidence': face['confidence'],
                'features': features,
                'regions': regions
            }
            
            results.append(result)
        
        return results, "Success"
    
    def draw_analysis(self, image, results):
        """분석 결과 그리기"""
        result_image = image.copy()
        
        colors = {
            'face': (0, 255, 0),
            'eyes': (255, 255, 0),
            'nose': (255, 0, 255),
            'mouth': (0, 255, 255)
        }
        
        for result in results:
            # 얼굴 박스
            x, y, w, h = result['bbox']
            cv2.rectangle(result_image, (x, y), (x+w, y+h), colors['face'], 2)
            cv2.putText(result_image, f"Dog Face {result['face_id']}", 
                       (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, colors['face'], 2)
            
            # 특징들
            features = result['features']
            
            for eye in features['eyes']:
                ex, ey, ew, eh = eye['bbox']
                cv2.rectangle(result_image, (ex, ey), (ex+ew, ey+eh), colors['eyes'], 2)
                cv2.putText(result_image, "Eye", (ex, ey-5), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.4, colors['eyes'], 1)
            
            for nose in features['nose']:
                nx, ny, nw, nh = nose['bbox']
                cv2.rectangle(result_image, (nx, ny), (nx+nw, ny+nh), colors['nose'], 2)
                cv2.putText(result_image, "Nose", (nx, ny-5), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.4, colors['nose'], 1)
            
            for mouth in features['mouth']:
                mx, my, mw, mh = mouth['bbox']
                cv2.rectangle(result_image, (mx, my), (mx+mw, my+mh), colors['mouth'], 2)
                cv2.putText(result_image, "Mouth", (mx, my-5), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.4, colors['mouth'], 1)
        
        return result_image
    
    def save_results(self, results, output_dir):
        """결과 저장"""
        output_path = Path(output_dir)
        output_path.mkdir(exist_ok=True)
        
        # JSON 결과 저장
        json_data = []
        for result in results:
            json_result = {
                'face_id': result['face_id'],
                'bbox': result['bbox'],
                'confidence': result['confidence'],
                'features': {
                    'eyes': [{'bbox': eye['bbox'], 'confidence': eye['confidence']} 
                            for eye in result['features']['eyes']],
                    'nose': [{'bbox': nose['bbox'], 'confidence': nose['confidence']} 
                            for nose in result['features']['nose']],
                    'mouth': [{'bbox': mouth['bbox'], 'confidence': mouth['confidence']} 
                             for mouth in result['features']['mouth']]
                }
            }
            json_data.append(json_result)
        
        with open(output_path / "parsing_results.json", 'w') as f:
            json.dump(json_data, f, indent=2)
        
        # 영역 이미지들 저장
        for result in results:
            face_id = result['face_id']
            for region_name, region_img in result['regions'].items():
                filename = f"face_{face_id}_{region_name}.jpg"
                cv2.imwrite(str(output_path / filename), region_img)
        
        print(f"Results saved to {output_path}")


def test_simple_parser():
    """간단한 파서 테스트"""
    print("Simple Dog Face Parser Test")
    print("="*30)
    
    parser = SimpleDogParser()
    
    # 테스트 이미지 생성
    test_image_path = 'simple_dog_test.jpg'
    
    if not Path(test_image_path).exists():
        print("Creating test image...")
        
        # 강아지 얼굴 모양 생성
        img = np.ones((400, 400, 3), dtype=np.uint8) * 180
        
        # 얼굴 (타원)
        cv2.ellipse(img, (200, 200), (80, 100), 0, 0, 360, (150, 130, 110), -1)
        
        # 눈들
        cv2.circle(img, (170, 170), 10, (50, 50, 50), -1)
        cv2.circle(img, (230, 170), 10, (50, 50, 50), -1)
        
        # 코
        cv2.circle(img, (200, 220), 8, (30, 30, 30), -1)
        
        # 입 영역
        cv2.ellipse(img, (200, 260), (20, 10), 0, 0, 180, (80, 80, 80), 2)
        
        cv2.imwrite(test_image_path, img)
        print(f"Test image created: {test_image_path}")
    
    # 파싱 실행
    results, message = parser.parse_dog_image(test_image_path)
    
    if results:
        print(f"SUCCESS: {message}")
        
        for result in results:
            print(f"\nFace {result['face_id']}:")
            print(f"  Confidence: {result['confidence']:.3f}")
            print(f"  Eyes: {len(result['features']['eyes'])}")
            print(f"  Nose: {len(result['features']['nose'])}")  
            print(f"  Mouth: {len(result['features']['mouth'])}")
            print(f"  Regions: {list(result['regions'].keys())}")
        
        # 결과 이미지 생성
        original = cv2.imread(test_image_path)
        result_image = parser.draw_analysis(original, results)
        
        cv2.imwrite('simple_dog_analysis_result.jpg', result_image)
        print("\nResult image saved: simple_dog_analysis_result.jpg")
        
        # 결과 저장
        parser.save_results(results, 'simple_dog_results')
        
        return True
    else:
        print(f"FAILED: {message}")
        return False


if __name__ == "__main__":
    test_simple_parser()