#!/usr/bin/env python3
"""
Enhanced Animal Face Detection System
동물 얼굴 탐지 성능이 크게 향상된 고급 시스템
"""
import cv2
import numpy as np
from pathlib import Path
import torch
import torch.nn as nn
import torchvision.transforms as transforms
from PIL import Image
import warnings
warnings.filterwarnings('ignore')

# YOLO 사용 가능 여부 확인
YOLO_AVAILABLE = False
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    pass

# MediaPipe 사용 가능 여부 확인
MEDIAPIPE_AVAILABLE = False
try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    pass

class EnhancedAnimalDetector:
    """향상된 동물 얼굴 탐지 시스템"""
    
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.models = {}
        self.load_models()
        
    def load_models(self):
        """고급 모델들 로드"""
        print("Enhanced Animal Detection System 초기화...")
        print(f"Device: {self.device}")
        
        # 1. YOLO v8 모델 로드 (동물 탐지용)
        if YOLO_AVAILABLE:
            try:
                # YOLOv8 nano 모델 (빠르고 가벼움)
                self.models['yolo'] = YOLO('yolov8n.pt')
                print("✓ YOLOv8 모델 로드 완료")
            except:
                print("✗ YOLOv8 모델 다운로드 중...")
                from ultralytics import YOLO
                self.models['yolo'] = YOLO('yolov8n.pt')
                print("✓ YOLOv8 모델 다운로드 및 로드 완료")
        
        # 2. 개선된 Cascade Classifier 로드
        self._load_cascade_classifiers()
        
        # 3. DNN 기반 얼굴 탐지기 로드
        self._load_dnn_detector()
        
        # 4. MediaPipe FaceMesh (선택적)
        if MEDIAPIPE_AVAILABLE:
            self.models['mediapipe'] = mp.solutions.face_mesh.FaceMesh(
                static_image_mode=True,
                max_num_faces=10,
                min_detection_confidence=0.5
            )
            print("✓ MediaPipe FaceMesh 로드 완료")
    
    def _load_cascade_classifiers(self):
        """향상된 Cascade Classifier 설정"""
        cascades = {}
        
        # OpenCV 기본 cascades
        cascade_path = cv2.data.haarcascades
        
        # 다양한 cascade 로드
        cascade_files = {
            'frontal_face': 'haarcascade_frontalface_default.xml',
            'frontal_face_alt': 'haarcascade_frontalface_alt.xml',
            'frontal_face_alt2': 'haarcascade_frontalface_alt2.xml',
            'profile_face': 'haarcascade_profileface.xml',
            'eye': 'haarcascade_eye.xml',
        }
        
        for name, file in cascade_files.items():
            try:
                cascades[name] = cv2.CascadeClassifier(cascade_path + file)
                print(f"✓ Cascade {name} 로드 완료")
            except:
                pass
        
        self.models['cascades'] = cascades
    
    def _load_dnn_detector(self):
        """DNN 기반 얼굴 탐지기 로드"""
        try:
            # OpenCV DNN 모델 경로
            proto_path = "deploy.prototxt"
            model_path = "res10_300x300_ssd_iter_140000.caffemodel"
            
            # 파일이 없으면 다운로드 스크립트 생성
            if not Path(proto_path).exists() or not Path(model_path).exists():
                self._create_dnn_download_script()
                print("✗ DNN 모델 파일이 없습니다. download_dnn_models.py를 실행하세요.")
            else:
                self.models['dnn'] = cv2.dnn.readNetFromCaffe(proto_path, model_path)
                print("✓ DNN 얼굴 탐지기 로드 완료")
        except Exception as e:
            print(f"✗ DNN 모델 로드 실패: {e}")
    
    def _create_dnn_download_script(self):
        """DNN 모델 다운로드 스크립트 생성"""
        script = '''import urllib.request
import os

print("DNN 모델 다운로드 중...")

# Deploy prototxt
url1 = "https://raw.githubusercontent.com/opencv/opencv/master/samples/dnn/face_detector/deploy.prototxt"
urllib.request.urlretrieve(url1, "deploy.prototxt")
print("✓ deploy.prototxt 다운로드 완료")

# Caffe model
url2 = "https://github.com/opencv/opencv_3rdparty/raw/dnn_samples_face_detector_20170830/res10_300x300_ssd_iter_140000.caffemodel"
urllib.request.urlretrieve(url2, "res10_300x300_ssd_iter_140000.caffemodel")
print("✓ Caffe 모델 다운로드 완료")

print("모든 모델 다운로드 완료!")
'''
        with open("download_dnn_models.py", "w") as f:
            f.write(script)
    
    def detect_with_yolo(self, image_path, conf_threshold=0.25):
        """YOLO를 사용한 동물 탐지"""
        if 'yolo' not in self.models:
            return None, []
        
        # YOLO로 탐지
        results = self.models['yolo'](image_path, conf=conf_threshold)
        
        # 동물 클래스 ID (COCO dataset)
        animal_classes = {
            15: 'bird', 16: 'cat', 17: 'dog', 18: 'horse',
            19: 'sheep', 20: 'cow', 21: 'elephant', 22: 'bear',
            23: 'zebra', 24: 'giraffe'
        }
        
        detections = []
        image = cv2.imread(str(image_path))
        
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    cls = int(box.cls[0])
                    if cls in animal_classes:
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        conf = float(box.conf[0])
                        
                        detections.append({
                            'method': 'YOLOv8',
                            'class': animal_classes[cls],
                            'bbox': (int(x1), int(y1), int(x2-x1), int(y2-y1)),
                            'confidence': conf
                        })
                        
                        # 시각화
                        cv2.rectangle(image, (int(x1), int(y1)), (int(x2), int(y2)), 
                                    (0, 255, 0), 2)
                        label = f"{animal_classes[cls]}: {conf:.2f}"
                        cv2.putText(image, label, (int(x1), int(y1)-10),
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        
        return image, detections
    
    def detect_with_dnn(self, image_path, conf_threshold=0.5):
        """DNN 기반 얼굴 탐지"""
        if 'dnn' not in self.models:
            return None, []
        
        image = cv2.imread(str(image_path))
        h, w = image.shape[:2]
        
        # 이미지 전처리
        blob = cv2.dnn.blobFromImage(cv2.resize(image, (300, 300)), 1.0,
                                    (300, 300), (104.0, 177.0, 123.0))
        
        # 탐지 수행
        self.models['dnn'].setInput(blob)
        detections = self.models['dnn'].forward()
        
        faces = []
        for i in range(detections.shape[2]):
            confidence = detections[0, 0, i, 2]
            if confidence > conf_threshold:
                box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
                x1, y1, x2, y2 = box.astype("int")
                
                faces.append({
                    'method': 'DNN',
                    'bbox': (x1, y1, x2-x1, y2-y1),
                    'confidence': float(confidence)
                })
                
                # 시각화
                cv2.rectangle(image, (x1, y1), (x2, y2), (255, 0, 0), 2)
                cv2.putText(image, f"DNN: {confidence:.2f}", (x1, y1-10),
                          cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)
        
        return image, faces
    
    def detect_with_cascade_ensemble(self, image_path):
        """여러 Cascade를 앙상블로 사용한 탐지"""
        if 'cascades' not in self.models:
            return None, []
        
        image = cv2.imread(str(image_path))
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # 여러 스케일로 탐지
        scales = [1.05, 1.1, 1.15]
        min_neighbors = [3, 4, 5]
        
        all_detections = []
        
        for cascade_name, cascade in self.models['cascades'].items():
            if cascade.empty():
                continue
                
            for scale in scales:
                for neighbors in min_neighbors:
                    faces = cascade.detectMultiScale(
                        gray, 
                        scaleFactor=scale,
                        minNeighbors=neighbors,
                        minSize=(30, 30),
                        flags=cv2.CASCADE_SCALE_IMAGE
                    )
                    
                    for (x, y, w, h) in faces:
                        all_detections.append({
                            'method': f'Cascade-{cascade_name}',
                            'bbox': (x, y, w, h),
                            'confidence': 0.5 + (neighbors * 0.1)  # 신뢰도 추정
                        })
        
        # NMS (Non-Maximum Suppression) 적용
        filtered = self._apply_nms(all_detections)
        
        # 시각화
        for det in filtered:
            x, y, w, h = det['bbox']
            cv2.rectangle(image, (x, y), (x+w, y+h), (0, 255, 255), 2)
            cv2.putText(image, f"Ensemble: {det['confidence']:.2f}", 
                       (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2)
        
        return image, filtered
    
    def detect_with_advanced_preprocessing(self, image_path):
        """고급 전처리를 통한 탐지 성능 향상"""
        image = cv2.imread(str(image_path))
        detections = []
        
        # 1. CLAHE (Contrast Limited Adaptive Histogram Equalization) 적용
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced = clahe.apply(gray)
        
        # 2. 다양한 전처리 기법 적용
        preprocessed_images = {
            'original': gray,
            'clahe': enhanced,
            'gaussian': cv2.GaussianBlur(gray, (5,5), 0),
            'bilateral': cv2.bilateralFilter(gray, 9, 75, 75),
            'median': cv2.medianBlur(gray, 5)
        }
        
        # 3. 각 전처리된 이미지에서 탐지
        if 'cascades' in self.models and 'frontal_face' in self.models['cascades']:
            cascade = self.models['cascades']['frontal_face']
            
            for preprocess_name, processed_img in preprocessed_images.items():
                faces = cascade.detectMultiScale(
                    processed_img,
                    scaleFactor=1.1,
                    minNeighbors=4,
                    minSize=(30, 30)
                )
                
                for (x, y, w, h) in faces:
                    detections.append({
                        'method': f'Enhanced-{preprocess_name}',
                        'bbox': (x, y, w, h),
                        'confidence': 0.6
                    })
        
        # NMS 적용
        filtered = self._apply_nms(detections)
        
        # 시각화
        for det in filtered:
            x, y, w, h = det['bbox']
            cv2.rectangle(image, (x, y), (x+w, y+h), (255, 0, 255), 2)
        
        return image, filtered
    
    def detect_animal_landmarks(self, image_path):
        """동물 특징점(랜드마크) 탐지"""
        image = cv2.imread(str(image_path))
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        landmarks = {
            'eyes': [],
            'nose': [],
            'mouth': [],
            'ears': []
        }
        
        # 1. 눈 탐지 (Hough Circle 개선 버전)
        blurred = cv2.GaussianBlur(gray, (9, 9), 2)
        circles = cv2.HoughCircles(
            blurred,
            cv2.HOUGH_GRADIENT,
            dp=1.2,
            minDist=30,
            param1=50,
            param2=30,
            minRadius=5,
            maxRadius=50
        )
        
        if circles is not None:
            circles = np.round(circles[0, :]).astype("int")
            for (x, y, r) in circles[:6]:  # 최대 6개 (눈, 콧구멍 등)
                landmarks['eyes'].append((x, y, r))
                cv2.circle(image, (x, y), r, (255, 255, 0), 2)
        
        # 2. ORB 특징점 탐지
        orb = cv2.ORB_create(nfeatures=500)
        keypoints = orb.detect(gray, None)
        
        # 특징점 클러스터링으로 주요 부위 찾기
        if keypoints:
            points = np.array([kp.pt for kp in keypoints])
            
            # K-means 클러스터링
            from sklearn.cluster import KMeans
            if len(points) > 4:
                kmeans = KMeans(n_clusters=min(4, len(points)))
                kmeans.fit(points)
                
                for center in kmeans.cluster_centers_:
                    x, y = int(center[0]), int(center[1])
                    cv2.circle(image, (x, y), 5, (0, 255, 0), -1)
        
        # 3. 윤곽선 기반 특징 탐지
        edges = cv2.Canny(gray, 50, 150)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if 100 < area < 5000:
                M = cv2.moments(contour)
                if M["m00"] != 0:
                    cx = int(M["m10"] / M["m00"])
                    cy = int(M["m01"] / M["m00"])
                    cv2.circle(image, (cx, cy), 3, (0, 0, 255), -1)
        
        return image, landmarks
    
    def _apply_nms(self, detections, threshold=0.3):
        """Non-Maximum Suppression 적용"""
        if not detections:
            return []
        
        boxes = np.array([d['bbox'] for d in detections])
        scores = np.array([d['confidence'] for d in detections])
        
        # (x, y, w, h) -> (x1, y1, x2, y2) 변환
        x1 = boxes[:, 0]
        y1 = boxes[:, 1]
        x2 = boxes[:, 0] + boxes[:, 2]
        y2 = boxes[:, 1] + boxes[:, 3]
        
        areas = (x2 - x1 + 1) * (y2 - y1 + 1)
        order = scores.argsort()[::-1]
        
        keep = []
        while order.size > 0:
            i = order[0]
            keep.append(i)
            
            xx1 = np.maximum(x1[i], x1[order[1:]])
            yy1 = np.maximum(y1[i], y1[order[1:]])
            xx2 = np.minimum(x2[i], x2[order[1:]])
            yy2 = np.minimum(y2[i], y2[order[1:]])
            
            w = np.maximum(0.0, xx2 - xx1 + 1)
            h = np.maximum(0.0, yy2 - yy1 + 1)
            inter = w * h
            
            ovr = inter / (areas[i] + areas[order[1:]] - inter)
            inds = np.where(ovr <= threshold)[0]
            order = order[inds + 1]
        
        return [detections[i] for i in keep]
    
    def ensemble_detection(self, image_path):
        """모든 방법을 앙상블로 사용한 최종 탐지"""
        all_detections = []
        images = []
        
        # 1. YOLO 탐지
        if YOLO_AVAILABLE and 'yolo' in self.models:
            img, dets = self.detect_with_yolo(image_path)
            if dets:
                all_detections.extend(dets)
                images.append(('YOLO', img))
        
        # 2. DNN 탐지
        if 'dnn' in self.models:
            img, dets = self.detect_with_dnn(image_path)
            if dets:
                all_detections.extend(dets)
                images.append(('DNN', img))
        
        # 3. Cascade Ensemble
        img, dets = self.detect_with_cascade_ensemble(image_path)
        if dets:
            all_detections.extend(dets)
            images.append(('Cascade', img))
        
        # 4. 고급 전처리
        img, dets = self.detect_with_advanced_preprocessing(image_path)
        if dets:
            all_detections.extend(dets)
            images.append(('Enhanced', img))
        
        # 최종 NMS
        final_detections = self._apply_nms(all_detections, threshold=0.4)
        
        # 최종 이미지 생성
        final_image = cv2.imread(str(image_path))
        for det in final_detections:
            x, y, w, h = det['bbox']
            conf = det['confidence']
            method = det.get('method', 'Unknown')
            
            # 신뢰도에 따른 색상
            if conf > 0.8:
                color = (0, 255, 0)  # 초록 (높은 신뢰도)
            elif conf > 0.6:
                color = (0, 165, 255)  # 주황
            else:
                color = (0, 0, 255)  # 빨강 (낮은 신뢰도)
            
            cv2.rectangle(final_image, (x, y), (x+w, y+h), color, 2)
            
            # 라벨
            label = f"{method}: {conf:.2f}"
            if 'class' in det:
                label = f"{det['class']}: {conf:.2f}"
            
            cv2.putText(final_image, label, (x, y-10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
        
        return final_image, final_detections, images
    
    def save_results(self, image, detections, output_path):
        """결과 저장"""
        cv2.imwrite(str(output_path), image)
        
        # 탐지 정보 저장
        info_path = Path(output_path).with_suffix('.txt')
        with open(info_path, 'w', encoding='utf-8') as f:
            f.write(f"Enhanced Animal Detection Results\n")
            f.write(f"{'='*50}\n")
            f.write(f"Total detections: {len(detections)}\n\n")
            
            for i, det in enumerate(detections, 1):
                f.write(f"Detection #{i}:\n")
                f.write(f"  Method: {det.get('method', 'Unknown')}\n")
                if 'class' in det:
                    f.write(f"  Class: {det['class']}\n")
                f.write(f"  BBox: {det['bbox']}\n")
                f.write(f"  Confidence: {det['confidence']:.3f}\n\n")
        
        print(f"✓ 결과 저장: {output_path}")
        print(f"✓ 정보 저장: {info_path}")
        return True


def test_enhanced_detection():
    """향상된 탐지 시스템 테스트"""
    print("="*60)
    print("Enhanced Animal Face Detection System Test")
    print("="*60)
    
    detector = EnhancedAnimalDetector()
    
    # 테스트 이미지
    test_image = Path("sample_animals/dog.jpg")
    if not test_image.exists():
        print("테스트 이미지가 없습니다. sample_animals/dog.jpg 파일을 준비하세요.")
        return
    
    print(f"\n테스트 이미지: {test_image}")
    print("-"*50)
    
    # 앙상블 탐지 수행
    print("\n앙상블 탐지 수행 중...")
    final_image, detections, method_images = detector.ensemble_detection(test_image)
    
    # 결과 저장
    output_path = "enhanced_detection_result.jpg"
    detector.save_results(final_image, detections, output_path)
    
    # 개별 방법 결과 저장
    for method_name, img in method_images:
        method_output = f"detection_{method_name.lower()}.jpg"
        cv2.imwrite(method_output, img)
        print(f"✓ {method_name} 결과 저장: {method_output}")
    
    # 랜드마크 탐지
    print("\n랜드마크 탐지 수행 중...")
    landmark_image, landmarks = detector.detect_animal_landmarks(test_image)
    cv2.imwrite("animal_landmarks.jpg", landmark_image)
    print(f"✓ 랜드마크 결과 저장: animal_landmarks.jpg")
    
    # 결과 요약
    print("\n" + "="*50)
    print("탐지 결과 요약:")
    print(f"  총 탐지 수: {len(detections)}")
    
    if detections:
        avg_conf = np.mean([d['confidence'] for d in detections])
        max_conf = max(d['confidence'] for d in detections)
        print(f"  평균 신뢰도: {avg_conf:.3f}")
        print(f"  최대 신뢰도: {max_conf:.3f}")
        
        # 방법별 통계
        methods = {}
        for det in detections:
            method = det.get('method', 'Unknown')
            methods[method] = methods.get(method, 0) + 1
        
        print("\n  방법별 탐지 수:")
        for method, count in methods.items():
            print(f"    - {method}: {count}")
    
    print("\n✓ 모든 테스트 완료!")
    print(f"✓ 최종 결과: {output_path}")


if __name__ == "__main__":
    # 필요 패키지 설치 안내
    print("\n필요 패키지 설치:")
    print("pip install ultralytics opencv-python torch torchvision scikit-learn")
    print("pip install mediapipe (선택사항)")
    print("")
    
    test_enhanced_detection()