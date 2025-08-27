#!/usr/bin/env python3
"""
프론트엔드 연동용 DALL-E 이미지 합성 API
동물 사진 + 커스텀 이미지 + 케어 활동(밥주기/씻기기/미용하기) → 합성 이미지
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
from typing import Tuple, Optional, Dict, Any

# 환경 변수 로드
load_dotenv()

class CareImageSynthesizer:
    """케어 활동 이미지 합성 API"""
    
    # 지원되는 케어 활동 정의
    CARE_ACTIVITIES = {
        "밥주기": {
            "action": "eating or sitting near food bowl with nutritious food, showing excitement and gratitude",
            "mood": "맛있는 음식 앞에서 열정적인 행복감을 보이며, 밝은 눈과 기민한 귀, 살짝 흔드는 꼬리",
            "scene": "feeding time with food bowls and fresh food visible"
        },
        "씻기기": {
            "action": "being gently washed or sitting contentedly after bath, looking clean and refreshed",
            "mood": "목욕 후 깨끗해진 상태로 순수한 기쁨과 만족감을 보이며, 꼬리를 살랑살랑 흔들고 밝고 신뢰하는 눈빛",
            "scene": "bathing or post-bath scene with water, towels, and bathing supplies"
        },
        "미용하기": {
            "action": "being groomed or sitting proudly after grooming, looking well-maintained and beautiful",
            "mood": "그루밍 후 깔끔해진 모습으로 평온하고 행복해하며, 완전한 신뢰와 행복감을 표현",
            "scene": "grooming session with brushes, combs, and grooming tools around"
        }
    }
    
    def __init__(self):
        """초기화"""
        self.setup_openai_client()
        self.results_dir = Path("results")
        self.results_dir.mkdir(exist_ok=True)
        
    def setup_openai_client(self) -> None:
        """OpenAI 클라이언트 설정"""
        try:
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key:
                raise ValueError("OPENAI_API_KEY not found in environment variables")
            
            self.client = OpenAI(api_key=api_key)
            print("✅ OpenAI API 클라이언트 초기화 완료")
            
        except Exception as e:
            print(f"❌ OpenAI API 설정 실패: {e}")
            raise
    
    def analyze_animal_with_gpt4v(self, image_data: bytes) -> str:
        """동물 이미지 분석 (바이너리 데이터 입력)"""
        try:
            # base64 인코딩
            image_base64 = base64.b64encode(image_data).decode('utf-8')
            
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": """이 동물의 특징을 상세히 분석해주세요:

1. 동물 종류와 품종 (한국 토종개 우선 고려)
2. 크기와 체격 (소형/중형/대형)
3. 털색과 무늬 (매우 정확하게 - 합성 시 핵심 요소)
4. 얼굴 특징 (귀 모양, 눈, 코, 표정)
5. 현재 자세와 행동
6. 전체적인 성격과 기질

특히 털색, 무늬, 체격은 매우 상세하게 기록해주세요. 이는 동일한 개체로 인식되는 핵심 요소입니다."""
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=700
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"❌ 동물 분석 실패: {e}")
            return "동물 분석 실패"
    
    def analyze_custom_space(self, image_data: bytes) -> str:
        """커스텀 공간 이미지 분석"""
        try:
            image_base64 = base64.b64encode(image_data).decode('utf-8')
            
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": """이 공간을 케어 활동 배경으로 사용하기 위해 분석해주세요:

1. 공간의 성격 (실내/실외, 방의 용도)
2. 조명 상태 (자연광/인공조명, 밝기, 색온도)
3. 주요 색상과 소재 (벽, 바닥, 가구 색상과 질감)
4. 가구와 물품 배치 상황
5. 전체적인 분위기와 스타일
6. 동물 케어 활동에 적합한 위치와 요소들

이 공간에서 동물이 자연스럽게 케어받을 수 있는 환경적 특성을 중심으로 분석해주세요."""
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=700
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"❌ 공간 분석 실패: {e}")
            return "공간 분석 실패"
    
    def create_care_prompt(self, animal_analysis: str, space_analysis: str, care_activity: str) -> str:
        """케어 활동별 DALL-E 프롬프트 생성"""
        
        if care_activity not in self.CARE_ACTIVITIES:
            raise ValueError(f"지원하지 않는 케어 활동: {care_activity}")
        
        activity_info = self.CARE_ACTIVITIES[care_activity]
        
        prompt = f"""High-quality photorealistic image: The exact same animal from the description below, naturally integrated into the custom space, engaged in {care_activity} care activity.

