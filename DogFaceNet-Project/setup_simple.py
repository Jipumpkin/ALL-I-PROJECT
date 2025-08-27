#!/usr/bin/env python3
"""
DogFaceNet 간단 설정 스크립트 (유니코드 문제 해결)
"""
import os
import sys
import subprocess
from pathlib import Path

def main():
    print("DogFaceNet 독립 프로젝트 설정")
    print("=" * 50)
    
    # 프로젝트 루트 경로
    project_root = Path(__file__).parent
    
    # 필요한 디렉토리 생성
    directories = [
        project_root / "data" / "dogfacenet",
        project_root / "output" / "model", 
        project_root / "output" / "history",
        project_root / "test_images"
    ]
    
    print("디렉토리 생성 중...")
    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)
        print(f"생성: {directory}")
    
    # 의존성 패키지 설치
    print("\n패키지 설치 중...")
    packages = [
        "tensorflow>=2.0.0",
        "numpy>=1.14.0", 
        "matplotlib>=2.1.2",
        "scikit-image>=0.13.1",
        "jupyter>=1.0.0",
        "tqdm>=4.23.4",
        "pillow",
        "opencv-python"
    ]
    
    for package in packages:
        try:
            print(f"설치 중: {package}")
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        except subprocess.CalledProcessError:
            print(f"WARNING: {package} 설치 실패")
    
    # 실행 스크립트 생성
    run_script = '''#!/usr/bin/env python3
import sys
import os
from pathlib import Path

def main():
    print("DogFaceNet 실행 스크립트")
    print("=" * 40)
    
    # 데이터셋 확인
    data_path = Path(__file__).parent / "data" / "dogfacenet"
    if not data_path.exists() or not any(data_path.iterdir()):
        print("ERROR: 데이터셋이 없습니다!")
        print(f"경로: {data_path}")
        print("다운로드: https://zenodo.org/records/12578449")
        return
    
    print(f"데이터셋 경로: {data_path}")
    
    # DogFaceNet 실행
    dogfacenet_path = Path(__file__).parent / "DogFaceNet"
    sys.path.insert(0, str(dogfacenet_path))
    
    try:
        os.chdir(dogfacenet_path)
        print("DogFaceNet 모듈 로딩 중...")
        
        # 기본 실행
        subprocess.run([sys.executable, "dogfacenet/dogfacenet.py"])
        
    except Exception as e:
        print(f"실행 오류: {e}")

if __name__ == "__main__":
    main()
'''
    
    run_script_path = project_root / "run_dogfacenet.py"
    with open(run_script_path, 'w', encoding='utf-8') as f:
        f.write(run_script)
    
    print(f"실행 스크립트 생성: {run_script_path}")
    
    print("\n=" * 50)
    print("설정 완료!")
    print("다음 단계:")
    print("1. 데이터셋 다운로드:")
    print("   https://zenodo.org/records/12578449")
    print("2. 데이터를 data/dogfacenet/ 폴더에 압축 해제")
    print("3. python run_dogfacenet.py 실행")
    print("=" * 50)

if __name__ == "__main__":
    main()