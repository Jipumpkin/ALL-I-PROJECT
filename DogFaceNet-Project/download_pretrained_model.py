#!/usr/bin/env python3
"""
사전 훈련된 모델 검색 및 대안 제시 스크립트
"""
import os
import sys
import urllib.request
from pathlib import Path
import json

def check_pretrained_models():
    """사전 훈련된 모델 가용성 확인"""
    print("🔍 DogFaceNet 사전 훈련된 모델 검색 중...")
    print("=" * 60)
    
    print("❌ 공식 사전 훈련된 모델 현황:")
    print("1. GitHub 릴리즈 페이지: 모델 파일 없음 (데이터셋만 제공)")
    print("2. Zenodo 데이터셋: 모델 파일 없음 (이미지 데이터만 제공)")
    print("3. 원본 저장소: 체크포인트/가중치 파일 없음")
    
    print("\n📋 이용 가능한 파일들:")
    print("- 데이터셋: 8,600+ 개 얼굴 이미지")
    print("- 소스코드: 완전한 훈련 코드")
    print("- Jupyter 노트북: 개발 및 평가 코드")
    
    print("\n💡 대안 방법들:")
    print("=" * 60)
    
    alternatives = [
        {
            "name": "1. 직접 훈련 (권장)",
            "description": "제공된 데이터셋으로 모델을 처음부터 훈련",
            "pros": "최고 성능, 커스터마이징 가능",
            "cons": "시간 소요 (GPU 필요시 몇 시간~하루)",
            "difficulty": "중간"
        },
        {
            "name": "2. Transfer Learning 활용", 
            "description": "사전 훈련된 ResNet을 개 얼굴에 맞게 Fine-tuning",
            "pros": "빠른 훈련, 적은 데이터로도 가능",
            "cons": "DogFaceNet만큼의 성능 보장 어려움",
            "difficulty": "쉬움"
        },
        {
            "name": "3. 논문 저자에게 문의",
            "description": "GitHub Issues를 통해 모델 파일 요청",
            "pros": "원본 성능 보장",
            "cons": "응답 불확실",
            "difficulty": "쉬움"
        },
        {
            "name": "4. 커뮤니티 구현체 검색",
            "description": "다른 개발자들이 만든 구현체 활용",
            "pros": "즉시 사용 가능할 수 있음",
            "cons": "성능 및 품질 검증 필요",
            "difficulty": "중간"
        }
    ]
    
    for alt in alternatives:
        print(f"\n{alt['name']}")
        print(f"   설명: {alt['description']}")
        print(f"   장점: {alt['pros']}")
        print(f"   단점: {alt['cons']}")
        print(f"   난이도: {alt['difficulty']}")
    
    return alternatives

def create_quick_training_script():
    """빠른 훈련을 위한 스크립트 생성"""
    
    quick_train_script = '''#!/usr/bin/env python3
"""
DogFaceNet 빠른 훈련 스크립트
데이터셋이 준비되어 있다면 즉시 훈련을 시작할 수 있습니다.
"""
import os
import sys
from pathlib import Path
import tensorflow as tf

def quick_train():
    print("🚀 DogFaceNet 빠른 훈련 시작!")
    print("=" * 50)
    
    # 데이터셋 경로 확인
    data_path = Path("data/dogfacenet")
    if not data_path.exists():
        print("❌ 데이터셋이 없습니다!")
        print("다음에서 다운로드하세요:")
        print("https://zenodo.org/records/12578449")
        return
    
    # GPU 확인
    gpus = tf.config.experimental.list_physical_devices('GPU')
    if gpus:
        print(f"✅ GPU 감지: {len(gpus)}개")
        # GPU 메모리 증가 설정
        try:
            for gpu in gpus:
                tf.config.experimental.set_memory_growth(gpu, True)
        except RuntimeError as e:
            print(f"GPU 설정 오류: {e}")
    else:
        print("⚠️  CPU 모드 (훈련 시간이 오래 걸릴 수 있습니다)")
    
    # DogFaceNet 모듈 경로 추가
    dogfacenet_path = Path("DogFaceNet")
    sys.path.insert(0, str(dogfacenet_path))
    
    try:
        # DogFaceNet 훈련 실행
        os.chdir(dogfacenet_path)
        
        print("📚 데이터 로딩 및 모델 생성 중...")
        print("⏳ 이 과정은 몇 분에서 몇 시간이 걸릴 수 있습니다...")
        print("💡 훈련 중단하려면 Ctrl+C를 누르세요")
        
        # 실제 DogFaceNet 실행
        exec(open("dogfacenet/dogfacenet.py").read())
        
    except KeyboardInterrupt:
        print("\\n⏹️  사용자에 의해 훈련이 중단되었습니다.")
    except Exception as e:
        print(f"❌ 훈련 중 오류 발생: {e}")
        print("\\n해결 방법:")
        print("1. 데이터셋 경로 확인")
        print("2. 필요한 패키지 설치 확인")
        print("3. Python 버전 확인 (>=3.6.4)")

def main():
    print("DogFaceNet 빠른 훈련 도구")
    print("=" * 40)
    
    choice = input("훈련을 시작하시겠습니까? (y/n): ").lower()
    
    if choice == 'y':
        quick_train()
    else:
        print("훈련이 취소되었습니다.")
        print("\\n💡 팁:")
        print("- GPU가 있다면 훈련 속도가 크게 향상됩니다")
        print("- 작은 배치 사이즈로 시작해보세요")
        print("- 중간에 저장되는 체크포인트를 확인하세요")

if __name__ == "__main__":
    main()
'''
    
    script_path = Path("quick_train_dogfacenet.py")
    with open(script_path, 'w', encoding='utf-8') as f:
        f.write(quick_train_script)
    
    print(f"✅ 빠른 훈련 스크립트 생성: {script_path}")
    return script_path

