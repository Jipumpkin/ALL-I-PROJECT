#!/usr/bin/env python3
"""
GPT-Image-1 기반 케어 이미지 합성 API
동물 사진 + 커스텀 공간 이미지 + 케어 활동 → GPT-Image-1 직접 합성
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
from typing import Optional, Dict, Any, List

# 환경 변수 로드
load_dotenv()

class GPTImageCareImageSynthesizer:
    """GPT-Image-1 기반 케어 활동 이미지 합성 API"""
    
    # 지원되는 케어 활동 정의
    CARE_ACTIVITIES = {
        "밥주기": {
            "action": "eating or sitting near food bowl with nutritious food, showing excitement and gratitude",
            "mood": "열정적인 행복감을 보이며, 밝은 눈과 기민한 귀, 살짝 흔드는 꼬리",
            "scene": "feeding time with food bowls and fresh food visible",
            "description": "동물이 음식을 먹거나 음식 그릇 근처에서 행복해하는 모습"
        },
        "씻기기": {
            "action": "being gently washed or sitting contentedly after bath, looking clean and refreshed",
            "mood": "목욕 후 깨끗해진 상태로 순수한 기쁨과 만족감을 보이며, 꼬리를 살랑살랑 흔들고 밝고 신뢰하는 눈빛",
            "scene": "bathing or post-bath scene with water, towels, and bathing supplies",
            "description": "동물이 목욕하거나 목욕 후 깔끔한 상태의 행복한 모습"
        },
        "미용하기": {
            "action": "being groomed or sitting proudly after grooming, looking well-maintained and beautiful",
            "mood": "그루밍 후 깔끔해진 모습으로 평온하고 행복해하며, 완전한 신뢰와 행복감을 표현",
            "scene": "grooming session with brushes, combs, and grooming tools around",
            "description": "동물이 그루밍을 받거나 그루밍 후 아름다운 모습"
        }
    }
    
    def __init__(self):
        """초기화"""
        self.quiet = False  # quiet 모드 설정
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
            if not getattr(self, 'quiet', False):
                print("✅ OpenAI API 클라이언트 초기화 완료 (GPT-Image-1)")
            
        except Exception as e:
            print(f"❌ OpenAI API 설정 실패: {e}")
            raise
    
    def create_unified_care_prompt(self, care_activity: str) -> str:
        """GPT-Image-1용 통합 케어 프롬프트 생성"""
        
        if care_activity not in self.CARE_ACTIVITIES:
            raise ValueError(f"지원하지 않는 케어 활동: {care_activity}")
        
        activity_info = self.CARE_ACTIVITIES[care_activity]
        
        prompt = f"""Create a heartwarming adoption visualization image showing what it would look like when this shelter animal becomes part of this family's home.

ADOPTION SIMULATION CONCEPT:
This is a "future family moment" preview - showing how this specific shelter animal would look living happily in the user's actual home space during a care activity.

INPUT IMAGES:
- First image: Shelter animal (extract this exact individual pet)
- Second image: User's real home space (use as the living environment)

COMPOSITION FOR ADOPTION PREVIEW:
1. THE ADOPTED ANIMAL:
   - Extract the exact animal from the shelter photo
   - Preserve ALL identifying features: fur patterns, coloring, facial markings, ear shape, eye color, size
   - Transform the animal's demeanor to show contentment and belonging
   - The animal should look settled, happy, and "at home" (not stressed or anxious)
   - Show the animal as healthy and well-cared-for in their new environment

2. THE NEW HOME ENVIRONMENT:
   - Use the user's space as the primary living environment
   - Maintain all room characteristics: furniture, decor, lighting, architectural features
   - Keep the authentic "lived-in" feeling of the user's actual space
   - Preserve the room's natural lighting and color palette

3. THE CARE MOMENT - {care_activity}:
   - Activity: {activity_info['action']}
   - Emotional tone: {activity_info['mood']}
   - Scene elements: {activity_info['scene']}
   - Show this as a natural daily routine in the new home
   - Emphasize the bond between the animal and their new family life

4. ADOPTION VISUALIZATION REALISM:
   - Create the feeling "this could be your daily life together"
   - Show natural integration of the animal into the home routine
   - Add realistic lighting that makes the animal truly belong in this space
   - Perfect scale and perspective as if the animal already lives there
   - Warm, domestic atmosphere that helps visualize successful adoption

EMOTIONAL GOAL: Help potential adopters visualize this animal thriving as their new family member in their actual living space.
   - Warm, caring atmosphere
   - Professional photography lighting
   - Focus on the care activity moment
   - Emphasize trust and happiness in animal's expression

