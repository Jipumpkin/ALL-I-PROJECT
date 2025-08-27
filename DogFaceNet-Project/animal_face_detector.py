#!/usr/bin/env python3
"""
동물 얼굴 탐지 모듈
OpenCV의 Haar Cascade와 MTCNN을 활용한 동물 얼굴 검출
"""
import cv2
import numpy as np
from pathlib import Path
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from PIL import Image
import io

# 선택적 import
MTCNN_AVAILABLE = False
try:
    from mtcnn import MTCNN
    MTCNN_AVAILABLE = True
except ImportError:
    pass

class AnimalFaceDetector:
    def __init__(self):
        """동물 얼굴 탐지기 초기화"""
        self.haar_cascades = {}
        self.mtcnn_detector = None
        self.load_detectors()
    
    def load_detectors(self):
        """탐지기들 로드"""
        print("동물 얼굴 탐지기 초기화 중...")
        
        # OpenCV 기본 얼굴 탐지기 로드
        try:
            face_cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            self.haar_cascades['human_face'] = cv2.CascadeClassifier(face_cascade_path)
            print("OK OpenCV Haar Cascade 로드 완료")
        except Exception as e:
            print(f"Haar Cascade 로드 실패: {e}")
        
        # MTCNN 로드 (사람 얼굴용이지만 동물에도 어느정도 효과)
        if MTCNN_AVAILABLE:
            try:
                self.mtcnn_detector = MTCNN()
                print("OK MTCNN 탐지기 로드 완료")
            except Exception as e:
                print(f"MTCNN 로드 실패: {e}")
        else:
            print("MTCNN 라이브러리 없음 (pip install mtcnn)")
    
    def detect_faces_opencv(self, image_path, method='haar'):
        """OpenCV를 사용한 얼굴 탐지 (시각적 개선 버전)"""
        try:
            # 이미지 로드
            image = cv2.imread(str(image_path))
            if image is None:
                return None, "이미지 로드 실패"
            
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            detected_faces = []
            
            if method == 'haar' and 'human_face' in self.haar_cascades:
                # Haar Cascade 사용 (파라미터 개선)
                faces = self.haar_cascades['human_face'].detectMultiScale(
                    gray, 
                    scaleFactor=1.05,  # 더 세밀한 스케일
                    minNeighbors=3,    # 더 민감하게
                    minSize=(20, 20),  # 더 작은 얼굴도 탐지
                    maxSize=(500, 500),  # 최대 크기 제한
                    flags=cv2.CASCADE_SCALE_IMAGE
                )
                
                for i, (x, y, w, h) in enumerate(faces):
                    # 크기 기반 신뢰도 계산
                    area = w * h
                    img_area = image.shape[0] * image.shape[1]
                    size_ratio = area / img_area
                    confidence = min(0.95, 0.6 + size_ratio * 2)  # 크기가 클수록 높은 신뢰도
                    
                    detected_faces.append({
                        'method': 'Haar Cascade',
                        'bbox': (x, y, w, h),
                        'confidence': confidence,
                        'id': i + 1,
                        'area': area
                    })
            
            elif method == 'contour':
                # 윤곽선 기반 탐지 (간단한 대안)
                detected_faces = self._detect_faces_contour(gray)
            
            # 시각적으로 개선된 결과 이미지 생성
            result_image = self._draw_enhanced_detections(image, detected_faces, method)
            
            return result_image, detected_faces
            
        except Exception as e:
            return None, f"탐지 중 오류: {e}"
    
    def _draw_enhanced_detections(self, image, faces, method):
        """시각적으로 개선된 탐지 결과 그리기"""
        result_image = image.copy()
        
        # 색상 테마 설정
        colors = [
            (0, 255, 0),    # 초록 (기본)
            (255, 0, 0),    # 빨강 (높은 신뢰도)
            (0, 165, 255),  # 주황 (중간 신뢰도)
            (255, 255, 0),  # 시안 (낮은 신뢰도)
            (255, 0, 255),  # 마젠타
        ]
        
        for i, face in enumerate(faces):
            x, y, w, h = face['bbox']
            confidence = face.get('confidence', 0.5)
            face_id = face.get('id', i + 1)
            
            # 신뢰도에 따른 색상 선택
            if confidence > 0.8:
                color = colors[1]  # 빨강 (높은 신뢰도)
                thickness = 3
            elif confidence > 0.6:
                color = colors[0]  # 초록 (중간 신뢰도)
                thickness = 2
            else:
                color = colors[2]  # 주황 (낮은 신뢰도)
                thickness = 2
            
            # 메인 바운딩 박스 그리기
            cv2.rectangle(result_image, (x, y), (x+w, y+h), color, thickness)
            
            # 모서리 강조 (코너 마커)
            corner_length = min(w, h) // 8
            # 왼쪽 위
            cv2.line(result_image, (x, y), (x + corner_length, y), color, thickness + 1)
            cv2.line(result_image, (x, y), (x, y + corner_length), color, thickness + 1)
            # 오른쪽 위
            cv2.line(result_image, (x + w, y), (x + w - corner_length, y), color, thickness + 1)
            cv2.line(result_image, (x + w, y), (x + w, y + corner_length), color, thickness + 1)
            # 왼쪽 아래
            cv2.line(result_image, (x, y + h), (x + corner_length, y + h), color, thickness + 1)
            cv2.line(result_image, (x, y + h), (x, y + h - corner_length), color, thickness + 1)
            # 오른쪽 아래
            cv2.line(result_image, (x + w, y + h), (x + w - corner_length, y + h), color, thickness + 1)
            cv2.line(result_image, (x + w, y + h), (x + w, y + h - corner_length), color, thickness + 1)
            
            # 중심점 표시
            center_x, center_y = x + w//2, y + h//2
            cv2.circle(result_image, (center_x, center_y), 3, color, -1)
            
            # 정보 박스 배경
            label = f"Face #{face_id}"
            confidence_text = f"{confidence:.1%}"
            size_text = f"{w}x{h}"
            
            # 텍스트 크기 계산
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 0.5
            font_thickness = 1
            
            # 텍스트들의 크기 계산
            (text_w1, text_h1), _ = cv2.getTextSize(label, font, font_scale, font_thickness)
            (text_w2, text_h2), _ = cv2.getTextSize(confidence_text, font, font_scale, font_thickness)
            (text_w3, text_h3), _ = cv2.getTextSize(size_text, font, font_scale, font_thickness)
            
            max_text_width = max(text_w1, text_w2, text_w3)
            total_text_height = text_h1 + text_h2 + text_h3 + 20
            
            # 정보 박스 위치 계산
            info_x = max(0, min(x, result_image.shape[1] - max_text_width - 10))
            info_y = max(total_text_height, y - 10)
            
            # 반투명 배경 박스
            overlay = result_image.copy()
            cv2.rectangle(overlay, 
                         (info_x - 5, info_y - total_text_height - 5),
                         (info_x + max_text_width + 10, info_y + 5),
                         (0, 0, 0), -1)
            cv2.addWeighted(overlay, 0.7, result_image, 0.3, 0, result_image)
            
            # 텍스트 그리기
            cv2.putText(result_image, label, 
                       (info_x, info_y - text_h2 - text_h3 - 10), 
                       font, font_scale, (255, 255, 255), font_thickness)
            
            cv2.putText(result_image, confidence_text, 
                       (info_x, info_y - text_h3 - 5), 
                       font, font_scale, color, font_thickness)
            
            cv2.putText(result_image, size_text, 
                       (info_x, info_y), 
                       font, font_scale, (200, 200, 200), font_thickness)
        
        # 탐지 개수 표시 (상단)
        total_faces = len(faces)
        if total_faces > 0:
            summary_text = f"Detected: {total_faces} face(s) using {method}"
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 0.7
            font_thickness = 2
            
            (text_width, text_height), _ = cv2.getTextSize(summary_text, font, font_scale, font_thickness)
            
            # 상단 중앙에 배경 박스
            bg_x1 = (result_image.shape[1] - text_width) // 2 - 10
            bg_y1 = 10
            bg_x2 = bg_x1 + text_width + 20
            bg_y2 = bg_y1 + text_height + 20
            
            overlay = result_image.copy()
            cv2.rectangle(overlay, (bg_x1, bg_y1), (bg_x2, bg_y2), (0, 0, 0), -1)
            cv2.addWeighted(overlay, 0.8, result_image, 0.2, 0, result_image)
            
            cv2.putText(result_image, summary_text,
                       (bg_x1 + 10, bg_y1 + text_height + 10),
                       font, font_scale, (0, 255, 255), font_thickness)
        
        return result_image
    
    def detect_faces_mtcnn(self, image_path):
        """MTCNN을 사용한 얼굴 탐지"""
        if not MTCNN_AVAILABLE or not self.mtcnn_detector:
            return None, "MTCNN을 사용할 수 없습니다"
        
        try:
            # PIL로 이미지 로드
            image = Image.open(image_path)
            image_array = np.array(image)
            
            # MTCNN으로 얼굴 탐지
            detections = self.mtcnn_detector.detect_faces(image_array)
            
            detected_faces = []
            result_image = image_array.copy()
            
            for detection in detections:
                bbox = detection['box']
                confidence = detection['confidence']
                keypoints = detection['keypoints']
                
                x, y, w, h = bbox
                detected_faces.append({
                    'method': 'MTCNN',
                    'bbox': (x, y, w, h),
                    'confidence': confidence,
                    'keypoints': keypoints
                })
                
                # 바운딩 박스 그리기
                cv2.rectangle(result_image, (x, y), (x+w, y+h), (255, 0, 0), 2)
                cv2.putText(result_image, f"MTCNN: {confidence:.2f}", 
                           (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 1)
                
                # 키포인트 그리기
                for point_name, (point_x, point_y) in keypoints.items():
                    cv2.circle(result_image, (int(point_x), int(point_y)), 2, (0, 255, 255), -1)
            
            return result_image, detected_faces
            
        except Exception as e:
            return None, f"MTCNN 탐지 중 오류: {e}"
    
    def _detect_faces_contour(self, gray_image):
        """윤곽선 기반 간단한 얼굴 영역 탐지"""
        detected_faces = []
        
        try:
            # 가우시안 블러 적용
            blurred = cv2.GaussianBlur(gray_image, (5, 5), 0)
            
            # 적응적 임계값 적용
            thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                         cv2.THRESH_BINARY_INV, 11, 2)
            
            # 윤곽선 찾기
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # 크기 기준으로 윤곽선 필터링 (얼굴 크기 추정)
            height, width = gray_image.shape
            min_area = (width * height) * 0.01  # 전체 면적의 1%
            max_area = (width * height) * 0.3   # 전체 면적의 30%
            
            for contour in contours:
                area = cv2.contourArea(contour)
                if min_area < area < max_area:
                    x, y, w, h = cv2.boundingRect(contour)
                    
                    # 종횡비 확인 (얼굴은 대략 정사각형에 가까움)
                    aspect_ratio = w / h
                    if 0.5 < aspect_ratio < 2.0:
                        detected_faces.append({
                            'method': 'Contour Analysis',
                            'bbox': (x, y, w, h),
                            'confidence': min(area / max_area, 0.9)  # 면적 기반 신뢰도
                        })
            
            # 신뢰도 순으로 정렬
            detected_faces.sort(key=lambda x: x['confidence'], reverse=True)
            
        except Exception as e:
            print(f"윤곽선 탐지 중 오류: {e}")
        
        return detected_faces[:5]  # 상위 5개만 반환
    
    def detect_animal_features(self, image_path):
        """동물 특징 탐지 (눈, 코, 귀 등) - 시각적 개선 버전"""
        try:
            image = cv2.imread(str(image_path))
            if image is None:
                return None, "이미지 로드 실패"
            
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            result_image = image.copy()
            
            # 동물 특징 탐지 결과
            features = {
                'eyes': [],
                'nose': [],
                'ears': []
            }
            
            # 눈 탐지 (원형 특징 찾기) - 파라미터 개선
            circles = cv2.HoughCircles(gray, cv2.HOUGH_GRADIENT, 1, 25,
                                     param1=40, param2=25, minRadius=8, maxRadius=80)
            
            if circles is not None:
                circles = np.round(circles[0, :]).astype("int")
                eye_count = 0
                for (x, y, r) in circles[:15]:  # 더 많은 후보 검사
                    # 크기와 위치 기반 필터링
                    if r > 5 and eye_count < 8:  # 눈 크기 제한
                        confidence = min(1.0, r / 30.0)  # 크기 기반 신뢰도
                        features['eyes'].append((x, y, r, confidence))
                        
                        # 시각적 개선된 눈 표시
                        color = (0, 255, 255)  # 노란색
                        cv2.circle(result_image, (x, y), r, color, 2)
                        cv2.circle(result_image, (x, y), 2, color, -1)  # 중심점
                        
                        # 정보 표시
                        cv2.putText(result_image, f"Eye {eye_count+1}", 
                                   (x-20, y-r-5), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)
                        cv2.putText(result_image, f"{confidence:.2f}", 
                                   (x-15, y+r+15), cv2.FONT_HERSHEY_SIMPLEX, 0.3, color, 1)
                        eye_count += 1
            
            # 가장자리 탐지로 귀와 코 찾기 - 개선된 파라미터
            # 먼저 이미지를 부드럽게 만들기
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            edges = cv2.Canny(blurred, 30, 100)
            
            # 모폴로지 연산으로 윤곽선 개선
            kernel = np.ones((3, 3), np.uint8)
            edges = cv2.dilate(edges, kernel, iterations=1)
            edges = cv2.erode(edges, kernel, iterations=1)
            
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            nose_count = 0
            ear_count = 0
            
            # 크기순으로 정렬
            contours = sorted(contours, key=cv2.contourArea, reverse=True)
            
            for contour in contours:
                area = cv2.contourArea(contour)
                if 200 < area < 5000:  # 크기 범위 확대
                    x, y, w, h = cv2.boundingRect(contour)
                    aspect_ratio = w / h
                    
                    # 더 정교한 분류
                    if h > w * 1.3 and ear_count < 6:  # 귀 (세로로 긴 형태)
                        confidence = min(1.0, area / 2000.0)
                        features['ears'].append((x, y, w, h, confidence))
                        
                        # 시각적 개선된 귀 표시
                        color = (255, 0, 100)  # 보라색
                        cv2.rectangle(result_image, (x, y), (x+w, y+h), color, 2)
                        
                        # 모서리 강조
                        cv2.line(result_image, (x, y), (x+5, y), color, 3)
                        cv2.line(result_image, (x, y), (x, y+5), color, 3)
                        
                        cv2.putText(result_image, f"Ear {ear_count+1}", 
                                   (x, y-8), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)
                        cv2.putText(result_image, f"{confidence:.2f}", 
                                   (x, y+h+12), cv2.FONT_HERSHEY_SIMPLEX, 0.3, color, 1)
                        ear_count += 1
                    
                    elif w > h * 1.1 and nose_count < 5:  # 코 (가로로 넓은 형태)
                        confidence = min(1.0, area / 3000.0)
                        features['nose'].append((x, y, w, h, confidence))
                        
                        # 시각적 개선된 코 표시
                        color = (0, 100, 255)  # 주황색
                        cv2.rectangle(result_image, (x, y), (x+w, y+h), color, 2)
                        
                        # 중심에 십자 표시
                        center_x, center_y = x + w//2, y + h//2
                        cv2.line(result_image, (center_x-5, center_y), (center_x+5, center_y), color, 2)
                        cv2.line(result_image, (center_x, center_y-5), (center_x, center_y+5), color, 2)
                        
                        cv2.putText(result_image, f"Nose {nose_count+1}", 
                                   (x, y-8), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)
                        cv2.putText(result_image, f"{confidence:.2f}", 
                                   (x, y+h+12), cv2.FONT_HERSHEY_SIMPLEX, 0.3, color, 1)
                        nose_count += 1
            
            # 상단에 특징 요약 정보 표시
            summary_text = f"Features: {len(features['eyes'])} Eyes, {len(features['nose'])} Nose, {len(features['ears'])} Ears"
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 0.6
            font_thickness = 2
            
            (text_width, text_height), _ = cv2.getTextSize(summary_text, font, font_scale, font_thickness)
            
            # 배경 박스
            bg_x1 = (result_image.shape[1] - text_width) // 2 - 10
            bg_y1 = 10
            bg_x2 = bg_x1 + text_width + 20
            bg_y2 = bg_y1 + text_height + 20
            
            overlay = result_image.copy()
            cv2.rectangle(overlay, (bg_x1, bg_y1), (bg_x2, bg_y2), (0, 0, 0), -1)
            cv2.addWeighted(overlay, 0.8, result_image, 0.2, 0, result_image)
            
            cv2.putText(result_image, summary_text,
                       (bg_x1 + 10, bg_y1 + text_height + 10),
                       font, font_scale, (255, 255, 255), font_thickness)
            
            return result_image, features
            
        except Exception as e:
            return None, f"특징 탐지 중 오류: {e}"
    
    def save_result_image(self, result_image, output_path):
        """결과 이미지 저장"""
        try:
            cv2.imwrite(str(output_path), result_image)
            return True
        except Exception as e:
            print(f"이미지 저장 실패: {e}")
            return False
    
    def get_detection_summary(self, faces, features=None):
        """탐지 결과 요약"""
        summary = f"탐지된 얼굴: {len(faces)}개\n"
        summary += "=" * 40 + "\n"
        
        for i, face in enumerate(faces, 1):
            x, y, w, h = face['bbox']
            summary += f"{i}. {face['method']}\n"
            summary += f"   위치: ({x}, {y}), 크기: {w}x{h}\n"
            summary += f"   신뢰도: {face['confidence']:.3f}\n"
            
            if 'keypoints' in face:
                summary += "   키포인트: 5개 검출\n"
            
            summary += "\n"
        
        if features:
            summary += "추가 특징 탐지:\n"
            summary += f"- 눈 후보: {len(features['eyes'])}개\n"
            summary += f"- 코 후보: {len(features['nose'])}개\n"
            summary += f"- 귀 후보: {len(features['ears'])}개\n"
        
        return summary

