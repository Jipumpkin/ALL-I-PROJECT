#!/usr/bin/env python3
"""
GPT-Image-1 이미지 생성 시스템
입력 이미지 1장 + 텍스트 프롬프트 → 새로운 이미지 생성
"""
import os
import base64
import requests
from PIL import Image
from io import BytesIO
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI
import json

# 환경 변수 로드
load_dotenv()

class SimpleImageGenerator:
    """GPT-Image-1 이미지 생성기"""
    
    def __init__(self):
        self.setup_openai_client()
        self.results_dir = Path("results")
        self.results_dir.mkdir(exist_ok=True)
        
    def setup_openai_client(self):
        """OpenAI 클라이언트 설정"""
        try:
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key:
                raise ValueError("OPENAI_API_KEY not found in environment variables")
            
            self.client = OpenAI(api_key=api_key)
            print("[OK] OpenAI API 클라이언트 초기화 완료")
            
        except Exception as e:
            print(f"[ERROR] OpenAI API 설정 실패: {e}")
            print("환경 변수에 OPENAI_API_KEY를 설정해주세요.")
            exit(1)
    
    def analyze_image(self, image_path):
        """입력 이미지 분석"""
        try:
            print(f"[분석중] 이미지 분석 중: {image_path}")
            
            # 이미지를 base64로 인코딩
            with open(image_path, "rb") as image_file:
                image_data = base64.b64encode(image_file.read()).decode('utf-8')
            
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": """이 이미지의 모든 요소를 매우 자세히 분석해주세요:

1. 주요 대상/객체의 상세한 특징
2. 색상, 질감, 패턴
3. 구도와 배치
4. 조명과 분위기
5. 스타일과 특별한 특징

가능한 한 구체적이고 상세하게 묘사해주세요."""
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_data}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=800
            )
            
            analysis = response.choices[0].message.content
            print("[완료] 이미지 분석 완료")
            return analysis
            
        except Exception as e:
            print(f"[ERROR] 이미지 분석 실패: {e}")
            return None
    
    def generate_image(self, image_analysis, user_prompt):
        """GPT-Image-1로 이미지 생성"""
        try:
            # 프롬프트 생성
            final_prompt = f"""Based on the following image analysis and user request, create a high-quality image:

IMAGE ANALYSIS:
{image_analysis}

USER REQUEST:
{user_prompt}

Create a photorealistic, high-quality image that follows the user's request while maintaining key elements from the original image where relevant."""
            
            print("[생성중] GPT-Image-1로 이미지 생성 중...")
            
            # GPT-Image-1 논스트리밍 생성으로 변경 (블러 방지)
            response = self.client.images.generate(
                model="gpt-image-1",
                prompt=final_prompt,
                stream=False,  # 스트리밍 비활성화로 완성된 이미지만 받기
            )
            
            # 완성된 이미지 처리
            if response.data and len(response.data) > 0:
                image_data = response.data[0]
                
                if hasattr(image_data, 'url') and image_data.url:
                    # URL로 이미지 다운로드
                    image_response = requests.get(image_data.url)
                    final_image = Image.open(BytesIO(image_response.content))
                    print("[완료] URL에서 이미지 다운로드 완료")
                    
                elif hasattr(image_data, 'b64_json') and image_data.b64_json:
                    # Base64 데이터로 이미지 생성
                    image_bytes = base64.b64decode(image_data.b64_json)
                    final_image = Image.open(BytesIO(image_bytes))
                    print("[완료] Base64에서 이미지 생성 완료")
                    
                else:
                    print("[ERROR] 이미지 데이터를 찾을 수 없음")
                    final_image = None
            else:
                print("[ERROR] 응답에 이미지 데이터가 없음")
                final_image = None
            
            if final_image:
                print("[완료] 이미지 생성 완료")
                return final_image, final_prompt
            else:
                print("[ERROR] 이미지 생성 실패")
                return None, None
            
        except Exception as e:
            print(f"[ERROR] 이미지 생성 실패: {e}")
            return None, None
    
    def save_results(self, image, user_prompt, full_prompt):
        """결과 저장"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            # 이미지 저장
            image_filename = f"generated_{timestamp}.png"
            image_path = self.results_dir / image_filename
            image.save(image_path)
            print(f"[저장] 이미지 저장: {image_path}")
            
            # 메타데이터 저장
            metadata = {
                "timestamp": timestamp,
                "user_prompt": user_prompt,
                "full_prompt": full_prompt,
                "output_image": str(image_filename)
            }
            
            metadata_filename = f"meta_{timestamp}.json"
            metadata_path = self.results_dir / metadata_filename
            with open(metadata_path, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, ensure_ascii=False, indent=2)
            print(f"[저장] 메타데이터 저장: {metadata_path}")
            
            return image_path
            
        except Exception as e:
            print(f"[ERROR] 결과 저장 실패: {e}")
            return None

def main():
    """메인 실행 함수"""
    print("\n" + "="*60)
    print("GPT-Image-1 이미지 생성기")
    print("="*60 + "\n")
    
    # 생성기 초기화
    generator = SimpleImageGenerator()
    
    # 입력 이미지 경로
    print("[입력] 이미지 경로를 입력하세요:")
    print("(예: data/dog.jpg 또는 data/room.jpg)")
    image_path = input("경로 입력: ").strip()
    
    if not Path(image_path).exists():
        print(f"[ERROR] 파일이 존재하지 않습니다: {image_path}")
        return
    
    # 이미지 분석
    analysis = generator.analyze_image(image_path)
    if not analysis:
        print("[ERROR] 이미지 분석 실패")
        return
    
    print("\n" + "="*60)
    print("텍스트 프롬프트를 입력하세요:")
    print("="*60)
    
    # ==================== 사용자 입력 공간 시작 ====================
    print("\n>>> 여기에 원하는 이미지를 설명하세요 <<<")
    print("예시:")
    print("  - 'A cute dog playing with a ball in a sunny park'")
    print("  - '해변에서 뛰어노는 강아지'")
    print("  - 'Transform into a superhero dog with cape'")
    print("\n" + "-"*60)
    
    user_prompt = input("프롬프트 입력 >>> ")  # 사용자가 작성할 공간
    
    # ==================== 사용자 입력 공간 끝 ====================
    
    if not user_prompt:
        print("[ERROR] 프롬프트가 입력되지 않았습니다.")
        return
    
    print(f"\n입력된 프롬프트: {user_prompt}")
    
    # 이미지 생성
    generated_image, full_prompt = generator.generate_image(analysis, user_prompt)
    
    if generated_image:
        # 결과 저장
        result_path = generator.save_results(generated_image, user_prompt, full_prompt)
        
        if result_path:
            print("\n" + "="*60)
            print("[성공] 이미지 생성 성공!")
            print(f"[결과] 위치: {result_path}")
            print("="*60)
            
            # 이미지 표시 및 재생성 옵션
            while True:
                print("\n다음 옵션을 선택하세요:")
                print("1. 이미지 보기 (v)")
                print("2. 같은 설정으로 재생성 (r)")
                print("3. 새로운 프롬프트로 재생성 (n)")
                print("4. 종료 (q)")
                
                choice = input("\n선택 (v/r/n/q): ").lower().strip()
                
                if choice in ['v', '1']:
                    generated_image.show()
                    
                elif choice in ['r', '2']:
                    print("\n[재생성] 같은 설정으로 다시 생성합니다...")
                    new_image, _ = generator.generate_image(analysis, user_prompt)
                    if new_image:
                        new_path = generator.save_results(new_image, user_prompt, full_prompt)
                        if new_path:
                            print(f"[완료] 새 이미지 저장: {new_path}")
                            generated_image = new_image
                            result_path = new_path
                        
                elif choice in ['n', '3']:
                    print("\n새로운 프롬프트를 입력하세요:")
                    new_user_prompt = input("새 프롬프트 >>> ")
                    if new_user_prompt:
                        new_image, new_full_prompt = generator.generate_image(analysis, new_user_prompt)
                        if new_image:
                            new_path = generator.save_results(new_image, new_user_prompt, new_full_prompt)
                            if new_path:
                                print(f"[완료] 새 이미지 저장: {new_path}")
                                generated_image = new_image
                                result_path = new_path
                                user_prompt = new_user_prompt
                                full_prompt = new_full_prompt
                    
                elif choice in ['q', '4']:
                    break
                    
                else:
                    print("[안내] v, r, n, q 중 하나를 입력해주세요.")
    else:
        print("[ERROR] 이미지 생성 실패")

if __name__ == "__main__":
    main()