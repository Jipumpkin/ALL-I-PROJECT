# DogFaceNet 독립 프로젝트

🐕 개 얼굴 인식 및 검증을 위한 딥러닝 프로젝트

## 📋 프로젝트 개요

DogFaceNet은 개 얼굴을 인식하고 검증하는 딥러닝 모델입니다. FaceNet의 Triplet Loss와 ResNet 아키텍처를 기반으로 하여 92% 정확도를 달성했습니다.

## 🎯 주요 기능

- **개 얼굴 검증**: 두 이미지가 같은 개인지 판단
- **개 얼굴 인식**: 개별 개체 식별  
- **얼굴 클러스터링**: 유사한 개들을 그룹화
- **GAN 생성**: 개 얼굴 이미지 생성 (실험적)

## 🚀 빠른 시작

### 1. 환경 설정
```bash
python setup_simple.py
```

### 2. 데이터셋 다운로드
- **최신 데이터셋 (8600+ 이미지)**: https://zenodo.org/records/12578449
- **이전 버전**: https://github.com/GuillaumeMougeot/DogFaceNet/releases/

데이터셋을 다운로드 후 `data/dogfacenet/` 폴더에 압축 해제하세요.

### 3. 실행
```bash
python run_dogfacenet.py
```

## 📁 프로젝트 구조

```
DogFaceNet-Project/
├── DogFaceNet/              # 원본 DogFaceNet 소스코드
├── data/
│   └── dogfacenet/          # 데이터셋 디렉토리 (다운로드 필요)
├── output/
│   ├── model/               # 훈련된 모델 저장
│   └── history/             # 훈련 히스토리
├── test_images/             # 테스트용 이미지
├── setup_simple.py          # 간단 설정 스크립트
├── run_dogfacenet.py        # 실행 스크립트
└── README.md               # 이 파일
```

## 🔧 요구사항

- Python >= 3.6.4
- TensorFlow >= 2.0.0
- NumPy >= 1.14.0
- Matplotlib >= 2.1.2
- Scikit-image >= 0.13.1
- OpenCV-Python
- Pillow

## 📊 성능 지표

- **정확도**: 92% (오픈셋 기준)
- **데이터셋**: 8,600+ 개 이미지
- **아키텍처**: ResNet + Triplet Loss

## 🛠️ 개발 환경

DogFaceNet-dev 폴더의 Jupyter 노트북을 사용하여 모델을 세부적으로 분석할 수 있습니다:

```bash
cd DogFaceNet/dogfacenet-dev
jupyter notebook dogfacenet_v12-dev.ipynb
```

## 📝 인용

이 프로젝트를 사용하는 경우 다음과 같이 인용해주세요:

```bibtex
@InProceedings{10.1007/978-3-030-29894-4_34,
author="Mougeot, Guillaume and Li, Dewei and Jia, Shuai",
title="A Deep Learning Approach for Dog Face Verification and Recognition",
booktitle="PRICAI 2019: Trends in Artificial Intelligence",
year="2019",
publisher="Springer International Publishing",
pages="418--430"
}
```

## 🔗 원본 저장소

https://github.com/GuillaumeMougeot/DogFaceNet

## 📞 문의사항

DogFaceNet 관련 질문이나 문제가 있으시면 원본 저장소의 Issues를 확인해주세요.

## 📜 라이센스

원본 프로젝트의 라이센스를 따릅니다. 자세한 내용은 DogFaceNet/LICENSE 파일을 참조하세요.