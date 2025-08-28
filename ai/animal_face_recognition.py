import cv2
import numpy as np
from PIL import Image
import os
from pathlib import Path
import face_recognition
from sklearn.metrics.pairwise import cosine_similarity
import matplotlib.pyplot as plt

class AnimalFaceRecognition:
    """동물 얼굴 인식 및 유사 동물 찾기 클래스"""
    
    def __init__(self):
        self.animal_database = []  # 동물 데이터베이스
        self.face_encodings = []   # 얼굴 인코딩 데이터
        
    def extract_animal_features(self, image_path):
        """동물 이미지에서 특징 추출 (OpenCV 기반)"""
        try:
            # 이미지 로드
            image = cv2.imread(image_path)
            if image is None:
                return None
                
            # BGR을 RGB로 변환
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # 히스토그램 특징 추출
            hist_features = []
            for i in range(3):  # RGB 채널
                hist = cv2.calcHist([rgb_image], [i], None, [256], [0, 256])
                hist_features.extend(hist.flatten())
            
            # HOG 특징 추출
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            hog = cv2.HOGDescriptor()
            hog_features = hog.compute(gray)
            
            if hog_features is not None:
                features = np.concatenate([hist_features, hog_features.flatten()])
            else:
                features = np.array(hist_features)
                
            return features
            
        except Exception as e:
            print(f"특징 추출 실패 ({image_path}): {e}")
            return None
    
    def add_animal_to_database(self, image_path, animal_info=None):
        """동물 데이터베이스에 추가"""
        features = self.extract_animal_features(image_path)
        if features is not None:
            self.animal_database.append({
                'path': image_path,
                'features': features,
                'info': animal_info or {}
            })
            return True
        return False
    
    def load_animal_database(self, database_folder):
        """동물 데이터베이스 폴더에서 모든 이미지 로드"""
        database_path = Path(database_folder)
        if not database_path.exists():
            print(f"데이터베이스 폴더가 존재하지 않습니다: {database_folder}")
            return False
            
        supported_formats = {'.jpg', '.jpeg', '.png', '.bmp'}
        loaded_count = 0
        
        for image_file in database_path.rglob('*'):
            if image_file.suffix.lower() in supported_formats:
                if self.add_animal_to_database(str(image_file)):
                    loaded_count += 1
                    print(f"로드됨: {image_file.name}")
                    
        print(f"총 {loaded_count}개의 동물 이미지가 데이터베이스에 로드되었습니다.")
        return loaded_count > 0
    
    def find_similar_animals(self, query_image_path, top_n=5, similarity_threshold=0.7):
        """쿼리 이미지와 유사한 동물들 찾기"""
        if not self.animal_database:
            print("동물 데이터베이스가 비어있습니다.")
            return []
            
        # 쿼리 이미지 특징 추출
        query_features = self.extract_animal_features(query_image_path)
        if query_features is None:
            print("쿼리 이미지에서 특징을 추출할 수 없습니다.")
            return []
        
        # 유사도 계산
        similarities = []
        for i, animal_data in enumerate(self.animal_database):
            # 코사인 유사도 계산
            similarity = cosine_similarity([query_features], [animal_data['features']])[0][0]
            
            similarities.append({
                'index': i,
                'similarity': similarity,
                'path': animal_data['path'],
                'info': animal_data['info']
            })
        
        # 유사도 기준으로 정렬
        similarities.sort(key=lambda x: x['similarity'], reverse=True)
        
        # 임계값 이상인 결과만 필터링
        filtered_results = [s for s in similarities if s['similarity'] >= similarity_threshold]
        
        # 상위 N개 반환
        return filtered_results[:top_n]
    
    def display_results(self, query_image_path, similar_animals):
        """검색 결과 시각화"""
        if not similar_animals:
            print("유사한 동물을 찾을 수 없습니다.")
            return
            
        # 결과 개수에 따라 그리드 크기 결정
        n_results = len(similar_animals)
        cols = min(3, n_results + 1)  # 쿼리 + 결과들
        rows = (n_results + cols) // cols
        
        fig, axes = plt.subplots(rows, cols, figsize=(15, 5 * rows))
        if rows == 1:
            axes = axes.reshape(1, -1) if n_results > 0 else [axes]
        
        # 쿼리 이미지 표시
        query_img = Image.open(query_image_path)
        axes[0, 0].imshow(query_img)
        axes[0, 0].set_title(f"쿼리 이미지\n{Path(query_image_path).name}", fontsize=10)
        axes[0, 0].axis('off')
        
        # 유사한 동물들 표시
        for idx, animal in enumerate(similar_animals):
            row = (idx + 1) // cols
            col = (idx + 1) % cols
            
            try:
                similar_img = Image.open(animal['path'])
                axes[row, col].imshow(similar_img)
                title = f"유사도: {animal['similarity']:.3f}\n{Path(animal['path']).name}"
                axes[row, col].set_title(title, fontsize=10)
                axes[row, col].axis('off')
            except Exception as e:
                axes[row, col].text(0.5, 0.5, f"이미지 로드 실패\n{e}", 
                                  ha='center', va='center')
                axes[row, col].axis('off')
        
        # 빈 서브플롯 숨기기
        total_used = n_results + 1
        for idx in range(total_used, rows * cols):
            row = idx // cols
            col = idx % cols
            axes[row, col].axis('off')
        
        plt.tight_layout()
        plt.show()
        
        # 텍스트 결과도 출력
        print(f"\n🔍 유사한 동물 검색 결과 (총 {len(similar_animals)}마리):")
        for i, animal in enumerate(similar_animals, 1):
            print(f"{i}. {Path(animal['path']).name} - 유사도: {animal['similarity']:.3f}")

def create_sample_database():
    """샘플 데이터베이스 생성 (테스트용)"""
    database_folder = "./data/animal_database"
    os.makedirs(database_folder, exist_ok=True)
    
    print(f"동물 데이터베이스 폴더를 생성했습니다: {database_folder}")
    print("이 폴더에 유기동물 사진들을 넣어주세요.")
    print("지원 형식: .jpg, .jpeg, .png, .bmp")
    
    return database_folder

# 테스트 함수
def test_animal_face_recognition():
    """동물 얼굴 인식 기능 테스트"""
    print("🐕 동물 얼굴 인식 및 유사 동물 찾기 테스트")
    print("=" * 50)
    
    # 동물 얼굴 인식 객체 생성
    recognizer = AnimalFaceRecognition()
    
    # 데이터베이스 폴더 생성/확인
    database_folder = create_sample_database()
    
    # 데이터베이스 로드
    if recognizer.load_animal_database(database_folder):
        # 쿼리 이미지 (arg1.jpg 사용)
        query_image = "./data/arg1.jpg"
        
        if os.path.exists(query_image):
            print(f"\n🔍 쿼리 이미지: {query_image}")
            
            # 유사한 동물 찾기
            similar_animals = recognizer.find_similar_animals(
                query_image, 
                top_n=5, 
                similarity_threshold=0.3  # 낮은 임계값으로 테스트
            )
            
            # 결과 표시
            recognizer.display_results(query_image, similar_animals)
            
        else:
            print(f"쿼리 이미지를 찾을 수 없습니다: {query_image}")
    else:
        print("동물 데이터베이스를 로드할 수 없습니다.")
        print(f"{database_folder} 폴더에 동물 사진들을 추가해주세요.")

if __name__ == "__main__":
    test_animal_face_recognition()