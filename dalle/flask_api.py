#!/usr/bin/env python3
"""
Flask 웹 API for 케어 이미지 합성
프론트엔드에서 호출할 수 있는 REST API 제공
"""
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from api_synthesizer import CareImageSynthesizer, get_supported_activities
import os
import base64
from pathlib import Path
from datetime import datetime
import traceback

app = Flask(__name__)
CORS(app)  # React 프론트엔드와의 CORS 허용

# 글로벌 합성 인스턴스
synthesizer = None

def init_synthesizer():
    """합성기 초기화"""
    global synthesizer
    if synthesizer is None:
        try:
            synthesizer = CareImageSynthesizer()
            print("✅ 케어 이미지 합성기 초기화 완료")
        except Exception as e:
            print(f"❌ 합성기 초기화 실패: {e}")
            raise

@app.route('/api/care-synthesis', methods=['POST'])
def synthesize_care_image():
    """
    케어 이미지 합성 API
    
    Request Body:
    {
        "animal_image": "base64_encoded_image_data",
        "custom_space": "base64_encoded_image_data", 
        "care_activity": "밥주기" | "씻기기" | "미용하기"
    }
    """
    try:
        # 합성기 초기화
        init_synthesizer()
        
        # 요청 데이터 검증
        if not request.is_json:
            return jsonify({
                "success": False,
                "error": "JSON 데이터가 필요합니다"
            }), 400
        
        data = request.get_json()
        
        # 필수 필드 검증
        required_fields = ['animal_image', 'custom_space', 'care_activity']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "success": False,
                    "error": f"필수 필드 누락: {field}"
                }), 400
        
        # 케어 활동 검증
        care_activity = data['care_activity']
        if care_activity not in get_supported_activities():
            return jsonify({
                "success": False,
                "error": f"지원하지 않는 케어 활동: {care_activity}",
                "supported_activities": get_supported_activities()
            }), 400
        
        # Base64 이미지 데이터 디코딩
        try:
            animal_image_data = base64.b64decode(data['animal_image'])
            custom_space_data = base64.b64decode(data['custom_space'])
        except Exception as e:
            return jsonify({
                "success": False,
                "error": f"Base64 디코딩 실패: {str(e)}"
            }), 400
        
        # 합성 실행
        print(f"🚀 API 요청 처리 시작: {care_activity}")
        result = synthesizer.synthesize_care_image(
            animal_image_data, 
            custom_space_data, 
            care_activity
        )
        
        if result["success"]:
            # 성공 응답
            return jsonify({
                "success": True,
                "activity": result["activity"],
                "filename": result["filename"],
                "timestamp": result["timestamp"],
                "message": f"{care_activity} 이미지 합성이 완료되었습니다!"
            }), 200
        else:
            # 합성 실패
            return jsonify({
                "success": False,
                "error": result.get("error", "알 수 없는 합성 오류")
            }), 500
            
    except Exception as e:
        print(f"❌ API 오류: {e}")
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": f"서버 오류: {str(e)}"
        }), 500

@app.route('/api/download/<filename>', methods=['GET'])
def download_result(filename):
    """합성 결과 이미지 다운로드"""
    try:
        results_dir = Path("results")
        file_path = results_dir / filename
        
        if not file_path.exists():
            return jsonify({
                "success": False,
                "error": "파일을 찾을 수 없습니다"
            }), 404
        
        return send_file(
            str(file_path),
            as_attachment=True,
            download_name=filename,
            mimetype='image/png'
        )
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/activities', methods=['GET'])
def get_activities():
    """지원되는 케어 활동 목록 반환"""
    return jsonify({
        "success": True,
        "activities": get_supported_activities(),
        "descriptions": {
            "밥주기": "동물이 음식을 먹거나 음식 그릇 근처에서 행복해하는 모습",
            "씻기기": "동물이 목욕하거나 목욕 후 깔끔한 상태의 행복한 모습", 
            "미용하기": "동물이 그루밍을 받거나 그루밍 후 아름다운 모습"
        }
    })

@app.route('/api/status', methods=['GET'])
def get_status():
    """API 상태 확인"""
    try:
        # OpenAI API 키 확인
        api_key_exists = bool(os.getenv('OPENAI_API_KEY'))
        
        # 결과 디렉토리 확인
        results_dir = Path("results")
        results_dir_exists = results_dir.exists()
        
        return jsonify({
            "success": True,
            "status": "running",
            "openai_api_configured": api_key_exists,
            "results_directory": str(results_dir),
            "results_directory_exists": results_dir_exists,
            "supported_activities": get_supported_activities(),
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """헬스 체크"""
    return jsonify({
        "success": True,
        "status": "healthy",
        "service": "DALL-E 케어 이미지 합성 API",
        "timestamp": datetime.now().isoformat()
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "success": False,
        "error": "API 엔드포인트를 찾을 수 없습니다"
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        "success": False,
        "error": "내부 서버 오류"
    }), 500

if __name__ == '__main__':
    print("🚀 DALL-E 케어 이미지 합성 API 서버 시작")
    print("=" * 50)
    print("📍 엔드포인트:")
    print("  POST /api/care-synthesis  - 이미지 합성")
    print("  GET  /api/download/<file> - 결과 다운로드") 
    print("  GET  /api/activities      - 활동 목록")
    print("  GET  /api/status          - 상태 확인")
    print("  GET  /api/health          - 헬스 체크")
    print("=" * 50)
    
    # 개발 서버 실행
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )