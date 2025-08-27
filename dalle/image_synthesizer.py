#!/usr/bin/env python3
"""
DALL-E 이미지 합성 시스템
유기동물 사진 + 배경 이미지 + 사용자 프롬프트 → 새로운 합성 이미지
"""
import os
import sys
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

class DalleImageSynthesizer:
    """DALL-E 기반 이미지 합성 시스템"""
    
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
            print("OpenAI API 클라이언트 초기화 완료")
            
        except Exception as e:
            print(f"OpenAI API 설정 실패: {e}")
            print("환경 변수에 OPENAI_API_KEY를 설정해주세요.")
            sys.exit(1)
    
    def analyze_animal_image(self, image_path):
        """동물 이미지 분석 (GPT-4V 사용)"""
        try:
            print(f"동물 이미지 분석 중: {image_path}")
            
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
                                "text": """이 동물의 특징을 자세히 분석해주세요:

1. 동물 종류와 품종
2. 크기와 체격
3. 털색과 무늬 (매우 상세하게)
4. 얼굴과 표정의 특징
5. 자세와 행동
6. 전체적인 인상과 성격적 특성

특히 털색과 무늬는 매우 정확하게 묘사해주세요. 이는 합성 이미지에서 동일한 동물로 인식되는 핵심 요소입니다."""
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
                max_tokens=600
            )
            
            analysis = response.choices[0].message.content
            print("동물 이미지 분석 완료")
            return analysis
            
        except Exception as e:
            print(f"동물 이미지 분석 실패: {e}")
            return "분석 실패"
    
    def analyze_background_image(self, image_path):
        """배경 이미지 분석 (GPT-4V 사용)"""
        try:
            print(f"배경 이미지 분석 중: {image_path}")
            
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
                                "text": """이 배경 이미지를 합성 관점에서 분석해주세요:

1. 공간의 성격과 용도 (실내/실외, 어떤 공간인지)
2. 조명과 분위기 (자연광/인공조명, 밝기, 색온도)
3. 주요 색상과 질감 (벽, 바닥, 가구의 색상과 재질)
4. 공간의 크기와 구조 (넓이, 높이, 가구 배치)
5. 전체적인 스타일 (현대적/전통적, 깔끔함/아늑함)
6. 동물이 자연스럽게 위치할 수 있는 곳

이 배경에 동물이 자연스럽게 합성될 수 있도록 환경적 특성을 중심으로 분석해주세요."""
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
                max_tokens=600
            )
            
            analysis = response.choices[0].message.content
            print("배경 이미지 분석 완료")
            return analysis
            
        except Exception as e:
            print(f"배경 이미지 분석 실패: {e}")
            return "분석 실패"
    
    def create_synthesis_prompt(self, animal_analysis, background_analysis, user_prompt):
        """이미지 합성을 위한 DALL-E 프롬프트 생성"""
        
        prompt = f"""High-quality photorealistic image synthesis: Create an image of the exact same animal from the description below, naturally integrated into the background environment, following the user's specific request.

ANIMAL DESCRIPTION:
{animal_analysis}

BACKGROUND ENVIRONMENT:
{background_analysis}

USER REQUEST:
{user_prompt}

SYNTHESIS REQUIREMENTS:
- The animal must maintain EXACTLY the same physical characteristics (fur color, patterns, size, breed features)
- Natural integration into the background environment with proper lighting and shadows
- Realistic perspective and proportions
- High photographic quality
- The scene should look completely natural, as if originally photographed together

PRESERVATION CRITICAL:
- Exact same fur color and patterns
- Same body size and proportions  
- Same facial features and expression style
- Same breed characteristics
- Must appear as the identical individual animal

ENVIRONMENT INTEGRATION:
- Proper lighting that matches the background
- Realistic shadows and reflections
- Natural positioning within the space
- Appropriate scale and perspective
- Environmental elements should complement the scene

SCENE COMPOSITION:
- Focus on natural, candid moment
- Avoid artificial or staged appearance
- Ensure animal looks comfortable in the environment
- Follow user's specific activity or pose request
- Maintain photorealistic quality throughout

USER SPECIFICATION: {user_prompt}

Create a seamless, natural-looking photograph where the same animal appears perfectly integrated into the new environment."""

        return prompt
    
    def generate_image_with_dalle(self, prompt, size="1024x1024"):
        """DALL-E로 이미지 생성"""
        try:
            print("DALL-E로 이미지 생성 중...")
            print(f"프롬프트: {prompt[:100]}...")
            
            response = self.client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size=size,
                quality="hd",
                n=1
            )
            
            image_url = response.data[0].url
            
            # 이미지 다운로드
            image_response = requests.get(image_url)
            image = Image.open(BytesIO(image_response.content))
            
            print("이미지 생성 완료")
            return image, image_url
            
        except Exception as e:
            print(f"이미지 생성 실패: {e}")
            return None, None
    
    def save_results(self, synthesized_image, animal_analysis, background_analysis, 
                    user_prompt, synthesis_prompt, timestamp):
        """결과 저장"""
        try:
            # 이미지 저장
            image_filename = f"synthesized_{timestamp}.png"
            image_path = self.results_dir / image_filename
            synthesized_image.save(image_path)
            print(f"합성 이미지 저장: {image_path}")
            
            # 메타데이터 저장
            metadata = {
                "timestamp": timestamp,
                "user_prompt": user_prompt,
                "animal_analysis": animal_analysis,
                "background_analysis": background_analysis,
                "synthesis_prompt": synthesis_prompt,
                "output_image": image_filename
            }
            
            metadata_filename = f"metadata_{timestamp}.json"
            metadata_path = self.results_dir / metadata_filename
            with open(metadata_path, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, ensure_ascii=False, indent=2)
            print(f"메타데이터 저장: {metadata_path}")
            
            return image_path, metadata_path
            
        except Exception as e:
            print(f"결과 저장 실패: {e}")
            return None, None
    
    def synthesize_images(self, animal_image_path, background_image_path, user_prompt):
        """메인 이미지 합성 프로세스"""
        print("=" * 60)
        print("DALL-E 이미지 합성 시스템")
        print("=" * 60)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # 1. 동물 이미지 분석
        print("\n1. 동물 이미지 분석...")
        animal_analysis = self.analyze_animal_image(animal_image_path)
        
        # 2. 배경 이미지 분석
        print("\n2. 배경 이미지 분석...")
        background_analysis = self.analyze_background_image(background_image_path)
        
        # 3. 합성 프롬프트 생성
        print("\n3. 합성 프롬프트 생성...")
        synthesis_prompt = self.create_synthesis_prompt(
            animal_analysis, background_analysis, user_prompt
        )
        
        # 4. DALL-E로 이미지 생성
        print("\n4. DALL-E 이미지 합성...")
        synthesized_image, image_url = self.generate_image_with_dalle(synthesis_prompt)
        
        if synthesized_image:
            # 5. 결과 저장
            print("\n5. 결과 저장...")
            image_path, metadata_path = self.save_results(
                synthesized_image, animal_analysis, background_analysis,
                user_prompt, synthesis_prompt, timestamp
            )
            
            print("\n" + "=" * 60)
            print("합성 완료!")
            print("=" * 60)
            print(f"결과 이미지: {image_path}")
            print(f"상세 정보: {metadata_path}")
            
            return synthesized_image, image_path, metadata_path
        else:
            print("\n합성 실패")
            return None, None, None

