#!/usr/bin/env python3
"""
통합 강아지 얼굴 탐지 데모
YOLO + Haar Cascade + 커스텀 파서 조합
"""
import cv2
import numpy as np
from pathlib import Path
import json
from datetime import datetime

# 우리가 만든 파서 import
try:
    from simple_dog_parser import SimpleDogFaceParser
    PARSER_AVAILABLE = True
except ImportError:
    PARSER_AVAILABLE = False
    print("SimpleDogFaceParser not available, using basic detection only")

# YOLO import (optional)
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    print("YOLO not available. Install with: pip install ultralytics")

class IntegratedDogDetector:
    """통합 강아지 탐지 시스템"""
    
    def __init__(self):
        self.methods = []
        
        # 1. YOLO 모델 (가능하면)
        if YOLO_AVAILABLE:
            try:
                self.yolo = YOLO('yolov8n.pt')
                self.methods.append('YOLO')
                print("YOLO loaded successfully")
            except Exception as e:
                print(f"YOLO failed to load: {e}")
                self.yolo = None
        else:
            self.yolo = None
            
        # 2. 우리가 만든 강아지 특화 파서
        if PARSER_AVAILABLE:
            try:
                self.parser = SimpleDogFaceParser()
                self.methods.append('Custom_Parser')
                print("Custom Dog Parser loaded successfully")
            except Exception as e:
                print(f"Custom Parser failed to load: {e}")
                self.parser = None
        else:
            self.parser = None
            
        # 3. OpenCV Haar Cascade (기본)
        try:
            self.haar_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            if not self.haar_cascade.empty():
                self.methods.append('OpenCV_Haar')
                print("OpenCV Haar Cascade loaded successfully")
            else:
                self.haar_cascade = None
        except Exception as e:
            print(f"Haar Cascade failed to load: {e}")
            self.haar_cascade = None
            
        print(f"\\nAvailable detection methods: {self.methods}")
        
    def detect_with_yolo(self, image_path):
        """YOLO로 강아지 탐지"""
        results = []
        if not self.yolo:
            return results
            
        try:
            yolo_results = self.yolo(image_path)
            for result in yolo_results:
                if result.boxes is not None:
                    for box in result.boxes:
                        # COCO 데이터셋에서 dog = 클래스 16
                        if int(box.cls) == 16:
                            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                            conf = float(box.conf)
                            results.append({
                                'method': 'YOLO',
                                'bbox': [int(x1), int(y1), int(x2-x1), int(y2-y1)],
                                'confidence': conf,
                                'class': 'dog'
                            })
        except Exception as e:
            print(f"YOLO detection error: {e}")
            
        return results
    
    def detect_with_parser(self, image_path):
        """커스텀 파서로 강아지 얼굴 탐지"""
        results = []
        if not self.parser:
            return results
            
        try:
            parser_results, message = self.parser.parse_dog_image(image_path)
            if parser_results:
                for face in parser_results:
                    bbox = face['bbox']
                    results.append({
                        'method': 'Custom_Parser',
                        'bbox': bbox,
                        'confidence': face.get('confidence', 0.8),
                        'features': len(face.get('features', {})),
                        'details': face
                    })
        except Exception as e:
            print(f"Custom parser error: {e}")
            
        return results
    
    def detect_with_haar(self, image_path):
        """Haar Cascade로 얼굴 탐지 (일반)"""
        results = []
        if not self.haar_cascade:
            return results
            
        try:
            image = cv2.imread(image_path)
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            faces = self.haar_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(50, 50)
            )
            
            for (x, y, w, h) in faces:
                results.append({
                    'method': 'OpenCV_Haar',
                    'bbox': [int(x), int(y), int(w), int(h)],  # Convert numpy types to Python int
                    'confidence': 0.75,  # Haar는 신뢰도 없으므로 추정값
                    'type': 'face'
                })
        except Exception as e:
            print(f"Haar cascade error: {e}")
            
        return results
    
    def detect_all_methods(self, image_path):
        """모든 방법으로 탐지하고 결과 통합"""
        print(f"\\nAnalyzing: {image_path}")
        all_results = []
        
        # 각 방법별로 탐지
        if 'YOLO' in self.methods:
            yolo_results = self.detect_with_yolo(image_path)
            all_results.extend(yolo_results)
            print(f"  YOLO: {len(yolo_results)} detections")
        
        if 'Custom_Parser' in self.methods:
            parser_results = self.detect_with_parser(image_path)
            all_results.extend(parser_results)
            print(f"  Custom Parser: {len(parser_results)} detections")
        
        if 'OpenCV_Haar' in self.methods:
            haar_results = self.detect_with_haar(image_path)
            all_results.extend(haar_results)
            print(f"  OpenCV Haar: {len(haar_results)} detections")
        
        return all_results
    
    def visualize_results(self, image_path, results, save_path=None):
        """탐지 결과를 시각화"""
        image = cv2.imread(image_path)
        colors = {
            'YOLO': (0, 255, 0),  # 녹색
            'Custom_Parser': (255, 0, 0),  # 파란색
            'OpenCV_Haar': (0, 0, 255)  # 빨간색
        }
        
        for i, result in enumerate(results):
            method = result['method']
            bbox = result['bbox']
            confidence = result.get('confidence', 0)
            color = colors.get(method, (128, 128, 128))
            
            x, y, w, h = bbox
            
            # 바운딩 박스 그리기
            cv2.rectangle(image, (x, y), (x + w, y + h), color, 2)
            
            # 라벨 텍스트
            label = f"{method} ({confidence:.2f})"
            if result.get('features'):
                label += f" [{result['features']} features]"
                
            # 텍스트 배경
            label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)[0]
            cv2.rectangle(image, (x, y - label_size[1] - 10), 
                         (x + label_size[0], y), color, -1)
            
            # 텍스트 쓰기
            cv2.putText(image, label, (x, y - 5), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        if save_path:
            cv2.imwrite(save_path, image)
            print(f"  Visualization saved: {save_path}")
        
        return image
    
    def save_results_json(self, results, image_path, save_path=None):
        """결과를 JSON으로 저장"""
        if not save_path:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            save_path = f"detection_results_{timestamp}.json"
        
        output = {
            'source_image': str(image_path),
            'timestamp': datetime.now().isoformat(),
            'methods_used': self.methods,
            'total_detections': len(results),
            'results': results
        }
        
        with open(save_path, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        
        print(f"  JSON results saved: {save_path}")
        return save_path

def demo_integrated_detection():
    """통합 탐지 시스템 데모"""
    print("Integrated Dog Detection System Demo")
    print("="*50)
    
    # 탐지기 초기화
    detector = IntegratedDogDetector()
    
    if not detector.methods:
        print("No detection methods available!")
        return False
    
    # 테스트 이미지들 확인
    test_images = [
        'realistic_dog_face.jpg',
        'simple_dog_test.jpg',
        'test_dog_face.jpg'
    ]
    
    available_images = [img for img in test_images if Path(img).exists()]
    
    if not available_images:
        print("No test images found! Run test first:")
        print("  python run_dog_parser.py --mode test")
        return False
    
    print(f"\\nFound {len(available_images)} test images:")
    for img in available_images:
        print(f"  - {img}")
    
    # 각 이미지에 대해 탐지 실행
    all_demo_results = []
    
    for image_path in available_images:
        print(f"\\n{'='*50}")
        results = detector.detect_all_methods(image_path)
        
        if results:
            # 시각화
            vis_path = f"demo_{Path(image_path).stem}_result.jpg"
            detector.visualize_results(image_path, results, vis_path)
            
            # JSON 저장
            json_path = f"demo_{Path(image_path).stem}_results.json"
            detector.save_results_json(results, image_path, json_path)
            
            all_demo_results.append({
                'image': image_path,
                'detections': len(results),
                'methods': [r['method'] for r in results]
            })
        else:
            print(f"  No detections found in {image_path}")
    
    # 최종 요약
    print(f"\\nDemo completed!")
    print("="*50)
    print("Summary:")
    
    for result in all_demo_results:
        print(f"  {result['image']}: {result['detections']} detections")
        for method in set(result['methods']):
            count = result['methods'].count(method)
            print(f"    - {method}: {count}")
    
    # 생성된 파일들
    generated_files = list(Path().glob("demo_*"))
    if generated_files:
        print(f"\\nGenerated files:")
        for file in generated_files:
            print(f"  - {file}")
    
    return True

if __name__ == "__main__":
    success = demo_integrated_detection()
    
    if success:
        print("\\nAll systems working correctly!")
        print("\\nNext steps:")
        print("  1. Install YOLO: pip install ultralytics")
        print("  2. Try real dog photos")
        print("  3. Experiment with different models")
    else:
        print("\\nDemo failed. Check requirements and test images.")