#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import json
import requests
from PIL import Image
from io import BytesIO
import base64
import os
from openai import OpenAI
from dotenv import load_dotenv
import tempfile

# 환경 변수 로드
load_dotenv()

def download_image_from_url(url):
    """URL에서 이미지 다운로드"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        img = Image.open(BytesIO(response.content))
        img.verify()
        img = Image.open(BytesIO(response.content))
        
        return img
    except Exception as e:
        return None

def identify_dog_breed(img, client):
    """GPT-4V로 견종 파악"""
    try:
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode()

        prompt_text = """이 개의 견종을 정확히 파악해주세요.

다음 형식으로 정확히 답변해주세요:
견종: [정확한 견종명 또는 "믹스견" 또는 "파악불가"]
확신도: [높음/보통/낮음]
이유: [견종을 판단한 근거]

주의사항:
- 확신이 없으면 "파악불가"라고 답변하세요
- 믹스견의 경우 주요 특징이 보이는 견종들을 언급하세요"""

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt_text},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/png;base64,{img_base64}"}
                        }
                    ]
                }
            ],
            max_tokens=300
        )

        return response.choices[0].message.content
    except Exception as e:
        return "견종: 파악불가\n확신도: 낮음\n이유: 분석 오류"

def analyze_image_with_gpt4v(img, focus, breed_info, client):
    """GPT-4V로 이미지 내용 분석"""
    try:
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode()

        if focus == "rescue_dog":
            breed_context = ""
            if breed_info:
                breed_context = "\\n\\n이미 파악된 견종 정보: " + breed_info
            
            prompt_text = "이 유기견의 특징을 자세히 분석해주세요:" + breed_context + """

1. 견종과 크기: 정확한 견종, 체격, 나이대 추정
2. 외모적 특징: 털색, 무늬, 귀 모양, 꼬리, 독특한 매력 포인트
3. 표정과 성격: 현재 표정에서 드러나는 성격적 특성
4. 자세와 행동: 현재 자세에서 보이는 활동성이나 차분함
5. 전반적 건강상태: 털의 윤기, 눈의 활력 등
6. 매력 포인트: 이 아이만의 특별한 매력이나 사랑스러운 점

중요: 견종은 반드시 위에 제공된 정보를 기준으로 하세요!"""

        elif focus == "care_space":
            prompt_text = """이 공간을 케어 활동 관점에서 자세히 분석해주세요:

1. 공간의 성격: 욕실, 주방, 거실 등의 용도와 특성
2. 케어 도구들: 보이는 케어 관련 도구나 시설들
3. 조명과 분위기: 자연광, 조명의 밝기와 따뜻함
4. 색상과 소재: 벽, 바닥, 가구의 색상과 질감
5. 공간 배치: 케어 활동하기 좋은 배치와 여유 공간
6. 안전성: 개가 안전하게 케어받을 수 있는 환경"""

        else:
            prompt_text = "이 이미지에 무엇이 있는지 자세히 설명해주세요."

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt_text},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/png;base64,{img_base64}"}
                        }
                    ]
                }
            ],
            max_tokens=800
        )

        return response.choices[0].message.content
    except Exception as e:
        return "분석할 수 없는 이미지"

def create_care_activity_prompt(dog_desc, space_desc, activity, breed_info):
    """케어 활동 시각화 전용 프롬프트 생성"""
    
    # 활동별 세부 정보
    if activity == "목욕하기":
        action = "being gently bathed"
        setting = "bathroom or bathing area" 
        props = "warm water, gentle dog shampoo, soft towels"
        mood = "calm and trusting, enjoying the warm water and gentle care"
        details = "The dog is being lovingly bathed with warm water, surrounded by bubbles and bath accessories."
    elif activity == "씻기기":
        action = "being gently cleaned and groomed"
        setting = "comfortable grooming space"
        props = "grooming brushes, towels, cleaning supplies"
        mood = "relaxed and content, enjoying the gentle grooming"
        details = "The dog is being carefully cleaned and groomed, with gentle brushing and wiping."
    else:  # 밥주기
        action = "being fed with love and care"
        setting = "feeding area or kitchen"
        props = "food bowl, water bowl, nutritious dog food"
        mood = "happy and eager, appreciating the meal and care"
        details = "The dog is being fed with high-quality food in clean bowls."
    
    # 견종 정보 추출
    breed_line = ""
    if breed_info and "견종:" in breed_info:
        breed_part = breed_info.split("견종:")[1].split("\\n")[0].strip()
        if "파악불가" not in breed_part:
            breed_line = "BREED: " + breed_part + " - VERY IMPORTANT: The dog MUST be exactly this breed!"

    # 프롬프트 구성
    prompt = f"""Create a heartwarming, photorealistic image showing a rescue dog receiving loving care:

