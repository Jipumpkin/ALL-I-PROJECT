#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Node.js 백엔드 연동용 CLI 스크립트
케어 이미지 합성을 위한 커맨드라인 인터페이스

Usage:
python care_synthesizer_cli.py --animal <path> --space <path> --activity <activity> --output <path>

Node.js에서 subprocess로 호출 가능
"""
import argparse
import json
import sys
import os
from pathlib import Path
from api_synthesizer import CareImageSynthesizer, get_supported_activities
import traceback

# UTF-8 출력 설정
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.detach())

def main():
    parser = argparse.ArgumentParser(description='케어 이미지 합성 CLI')
    
    # 필수 인자들
    parser.add_argument('--animal', required=True, 
                       help='동물 이미지 파일 경로')
    parser.add_argument('--space', required=True,
                       help='커스텀 공간 이미지 파일 경로') 
    parser.add_argument('--activity', required=True,
                       choices=['밥주기', '씻기기', '미용하기'],
                       help='케어 활동 선택')
    parser.add_argument('--output', required=False,
                       help='출력 디렉토리 (기본값: results/)')
    
    # 옵션 인자들
    parser.add_argument('--quiet', '-q', action='store_true',
                       help='진행 메시지 숨기기 (JSON 출력만)')
    parser.add_argument('--format', choices=['json', 'text'], default='json',
                       help='출력 형식 (기본값: json)')
    
    args = parser.parse_args()
    
    try:
        # 입력 파일 검증
        animal_path = Path(args.animal)
        space_path = Path(args.space)
        
        if not animal_path.exists():
            error_result = {
                "success": False,
                "error": f"동물 이미지를 찾을 수 없습니다: {animal_path}"
            }
            print(json.dumps(error_result, ensure_ascii=False))
            sys.exit(1)
            
        if not space_path.exists():
            error_result = {
                "success": False, 
                "error": f"공간 이미지를 찾을 수 없습니다: {space_path}"
            }
            print(json.dumps(error_result, ensure_ascii=False))
            sys.exit(1)
        
        # 출력 메시지 제어
        if not args.quiet:
            print(f"🚀 케어 이미지 합성 시작: {args.activity}", file=sys.stderr)
            print(f"📸 동물 이미지: {animal_path}", file=sys.stderr)
            print(f"🏠 공간 이미지: {space_path}", file=sys.stderr)
        
        # 이미지 데이터 로드
        with open(animal_path, 'rb') as f:
            animal_data = f.read()
        with open(space_path, 'rb') as f:
            space_data = f.read()
        
        # 합성기 초기화 및 실행
        synthesizer = CareImageSynthesizer()
        synthesizer.quiet = args.quiet  # quiet 모드 설정
        
        # 출력 디렉토리 설정 (필요시)
        if args.output:
            synthesizer.results_dir = Path(args.output)
            synthesizer.results_dir.mkdir(parents=True, exist_ok=True)
        
        # 합성 실행
        result = synthesizer.synthesize_care_image(
            animal_data, 
            space_data, 
            args.activity
        )
        
        # 결과 출력
        if args.format == 'json':
            # JSON 형태로 출력 (Node.js에서 파싱하기 좋음)
            output = {
                "success": result["success"],
                "activity": result.get("activity"),
                "image_path": result.get("image_path"),
                "filename": result.get("filename"), 
                "timestamp": result.get("timestamp"),
                "error": result.get("error")
            }
            print(json.dumps(output, ensure_ascii=False, indent=2))
        else:
            # 텍스트 형태로 출력
            if result["success"]:
                print(f"✅ 합성 성공!")
                print(f"📁 파일: {result['filename']}")
                print(f"📍 경로: {result['image_path']}")
            else:
                print(f"❌ 합성 실패: {result.get('error')}")
        
        # 종료 코드 설정
        sys.exit(0 if result["success"] else 1)
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": f"시스템 오류: {str(e)}",
            "traceback": traceback.format_exc() if not args.quiet else None
        }
        
        if args.format == 'json':
            print(json.dumps(error_result, ensure_ascii=False))
        else:
            print(f"❌ 오류: {e}")
            if not args.quiet:
                traceback.print_exc()
        
        sys.exit(1)

def list_activities():
    """지원되는 활동 목록 출력 (별도 명령어)"""
    activities = get_supported_activities()
    result = {
        "success": True,
        "activities": activities,
        "descriptions": {
            "밥주기": "동물이 음식을 먹거나 음식 그릇 근처에서 행복해하는 모습",
            "씻기기": "동물이 목욕하거나 목욕 후 깔끔한 상태의 행복한 모습", 
            "미용하기": "동물이 그루밍을 받거나 그루밍 후 아름다운 모습"
        }
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    # 특별 명령어 처리
    if len(sys.argv) == 2 and sys.argv[1] == '--list-activities':
        list_activities()
        sys.exit(0)
    
    # 일반 명령어 처리
    main()