ANIMAL DESCRIPTION (PRESERVE EXACTLY):
{animal_analysis}

CUSTOM SPACE DESCRIPTION:
{space_analysis}

CARE ACTIVITY: {care_activity}
- Activity: {activity_info['action']}
- Emotional Expression: {activity_info['mood']}
- Scene Elements: {activity_info['scene']}

SYNTHESIS REQUIREMENTS:
1. IDENTICAL ANIMAL PRESERVATION:
   - Exact same fur color, patterns, and markings
   - Same body size, proportions, and breed characteristics
   - Same facial features, ear shape, and eye color
   - Must appear as the identical individual animal

2. NATURAL SPACE INTEGRATION:
   - Perfect lighting match with the custom space
   - Realistic shadows and reflections
   - Natural positioning within the environment
   - Proper scale and perspective

3. CARE ACTIVITY EXECUTION:
   - Animal engaged in {care_activity} naturally
   - Happy, comfortable, and well-cared-for expression
   - Appropriate care props and elements visible
   - Scene shows loving, gentle care environment

4. PHOTOGRAPHIC QUALITY:
   - High-resolution photorealistic style
   - Natural, documentary-style composition  
   - Warm, caring atmosphere
   - Professional photography lighting

5. SCENE COMPOSITION:
   - Focus on the care activity moment
   - Animal only (no human hands or people visible)
   - Natural, candid moment captured
   - Emphasize trust and happiness in animal's expression

CRITICAL: The animal must be recognizable as the exact same individual from the original photo, now happily receiving {care_activity} care in this custom space."""

        return prompt
    
    def generate_dalle_image(self, prompt: str, size: str = "1024x1024") -> Tuple[Optional[Image.Image], Optional[str]]:
        """DALL-E로 이미지 생성"""
        try:
            print(f"🎨 DALL-E로 {size} 이미지 생성 중...")
            
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
            
            print("✅ 이미지 생성 완료")
            return image, image_url
            
        except Exception as e:
            print(f"❌ 이미지 생성 실패: {e}")
            return None, None
    
    def save_synthesis_result(self, image: Image.Image, metadata: Dict[str, Any]) -> Dict[str, str]:
        """합성 결과 저장"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            # 이미지 저장
            image_filename = f"care_{metadata['activity']}_{timestamp}.png"
            image_path = self.results_dir / image_filename
            image.save(image_path, "PNG")
            
            # 메타데이터 저장
            metadata_filename = f"meta_{metadata['activity']}_{timestamp}.json"
            metadata_path = self.results_dir / metadata_filename
            
            with open(metadata_path, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, ensure_ascii=False, indent=2)
            
            return {
                "image_path": str(image_path),
                "metadata_path": str(metadata_path),
                "filename": image_filename,
                "timestamp": timestamp
            }
            
        except Exception as e:
            print(f"❌ 결과 저장 실패: {e}")
            return {}
    
    def synthesize_care_image(self, 
                            animal_image_data: bytes, 
                            custom_space_data: bytes, 
                            care_activity: str) -> Dict[str, Any]:
        """
        메인 API 함수: 케어 이미지 합성
        
        Args:
            animal_image_data: 동물 이미지 바이너리 데이터
            custom_space_data: 커스텀 공간 이미지 바이너리 데이터  
            care_activity: 케어 활동 ("밥주기", "씻기기", "미용하기")
            
        Returns:
            Dict containing success status, image path, metadata, and any errors
        """
        try:
            print(f"🐕💝 케어 활동 이미지 합성 시작: {care_activity}")
            
            if care_activity not in self.CARE_ACTIVITIES:
                return {
                    "success": False,
                    "error": f"지원하지 않는 케어 활동: {care_activity}",
                    "supported_activities": list(self.CARE_ACTIVITIES.keys())
                }
            
            # 1. 동물 이미지 분석
            print("1️⃣ 동물 이미지 분석 중...")
            animal_analysis = self.analyze_animal_with_gpt4v(animal_image_data)
            
            # 2. 커스텀 공간 분석
            print("2️⃣ 커스텀 공간 분석 중...")
            space_analysis = self.analyze_custom_space(custom_space_data)
            
            # 3. 케어 프롬프트 생성
            print("3️⃣ 케어 시나리오 프롬프트 생성 중...")
            care_prompt = self.create_care_prompt(animal_analysis, space_analysis, care_activity)
            
            # 4. DALL-E 이미지 합성
            print("4️⃣ DALL-E 이미지 합성 중...")
            synthesized_image, image_url = self.generate_dalle_image(care_prompt)
            
            if not synthesized_image:
                return {
                    "success": False,
                    "error": "DALL-E 이미지 생성 실패"
                }
            
            # 5. 결과 저장
            print("5️⃣ 결과 저장 중...")
            metadata = {
                "activity": care_activity,
                "animal_analysis": animal_analysis,
                "space_analysis": space_analysis,
                "synthesis_prompt": care_prompt,
                "dalle_url": image_url,
                "timestamp": datetime.now().isoformat()
            }
            
            save_result = self.save_synthesis_result(synthesized_image, metadata)
            
            print(f"✅ {care_activity} 케어 이미지 합성 완료!")
            
            return {
                "success": True,
                "activity": care_activity,
                "image_path": save_result.get("image_path"),
                "filename": save_result.get("filename"),
                "metadata": metadata,
                "timestamp": save_result.get("timestamp")
            }
            
        except Exception as e:
            print(f"❌ 합성 프로세스 실패: {e}")
            return {
                "success": False,
                "error": str(e)
            }