{breed_line}

RESCUE DOG: {dog_desc}
CARE SPACE: {space_desc}
CARE ACTIVITY: {action}

CRITICAL REQUIREMENTS:
- The dog MUST maintain the EXACT same breed characteristics
- Keep the same coat color, pattern, ear shape, body size, and facial features
- The dog is {action} in a {setting}
- Include: {props}
- The dog should look {mood}
- {details}

EMOTIONAL REQUIREMENTS:
- Show genuine love and care between the dog and caregiver
- The dog should appear comfortable and trusting
- Convey safety, love, and proper care
- Show caring human hands providing gentle interaction

TECHNICAL REQUIREMENTS:
- Ultra-realistic professional photography quality
- Perfect lighting and natural shadows
- Warm inviting color tones
- Sharp focus with natural depth of field"""

    return prompt

def generate_dalle_image(prompt, client):
    """DALL-E로 이미지 생성"""
    try:
        response = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            quality="standard",
            n=1
        )

        image_url = response.data[0].url
        
        # 이미지 다운로드하여 base64로 변환
        image_response = requests.get(image_url)
        img = Image.open(BytesIO(image_response.content))
        
        # base64로 인코딩
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        return f"data:image/png;base64,{img_base64}"

    except Exception as e:
        return None

def main():
    try:
        # 명령행 인자 받기
        if len(sys.argv) != 4:
            print(json.dumps({
                "success": False,
                "error": "사용법: python care-synthesis-url.py <dog_image_url> <space_image_url> <activity>"
            }))
            sys.exit(1)

        dog_image_url = sys.argv[1]
        space_image_url = sys.argv[2]
        activity = sys.argv[3]

        # OpenAI 클라이언트 초기화
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            print(json.dumps({
                "success": False,
                "error": ".env 파일에서 OPENAI_API_KEY를 찾을 수 없습니다."
            }))
            sys.exit(1)

        client = OpenAI(api_key=api_key)

        # 이미지 다운로드
        dog_img = download_image_from_url(dog_image_url)
        space_img = download_image_from_url(space_image_url)

        if not dog_img:
            print(json.dumps({
                "success": False,
                "error": "유기견 이미지를 다운로드할 수 없습니다."
            }))
            sys.exit(1)

        if not space_img:
            print(json.dumps({
                "success": False,
                "error": "공간 이미지를 다운로드할 수 없습니다."
            }))
            sys.exit(1)

        # 견종 파악
        breed_info = identify_dog_breed(dog_img, client)
        
        # 이미지 분석
        dog_desc = analyze_image_with_gpt4v(dog_img, "rescue_dog", breed_info, client)
        space_desc = analyze_image_with_gpt4v(space_img, "care_space", None, client)
        
        # 케어 활동 프롬프트 생성
        care_prompt = create_care_activity_prompt(dog_desc, space_desc, activity, breed_info)
        
        # AI 이미지 생성
        result_image = generate_dalle_image(care_prompt, client)
        
        if result_image:
            print(json.dumps({
                "success": True,
                "imageData": result_image,
                "breedInfo": breed_info,
                "prompt": care_prompt
            }))
        else:
            print(json.dumps({
                "success": False,
                "error": "AI 이미지 생성에 실패했습니다."
            }))

    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"처리 중 오류가 발생했습니다: {str(e)}"
        }))

if __name__ == "__main__":
    main()