def create_transfer_learning_alternative():
    """Transfer Learning 대안 스크립트 생성"""
    
    transfer_script = '''#!/usr/bin/env python3
"""
Transfer Learning을 사용한 개 얼굴 인식 대안
사전 훈련된 ResNet을 활용하여 빠르게 개 얼굴 인식 모델을 구축
"""
import tensorflow as tf
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.layers import GlobalAveragePooling2D, Dense
from tensorflow.keras.models import Model
import numpy as np
from pathlib import Path

def create_dog_face_model(num_classes=1393):
    """Transfer Learning 기반 개 얼굴 인식 모델 생성"""
    
    print("🧠 Transfer Learning 모델 생성 중...")
    
    # 사전 훈련된 ResNet50 로드 (ImageNet 가중치)
    base_model = ResNet50(
        weights='imagenet',
        include_top=False,
        input_shape=(224, 224, 3)
    )
    
    # 상위 레이어 동결 (처음에는)
    base_model.trainable = False
    
    # 새로운 분류 헤드 추가
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(512, activation='relu')(x)
    predictions = Dense(num_classes, activation='softmax')(x)
    
    model = Model(inputs=base_model.input, outputs=predictions)
    
    print(f"✅ 모델 생성 완료 (클래스 수: {num_classes})")
    return model

def quick_setup():
    """빠른 설정 및 테스트"""
    print("🚀 Transfer Learning 개 얼굴 인식 설정")
    print("=" * 50)
    
    # 모델 생성
    model = create_dog_face_model()
    
    # 컴파일
    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    print("📊 모델 요약:")
    model.summary()
    
    # 더미 데이터로 테스트
    print("\\n🔧 테스트 실행...")
    dummy_input = np.random.random((1, 224, 224, 3))
    prediction = model.predict(dummy_input)
    print(f"테스트 예측 형태: {prediction.shape}")
    
    print("\\n💾 모델 저장...")
    model.save("dog_face_resnet_model.h5")
    print("✅ 모델이 'dog_face_resnet_model.h5'로 저장되었습니다!")
    
    print("\\n📝 다음 단계:")
    print("1. 실제 데이터셋 준비")
    print("2. 데이터 전처리")
    print("3. 모델 Fine-tuning")
    print("4. 평가 및 테스트")

if __name__ == "__main__":
    quick_setup()
'''
    
    script_path = Path("transfer_learning_dogface.py")
    with open(script_path, 'w', encoding='utf-8') as f:
        f.write(transfer_script)
    
    print(f"✅ Transfer Learning 대안 스크립트 생성: {script_path}")
    return script_path

def main():
    print("🐕 DogFaceNet 사전 훈련된 모델 가이드")
    print("=" * 60)
    
    # 1. 사전 훈련된 모델 현황 확인
    alternatives = check_pretrained_models()
    
    print("\n🛠️  제공할 수 있는 도구들:")
    print("=" * 60)
    
    # 2. 빠른 훈련 스크립트 생성
    quick_script = create_quick_training_script()
    
    # 3. Transfer Learning 대안 생성  
    transfer_script = create_transfer_learning_alternative()
    
    print(f"\n🎯 권장 사용 순서:")
    print("=" * 60)
    print("1. 데이터셋 다운로드 (https://zenodo.org/records/12578449)")
    print("2. 데이터를 data/dogfacenet/ 폴더에 압축 해제")
    print("3. GPU가 있다면: python quick_train_dogfacenet.py")
    print("4. GPU가 없다면: python transfer_learning_dogface.py")
    print("5. 결과 모델로 개 얼굴 인식 테스트")
    
    print(f"\n💡 추가 정보:")
    print("- 원본 논문 성능을 원한다면 직접 훈련이 필수")
    print("- Transfer Learning은 빠르지만 성능이 다를 수 있음")
    print("- 커뮤니티에서 공유된 모델을 찾아볼 수도 있음")

if __name__ == "__main__":
    main()