def test_animal_face_detection():
    """동물 얼굴 탐지 테스트"""
    print("동물 얼굴 탐지 테스트 시작")
    print("=" * 50)
    
    detector = AnimalFaceDetector()
    
    # 테스트 이미지 경로
    test_image_path = Path("sample_animals/dog.jpg")
    
    if not test_image_path.exists():
        print("테스트 이미지가 없습니다.")
        return
    
    print(f"테스트 이미지: {test_image_path}")
    
    # 1. Haar Cascade 탐지
    print("\n1. Haar Cascade 탐지:")
    result_haar, faces_haar = detector.detect_faces_opencv(test_image_path, method='haar')
    if result_haar is not None:
        output_path = "face_detection_haar.jpg"
        detector.save_result_image(result_haar, output_path)
        print(f"결과 저장: {output_path}")
        print(detector.get_detection_summary(faces_haar))
    
    # 2. 윤곽선 기반 탐지
    print("2. 윤곽선 기반 탐지:")
    result_contour, faces_contour = detector.detect_faces_opencv(test_image_path, method='contour')
    if result_contour is not None:
        output_path = "face_detection_contour.jpg"
        detector.save_result_image(result_contour, output_path)
        print(f"결과 저장: {output_path}")
        print(detector.get_detection_summary(faces_contour))
    
    # 3. MTCNN 탐지 (가능한 경우)
    if MTCNN_AVAILABLE:
        print("3. MTCNN 탐지:")
        result_mtcnn, faces_mtcnn = detector.detect_faces_mtcnn(test_image_path)
        if result_mtcnn is not None:
            output_path = "face_detection_mtcnn.jpg"
            detector.save_result_image(result_mtcnn, output_path)
            print(f"결과 저장: {output_path}")
            print(detector.get_detection_summary(faces_mtcnn))
    
    # 4. 동물 특징 탐지
    print("4. 동물 특징 탐지:")
    result_features, features = detector.detect_animal_features(test_image_path)
    if result_features is not None:
        output_path = "animal_features_detection.jpg"
        detector.save_result_image(result_features, output_path)
        print(f"결과 저장: {output_path}")
        print(detector.get_detection_summary([], features))

if __name__ == "__main__":
    test_animal_face_detection()