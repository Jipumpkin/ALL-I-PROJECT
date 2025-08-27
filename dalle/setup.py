#!/usr/bin/env python3
"""
DALL-E 케어 이미지 합성 시스템 설정 스크립트
"""
import os
import sys
from pathlib import Path

def setup_environment():
    """환경 설정"""
    print("🔧 DALL-E 케어 이미지 합성 시스템 설정")
    print("=" * 50)
    
    # 필요한 디렉토리 생성
    dirs_to_create = ['data', 'results']
    for dir_name in dirs_to_create:
        dir_path = Path(dir_name)
        if not dir_path.exists():
            dir_path.mkdir(parents=True)
            print(f"✅ {dir_name}/ 디렉토리 생성")
        else:
            print(f"📁 {dir_name}/ 디렉토리 이미 존재")
    
    # .env 파일 확인
    env_file = Path('.env')
    env_example = Path('.env.example')
    
    if not env_file.exists() and env_example.exists():
        # .env.example을 .env로 복사
        with open(env_example, 'r') as f:
            content = f.read()
        with open(env_file, 'w') as f:
            f.write(content)
        print("✅ .env 파일 생성 완료")
        print("⚠️  OpenAI API 키를 .env 파일에 설정해주세요!")
    elif env_file.exists():
        print("📄 .env 파일 이미 존재")
    
    # Python 패키지 설치 확인
    print("\n📦 Python 패키지 설치 확인...")
    required_packages = ['openai', 'Pillow', 'requests', 'python-dotenv']
    
    missing_packages = []
    for package in required_packages:
        try:
            __import__(package.replace('-', '_').lower())
            print(f"✅ {package}")
        except ImportError:
            missing_packages.append(package)
            print(f"❌ {package}")
    
    if missing_packages:
        print(f"\n⚠️  누락된 패키지가 있습니다: {', '.join(missing_packages)}")
        print("다음 명령어로 설치하세요:")
        print("pip install -r requirements.txt")
    else:
        print("\n🎉 모든 패키지가 설치되어 있습니다!")
    
    # OpenAI API 키 확인
    print("\n🔑 OpenAI API 키 확인...")
    from dotenv import load_dotenv
    load_dotenv()
    
    api_key = os.getenv('OPENAI_API_KEY')
    if api_key and api_key != 'your_openai_api_key_here':
        print("✅ OpenAI API 키 설정됨")
    else:
        print("❌ OpenAI API 키가 설정되지 않았습니다")
        print("⚠️  .env 파일에서 OPENAI_API_KEY를 설정해주세요")
    
    print("\n" + "=" * 50)
    print("🚀 설정 완료!")
    print("\n📋 다음 단계:")
    print("1. .env 파일에 OpenAI API 키 설정")
    print("2. data/ 폴더에 테스트 이미지 추가")
    print("3. CLI 테스트: python care_synthesizer_cli.py --help")

if __name__ == '__main__':
    setup_environment()