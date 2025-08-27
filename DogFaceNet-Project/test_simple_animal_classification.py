#!/usr/bin/env python3
"""
간단한 동물 분류 테스트 (일반 이미지 분류 모델 사용)
"""
import os
import sys
from pathlib import Path
import time

def check_dependencies():
    """필요한 라이브러리 확인"""
    print("필요한 라이브러리 확인 중...")
    
    try:
        import torch
        print(f"OK PyTorch: {torch.__version__}")
    except ImportError:
        print("X PyTorch가 설치되지 않았습니다.")
        print("설치: pip install torch torchvision")
        return False
    
    try:
        import transformers
        print(f"OK Transformers: {transformers.__version__}")
    except ImportError:
        print("X Transformers가 설치되지 않았습니다.")
        print("설치: pip install transformers")
        return False
    
    try:
        from PIL import Image
        print("OK Pillow: 이미지 처리 준비")
    except ImportError:
        print("X Pillow가 설치되지 않았습니다.")
        print("설치: pip install pillow")
        return False
    
    return True

def test_simple_classification():
    """간단한 이미지 분류 테스트"""
    print("\n간단한 동물 이미지 분류 테스트")
    print("=" * 50)
    
    try:
        from transformers import pipeline
        from PIL import Image
        import torch
        
        print("모델 로딩 중...")
        
        # GPU 확인
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"사용 디바이스: {device.upper()}")
        
        # 일반 이미지 분류 파이프라인 생성 (ImageNet 기반)
        classifier = pipeline(
            "image-classification",
            model="google/vit-base-patch16-224",  # Vision Transformer 모델
            device=0 if device == "cuda" else -1
        )
        
        print("OK 모델 로딩 완료!")
        
        # 샘플 이미지들로 테스트
        sample_dir = Path("sample_animals")
        
        if sample_dir.exists():
            image_files = list(sample_dir.glob("*.jpg")) + list(sample_dir.glob("*.png"))
            
            if image_files:
                print(f"\n{len(image_files)}개 이미지로 테스트 시작:")
                print("-" * 50)
                
                for image_path in image_files:
                    try:
                        print(f"\n분석 중: {image_path.name}")
                        
                        # 이미지 로드
                        image = Image.open(image_path)
                        print(f"   이미지 크기: {image.size}")
                        
                        # 예측 실행
                        start_time = time.time()
                        results = classifier(image)  # PIL Image 객체 사용
                        end_time = time.time()
                        
                        print(f"   처리 시간: {end_time - start_time:.2f}초")
                        print("   예측 결과:")
                        
                        # 동물 관련 결과만 필터링
                        animal_keywords = ['dog', 'cat', 'puppy', 'kitten', 'animal', 'pet', 
                                         'labrador', 'retriever', 'terrier', 'spaniel', 'beagle']
                        
                        animal_results = []
                        for result in results[:10]:  # 상위 10개 확인
                            label = result['label'].lower()
                            if any(keyword in label for keyword in animal_keywords):
                                animal_results.append(result)
                        
                        # 모든 결과 표시 (상위 5개)
                        for i, result in enumerate(results[:5], 1):
                            label = result['label']
                            score = result['score']
                            confidence = score * 100
                            marker = ">> 동물 관련!" if any(keyword in label.lower() for keyword in animal_keywords) else ""
                            print(f"     {i}. {label}: {confidence:.1f}% {marker}")
                        
                        print("-" * 40)
                        
                    except Exception as e:
                        print(f"X {image_path.name} 처리 실패: {e}")
            else:
                print("X sample_animals 폴더에 이미지가 없습니다.")
        else:
            print("X sample_animals 폴더가 없습니다.")
        
        return True
        
    except Exception as e:
        print(f"X 모델 테스트 실패: {e}")
        return False

def main():
    print("간단한 동물 이미지 분류 테스트")
    print("=" * 50)
    
    # 1. 의존성 확인
    if not check_dependencies():
        return
    
    # 2. 모델 테스트
    success = test_simple_classification()
    
    print("\n테스트 완료!")
    print("=" * 50)
    
    if success:
        print("OK 이미지 분류 테스트 성공!")
        print("\n참고: 이 모델은 일반 ImageNet 데이터로 훈련되었으므로")
        print("동물 전용 모델보다는 정확도가 낮을 수 있습니다.")
    else:
        print("X 일부 테스트 실패")
        print("의존성을 다시 확인해주세요.")

if __name__ == "__main__":
    main()