# 프론트엔드 연동용 간단한 API 함수들
def synthesize_feeding_image(animal_image_data: bytes, custom_space_data: bytes) -> Dict[str, Any]:
    """밥주기 이미지 합성"""
    synthesizer = CareImageSynthesizer()
    return synthesizer.synthesize_care_image(animal_image_data, custom_space_data, "밥주기")

def synthesize_bathing_image(animal_image_data: bytes, custom_space_data: bytes) -> Dict[str, Any]:
    """씻기기 이미지 합성"""
    synthesizer = CareImageSynthesizer()
    return synthesizer.synthesize_care_image(animal_image_data, custom_space_data, "씻기기")

def synthesize_grooming_image(animal_image_data: bytes, custom_space_data: bytes) -> Dict[str, Any]:
    """미용하기 이미지 합성"""
    synthesizer = CareImageSynthesizer()
    return synthesizer.synthesize_care_image(animal_image_data, custom_space_data, "미용하기")

def get_supported_activities() -> list:
    """지원되는 케어 활동 목록 반환"""
    return list(CareImageSynthesizer.CARE_ACTIVITIES.keys())

# 테스트 실행 함수
def test_synthesis():
    """테스트 실행"""
    print("케어 이미지 합성 API 테스트")
    
    # 테스트 이미지 경로
    animal_path = Path("data/animal.jpg")
    space_path = Path("data/custom_space.jpg")
    
    if not animal_path.exists() or not space_path.exists():
        print("❌ 테스트 이미지가 없습니다:")
        print(f"   {animal_path} - {'✅' if animal_path.exists() else '❌'}")
        print(f"   {space_path} - {'✅' if space_path.exists() else '❌'}")
        return
    
    # 이미지 데이터 로드
    with open(animal_path, 'rb') as f:
        animal_data = f.read()
    with open(space_path, 'rb') as f:
        space_data = f.read()
    
    # 케어 활동 선택
    activities = get_supported_activities()
    print(f"\n지원되는 케어 활동: {activities}")
    
    selected = input("테스트할 케어 활동을 선택하세요 (밥주기/씻기기/미용하기): ").strip()
    
    if selected not in activities:
        print(f"❌ 잘못된 선택: {selected}")
        return
    
    # 합성 실행
    synthesizer = CareImageSynthesizer()
    result = synthesizer.synthesize_care_image(animal_data, space_data, selected)
    
    if result["success"]:
        print(f"\n🎉 {selected} 합성 성공!")
        print(f"📁 결과 파일: {result['filename']}")
        print(f"📍 저장 위치: {result['image_path']}")
    else:
        print(f"\n❌ 합성 실패: {result.get('error', '알 수 없는 오류')}")

if __name__ == "__main__":
    test_synthesis()