5. COMPOSITION:
   - Animal only (no human hands or people visible)
   - Natural, candid moment captured
   - Show loving, gentle care environment
   - Props and elements appropriate for {care_activity}

Create a heartwarming scene that shows this beloved animal receiving {care_activity} care in their new loving home environment."""

        return prompt
    
    def prepare_image_for_api(self, image_data: bytes) -> str:
        """이미지 데이터를 API용 base64 형식으로 준비"""
        try:
            # 이미지 로드 및 검증
            image = Image.open(BytesIO(image_data))
            
            # 이미지 크기 최적화 (GPT-Image-1 권장 사이즈)
            max_size = 1024
            if image.width > max_size or image.height > max_size:
                image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
            
            # PNG 형식으로 변환
            buffer = BytesIO()
            image.save(buffer, format='PNG', optimize=True)
            buffer.seek(0)
            
            # base64 인코딩
            image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            return f"data:image/png;base64,{image_base64}"
            
        except Exception as e:
            raise ValueError(f"이미지 처리 실패: {str(e)}")
    
    def generate_care_image_with_gpt_image1(self, 
                                          animal_image_path: str, 
                                          space_image_path: str, 
                                          care_activity: str) -> Dict[str, Any]:
        """GPT-Image-1으로 케어 이미지 직접 생성"""
        try:
            if not self.quiet:
                print(f"🎨 GPT-Image-1으로 {care_activity} 케어 이미지 생성 중...")
            
            # 통합 프롬프트 생성 (이미지 파일은 직접 파일 객체로 전달)
            care_prompt = self.create_unified_care_prompt(care_activity)
            
            if not self.quiet:
                print("📝 다중 이미지 합성 프롬프트 생성 완료")
                print(f"🐕 동물 이미지 (첫 번째): {animal_image_path}")
                print(f"🏠 공간 이미지 (두 번째): {space_image_path}")
                print("🔗 GPT-Image-1 다중 이미지 입력으로 합성 시작...")
            
            # GPT-Image-1 API 호출 (다중 이미지 입력) - 동물 + 공간 이미지 배열
            with open(animal_image_path, 'rb') as animal_file, \
                 open(space_image_path, 'rb') as space_file:
                response = self.client.images.edit(
                    model="gpt-image-1",
                    image=[animal_file, space_file],  # 다중 이미지 배열로 전달
                    prompt=care_prompt,
                    size="1024x1024",
                    quality="high",
                    n=1
                )
            
            if not self.quiet:
                print("✅ GPT-Image-1 다중 이미지 합성 완료 (동물 + 공간)")
            
            # GPT-Image-1 응답 구조 디버그
            print(f"🔍 GPT-Image-1 응답 구조 확인:")
            print(f"   - response.data 길이: {len(response.data) if response.data else 'None'}")
            if response.data and len(response.data) > 0:
                first_item = response.data[0]
                print(f"   - 첫 번째 항목 속성: {dir(first_item)}")
                print(f"   - URL: {getattr(first_item, 'url', 'url 속성 없음')}")
                if hasattr(first_item, 'b64_json'):
                    print(f"   - base64 데이터 있음: {first_item.b64_json is not None}")
            
            # 이미지 URL에서 데이터 가져오기
            image_url = response.data[0].url if response.data and response.data[0].url else None
            
            if image_url:
                image_response = requests.get(image_url)
                image = Image.open(BytesIO(image_response.content))
            elif hasattr(response.data[0], 'b64_json') and response.data[0].b64_json:
                # Base64 데이터로 이미지 생성
                import base64
                image_data = base64.b64decode(response.data[0].b64_json)
                image = Image.open(BytesIO(image_data))
                image_url = "base64_data"
            else:
                raise ValueError("이미지 URL 또는 Base64 데이터를 찾을 수 없습니다")
            
            return {
                "success": True,
                "image": image,
                "image_url": image_url,
                "model": "gpt-image-1",
                "activity": care_activity
            }
            
        except Exception as e:
            print(f"❌ GPT-Image-1 이미지 생성 실패: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def save_synthesis_result(self, image: Image.Image, metadata: Dict[str, Any]) -> Dict[str, str]:
        """합성 결과 저장"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            # 이미지 저장
            image_filename = f"gpt_image1_care_{metadata['activity']}_{timestamp}.png"
            image_path = self.results_dir / image_filename
            image.save(image_path, "PNG")
            
            # 메타데이터 저장
            metadata_filename = f"meta_gpt_image1_{metadata['activity']}_{timestamp}.json"
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
        메인 API 함수: GPT-Image-1 기반 케어 이미지 합성
        
        Args:
            animal_image_data: 동물 이미지 바이너리 데이터
            custom_space_data: 커스텀 공간 이미지 바이너리 데이터  
            care_activity: 케어 활동 ("밥주기", "씻기기", "미용하기")
            
        Returns:
            Dict containing success status, image path, metadata, and any errors
        """
        try:
            if not self.quiet:
                print(f"🚀 GPT-Image-1 케어 활동 이미지 합성 시작: {care_activity}")
            
            if care_activity not in self.CARE_ACTIVITIES:
                return {
                    "success": False,
                    "error": f"지원하지 않는 케어 활동: {care_activity}",
                    "supported_activities": list(self.CARE_ACTIVITIES.keys())
                }
            
            # 임시 이미지 파일 생성
            import tempfile
            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as animal_temp:
                animal_temp.write(animal_image_data)
                animal_temp_path = animal_temp.name
                
            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as space_temp:
                space_temp.write(custom_space_data)
                space_temp_path = space_temp.name

            try:
                # GPT-Image-1으로 직접 이미지 생성
                generation_result = self.generate_care_image_with_gpt_image1(
                    animal_temp_path, space_temp_path, care_activity
                )
            finally:
                # 임시 파일 정리
                import os
                try:
                    os.unlink(animal_temp_path)
                    os.unlink(space_temp_path)
                except:
                    pass
            
            if not generation_result["success"]:
                return {
                    "success": False,
                    "error": generation_result.get("error", "이미지 생성 실패")
                }
            
            # 결과 저장
            if not self.quiet:
                print("💾 결과 저장 중...")
            
            metadata = {
                "activity": care_activity,
                "model": "gpt-image-1",
                "image_url": generation_result["image_url"],
                "timestamp": datetime.now().isoformat(),
                "prompt": self.create_unified_care_prompt(care_activity)
            }
            
            save_result = self.save_synthesis_result(generation_result["image"], metadata)
            
            if not self.quiet:
                print(f"✅ {care_activity} 케어 이미지 합성 완료! (GPT-Image-1)")
            
            return {
                "success": True,
                "activity": care_activity,
                "image_path": save_result.get("image_path"),
                "filename": save_result.get("filename"),
                "metadata": metadata,
                "timestamp": save_result.get("timestamp"),
                "model": "gpt-image-1"
            }
            
        except Exception as e:
            print(f"❌ 합성 프로세스 실패: {e}")
            return {
                "success": False,
                "error": str(e)
            }

# 프론트엔드 연동용 간단한 API 함수들 (호환성 유지)
def synthesize_feeding_image(animal_image_data: bytes, custom_space_data: bytes) -> Dict[str, Any]:
    """밥주기 이미지 합성 (GPT-Image-1)"""
    synthesizer = GPTImageCareImageSynthesizer()
    return synthesizer.synthesize_care_image(animal_image_data, custom_space_data, "밥주기")

def synthesize_bathing_image(animal_image_data: bytes, custom_space_data: bytes) -> Dict[str, Any]:
    """씻기기 이미지 합성 (GPT-Image-1)"""
    synthesizer = GPTImageCareImageSynthesizer()
    return synthesizer.synthesize_care_image(animal_image_data, custom_space_data, "씻기기")

def synthesize_grooming_image(animal_image_data: bytes, custom_space_data: bytes) -> Dict[str, Any]:
    """미용하기 이미지 합성 (GPT-Image-1)"""
    synthesizer = GPTImageCareImageSynthesizer()
    return synthesizer.synthesize_care_image(animal_image_data, custom_space_data, "미용하기")

def get_supported_activities() -> list:
    """지원되는 케어 활동 목록 반환"""
    return list(GPTImageCareImageSynthesizer.CARE_ACTIVITIES.keys())

# 테스트 실행 함수
def test_synthesis():
    """테스트 실행"""
    print("GPT-Image-1 케어 이미지 합성 API 테스트")
    
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
    synthesizer = GPTImageCareImageSynthesizer()
    result = synthesizer.synthesize_care_image(animal_data, space_data, selected)
    
    if result["success"]:
        print(f"\n🎉 {selected} 합성 성공! (GPT-Image-1)")
        print(f"📁 결과 파일: {result['filename']}")
        print(f"📍 저장 위치: {result['image_path']}")
        print(f"🤖 사용 모델: {result['model']}")
    else:
        print(f"\n❌ 합성 실패: {result.get('error', '알 수 없는 오류')}")

if __name__ == "__main__":
    test_synthesis()