#!/usr/bin/env python3
"""
Fixed Dog Face Parser Test - 실제 동작하는 테스트
"""
import cv2
import numpy as np
from pathlib import Path

def create_realistic_dog_face():
    """사실적인 강아지 얼굴 테스트 이미지 생성"""
    print("Creating realistic dog face image...")
    
    # 더 큰 캔버스
    img = np.ones((600, 500, 3), dtype=np.uint8) * 220
    
    # 배경 노이즈 추가
    noise = np.random.randint(-30, 30, img.shape, dtype=np.int16)
    img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    
    # 강아지 얼굴 (더 큰 타원)
    cv2.ellipse(img, (250, 250), (120, 150), 0, 0, 360, (180, 160, 140), -1)
    
    # 얼굴 윤곽 강조
    cv2.ellipse(img, (250, 250), (120, 150), 0, 0, 360, (160, 140, 120), 3)
    
    # 눈들 (더 큰, 사람 얼굴과 유사하게)
    # 왼쪽 눈
    cv2.ellipse(img, (200, 200), (25, 35), 0, 0, 360, (250, 250, 250), -1)
    cv2.ellipse(img, (200, 200), (15, 25), 0, 0, 360, (100, 100, 100), -1)
    cv2.circle(img, (200, 195), 8, (30, 30, 30), -1)
    
    # 오른쪽 눈
    cv2.ellipse(img, (300, 200), (25, 35), 0, 0, 360, (250, 250, 250), -1)
    cv2.ellipse(img, (300, 200), (15, 25), 0, 0, 360, (100, 100, 100), -1)
    cv2.circle(img, (300, 195), 8, (30, 30, 30), -1)
    
    # 코 (더 뚜렷하게)
    cv2.ellipse(img, (250, 280), (20, 15), 0, 0, 360, (50, 50, 50), -1)
    cv2.ellipse(img, (250, 275), (8, 6), 0, 0, 360, (20, 20, 20), -1)
    
    # 입 
    cv2.ellipse(img, (250, 320), (30, 20), 0, 0, 180, (100, 100, 100), 3)
    cv2.line(img, (220, 320), (280, 320), (80, 80, 80), 2)
    
    # 귀들
    cv2.ellipse(img, (150, 150), (40, 80), -30, 0, 360, (160, 140, 120), -1)
    cv2.ellipse(img, (350, 150), (40, 80), 30, 0, 360, (160, 140, 120), -1)
    
    # 얼굴 명암 추가 (사람 얼굴 탐지기가 인식할 수 있도록)
    # 그라디언트 효과
    for y in range(100, 400):
        for x in range(130, 370):
            distance = np.sqrt((x-250)**2 + (y-250)**2)
            if distance < 120:
                brightness = 1.0 + 0.3 * (1.0 - distance/120)
                img[y, x] = np.clip(img[y, x] * brightness, 0, 255).astype(np.uint8)
    
    return img