def main():
    """메인 실행 함수"""
    print("DALL-E 이미지 합성 시스템")
    print("=" * 40)
    
    # 데이터 디렉토리 확인
    data_dir = Path("data")
    if not data_dir.exists():
        print("data 디렉토리가 없습니다. 생성합니다...")
        data_dir.mkdir()
    
    # 기본 설정값
    animal_image = data_dir / "animal.jpg"
    background_image = data_dir / "background.jpg"
    
    print(f"\n설정된 이미지 경로:")
    print(f"동물 이미지: {animal_image}")
    print(f"배경 이미지: {background_image}")
    
    # 이미지 파일 존재 확인
    if not animal_image.exists():
        print(f"\n❌ 동물 이미지가 없습니다: {animal_image}")
        print("data/animal.jpg 파일을 준비해주세요.")
        return
    
    if not background_image.exists():
        print(f"\n❌ 배경 이미지가 없습니다: {background_image}")
        print("data/background.jpg 파일을 준비해주세요.")
        return
    
    # 사용자 프롬프트 입력
    print(f"\n✅ 이미지 파일 확인 완료")
    print("\n사용자 프롬프트를 입력해주세요:")
    print("(예: 거실 소파에서 편안하게 쉬고 있는 모습)")
    print("(예: 주방에서 밥을 먹고 있는 행복한 표정)")
    print("(예: 정원에서 뛰어노는 활기찬 모습)")
    
    user_prompt = input("\n프롬프트 입력: ").strip()
    
    if not user_prompt:
        print("프롬프트가 입력되지 않았습니다.")
        return
    
    print(f"\n입력된 프롬프트: {user_prompt}")
    
    # 합성 시스템 초기화 및 실행
    try:
        synthesizer = DalleImageSynthesizer()
        result = synthesizer.synthesize_images(
            str(animal_image), 
            str(background_image), 
            user_prompt
        )
        
        if result[0]:  # 성공
            print(f"\n🎉 합성 성공!")
            print(f"이제 results/ 디렉토리에서 결과를 확인하세요.")
        else:
            print(f"\n❌ 합성 실패")
            
    except Exception as e:
        print(f"\n시스템 오류: {e}")

if __name__ == "__main__":
    main()