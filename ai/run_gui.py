#!/usr/bin/env python3
"""
유기견 케어 통합 시스템 실행 파일
"""
import sys
import os
from pathlib import Path

# 현재 디렉토리를 Python 경로에 추가
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

try:
    from gui_app import main
    
    if __name__ == "__main__":
        print("🐕 유기견 케어 통합 시스템 시작")
        print("=" * 50)
        print("GUI 애플리케이션을 로딩 중...")
        
        # 필요한 디렉토리 생성
        data_dir = current_dir / "data"
        data_dir.mkdir(exist_ok=True)
        
        animal_db_dir = data_dir / "animal_database"
        animal_db_dir.mkdir(exist_ok=True)
        
        print(f"데이터 디렉토리: {data_dir}")
        print(f"동물 데이터베이스 디렉토리: {animal_db_dir}")
        print()
        print("🎉 GUI 애플리케이션을 시작합니다!")
        print("=" * 50)
        
        # GUI 실행
        main()
        
except ImportError as e:
    print(f"❌ 필요한 모듈을 불러올 수 없습니다: {e}")
    print("\n다음 패키지들이 설치되었는지 확인해주세요:")
    print("- tkinter (Python 기본 내장)")
    print("- pillow: pip install pillow")
    print("- opencv-python: pip install opencv-python")
    print("- scikit-learn: pip install scikit-learn")
    print("- openai: pip install openai")
    print("- python-dotenv: pip install python-dotenv")
    print("- matplotlib: pip install matplotlib")
    print("- requests: pip install requests")
    
except Exception as e:
    print(f"❌ 애플리케이션 실행 중 오류가 발생했습니다: {e}")
    import traceback
    traceback.print_exc()