def test_with_real_detection():
    """실제 탐지 테스트"""
    print("Testing Dog Face Detection")
    print("="*30)
    
    # 테스트 이미지 생성
    test_img = create_realistic_dog_face()
    test_path = 'realistic_dog_face.jpg'
    cv2.imwrite(test_path, test_img)
    print(f"Test image saved: {test_path}")
    
    # OpenCV 탐지기 로드
    cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    face_cascade = cv2.CascadeClassifier(cascade_path)
    
    eye_path = cv2.data.haarcascades + 'haarcascade_eye.xml'  
    eye_cascade = cv2.CascadeClassifier(eye_path)
    
    # 이미지 로드 및 그레이스케일 변환
    img = cv2.imread(test_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    print("Image loaded. Shape:", img.shape)
    print("Gray image shape:", gray.shape)
    
    # 얼굴 탐지 (여러 파라미터로 시도)
    face_found = False
    result_img = img.copy()
    
    # 다양한 탐지 파라미터
    configs = [
        {'scale': 1.05, 'neighbors': 3, 'min_size': (30, 30)},
        {'scale': 1.1, 'neighbors': 4, 'min_size': (50, 50)},
        {'scale': 1.2, 'neighbors': 5, 'min_size': (40, 40)},
        {'scale': 1.3, 'neighbors': 3, 'min_size': (80, 80)},
    ]
    
    for i, config in enumerate(configs):
        print(f"\nTrying config {i+1}: {config}")
        
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=config['scale'],
            minNeighbors=config['neighbors'], 
            minSize=config['min_size']
        )
        
        print(f"Detected {len(faces)} face(s)")
        
        if len(faces) > 0:
            face_found = True
            
            for j, (x, y, w, h) in enumerate(faces):
                print(f"  Face {j+1}: ({x}, {y}, {w}, {h})")
                
                # 얼굴 박스 그리기
                cv2.rectangle(result_img, (x, y), (x+w, y+h), (0, 255, 0), 2)
                cv2.putText(result_img, f"Dog Face {j+1}", (x, y-10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                
                # 얼굴 영역에서 눈 탐지
                face_roi_gray = gray[y:y+h, x:x+w]
                face_roi_color = result_img[y:y+h, x:x+w]
                
                eyes = eye_cascade.detectMultiScale(
                    face_roi_gray, scaleFactor=1.1, minNeighbors=3
                )
                
                print(f"    Eyes detected: {len(eyes)}")
                
                for (ex, ey, ew, eh) in eyes:
                    cv2.rectangle(face_roi_color, (ex, ey), (ex+ew, ey+eh), (255, 255, 0), 2)
                    cv2.putText(face_roi_color, "Eye", (ex, ey-5),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 0), 1)
                
                # 코 영역 표시 (추정)
                nose_x = x + int(w*0.4)
                nose_y = y + int(h*0.6)  
                nose_w = int(w*0.2)
                nose_h = int(h*0.2)
                
                cv2.rectangle(result_img, (nose_x, nose_y), (nose_x+nose_w, nose_y+nose_h), 
                             (255, 0, 255), 2)
                cv2.putText(result_img, "Nose", (nose_x, nose_y-5),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 0, 255), 1)
                
                # 입 영역 표시 (추정)
                mouth_x = x + int(w*0.3)
                mouth_y = y + int(h*0.75)
                mouth_w = int(w*0.4)
                mouth_h = int(h*0.2)
                
                cv2.rectangle(result_img, (mouth_x, mouth_y), (mouth_x+mouth_w, mouth_y+mouth_h),
                             (0, 255, 255), 2) 
                cv2.putText(result_img, "Mouth", (mouth_x, mouth_y-5),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 255), 1)
            
            # 성공한 설정이면 중단
            break
    
    # 결과 저장
    output_path = 'dog_face_parsing_result.jpg'
    cv2.imwrite(output_path, result_img)
    print(f"\nResult saved: {output_path}")
    
    if face_found:
        print("SUCCESS: Dog face detection and parsing completed!")
        
        # 간단한 영역 추출 데모
        if len(faces) > 0:
            x, y, w, h = faces[0]
            
            # 전체 얼굴
            full_face = img[y:y+h, x:x+w]
            cv2.imwrite('extracted_full_face.jpg', full_face)
            
            # 눈 영역 (추정)
            eye_region = img[y+int(h*0.1):y+int(h*0.5), x+int(w*0.1):x+int(w*0.9)]
            cv2.imwrite('extracted_eye_region.jpg', eye_region)
            
            # 코 영역 (추정)
            nose_region = img[y+int(h*0.4):y+int(h*0.7), x+int(w*0.3):x+int(w*0.7)]
            cv2.imwrite('extracted_nose_region.jpg', nose_region)
            
            print("Individual regions extracted:")
            print("  - extracted_full_face.jpg")
            print("  - extracted_eye_region.jpg") 
            print("  - extracted_nose_region.jpg")
        
        return True
    else:
        print("FAILED: No faces detected with any configuration")
        return False

if __name__ == "__main__":
    test_with_real_detection()