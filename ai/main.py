# 라이브러리 import
from openai import OpenAI
import requests
from PIL import Image
from io import BytesIO
import matplotlib.pyplot as plt
import os
import numpy as np
import base64
from pathlib import Path
from dotenv import load_dotenv
import tkinter as tk
from tkinter import filedialog

# 환경 변수 로드
load_dotenv()

# OpenAI API 키 설정
try:
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("API key not found")
    client = OpenAI(api_key=api_key)
    print("✅ API 키가 성공적으로 로드되었습니다!")
except Exception as e:
    print("ERROR: .env 파일에서 OPENAI_API_KEY를 찾을 수 없습니다.")
    print("1. .env 파일을 생성하고 OPENAI_API_KEY=your_key 를 입력하세요.")
    print("2. .env.example 파일을 참고하세요.")
    input("API 키를 설정한 후 Enter를 누르세요...")
    exit(1)

# ====== 유기견 케어 활동 시각화 도구 ======
print("""
🐕💝 유기견 케어 활동 시각화 도구

🎯 목표: 유기견이 새 가정에서 케어받는 따뜻한 순간들을 시각화
✨ 이 도구로 유기견이 사랑받으며 케어받는 모습을 미리 보세요!

📸 준비물:
1️⃣ 유기견 사진 (보호소, 입양 사이트 등에서)
2️⃣ 케어 공간 사진 (욕실, 주방, 거실 등)
3️⃣ 케어 활동 선택 (목욕하기/씻기기/밥주기)

🎨 결과: 
→ 유기견이 새 가정에서 정성스런 케어를 받는 따뜻한 실사 이미지

💝 특별한 점:
- 각 활동에 맞는 자연스러운 시나리오 생성
- 유기견의 특징을 살린 개별 맞춤 이미지
- 사랑과 정성이 담긴 케어 활동 표현
- 실제 같은 고품질 이미지 생성

🌟 지원 형식: URL 링크, 파일 업로드 모두 지원
""")
print("=" * 70)

def generate_dalle_image(prompt, size="1024x1024"):
    """DALL-E로 이미지 생성"""
    try:
        response = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size=size,
            quality="standard",
            n=1
        )

        image_url = response.data[0].url
        print(f"✅ 이미지 생성 완료: {prompt[:50]}...")

        # 이미지 다운로드
        image_response = requests.get(image_url)
        img = Image.open(BytesIO(image_response.content))
        return img

    except Exception as e:
        print(f"❌ 이미지 생성 실패: {e}")
        return None

def upload_images():
    """로컬에서 이미지 파일 선택"""
    print("📁 이미지 파일을 선택하세요...")
    
    # tkinter 파일 다이얼로그 사용
    root = tk.Tk()
    root.withdraw()  # 메인 창 숨기기
    
    filetypes = [
        ('이미지 파일', '*.png *.jpg *.jpeg *.gif *.bmp'),
        ('모든 파일', '*.*')
    ]
    
    filenames = filedialog.askopenfilenames(
        title='이미지 파일을 선택하세요',
        filetypes=filetypes
    )
    
    images = []
    for filename in filenames:
        try:
            img = Image.open(filename)
            images.append((img, os.path.basename(filename)))
            print(f"✅ {os.path.basename(filename)} 로드 완료")
        except Exception as e:
            print(f"❌ {filename} 로드 실패: {e}")
    
    root.destroy()
    return images

def download_image_from_url(url):
    """URL에서 이미지 다운로드"""
    try:
        print(f"🌐 이미지 다운로드 중: {url[:60]}...")

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()

        img = Image.open(BytesIO(response.content))
        img.verify()
        img = Image.open(BytesIO(response.content))

        print(f"✅ 이미지 다운로드 완료 ({img.size[0]}x{img.size[1]})")
        return img

    except requests.exceptions.RequestException as e:
        print(f"❌ 네트워크 오류: {e}")
        return None
    except Exception as e:
        print(f"❌ 이미지 처리 오류: {e}")
        return None

def identify_dog_breed(img):
    """GPT-4V로 견종 정확히 파악 (한국개 중심)"""
    try:
        import base64
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode()

        prompt_text = """이 개의 견종을 정확히 파악해주세요. 한국개(토종개)에 특별히 집중해주세요!

다음 형식으로 정확히 답변해주세요:
견종: [정확한 견종명 또는 "한국토종개" 또는 "믹스견" 또는 "파악불가"]
확신도: [높음/보통/낮음]
이유: [견종을 판단한 근거]

한국개 관련 주의사항:
- 진돗개, 삽살개, 풍산개 등 한국 토종개 특징을 우선 확인하세요
- 귀가 쫑긋하고 꼬리가 말려있으면 한국토종개 가능성 높음
- 중간 크기, 황갈색/갈색/흰색 털, 단단한 체격은 한국개 특징
- 특징이 애매하면 "한국토종개 믹스" 또는 "토종개"로 분류
- 확실한 외국 견종이 아니면 한국개 계열로 우선 분류하세요

한국의 유기견 대부분이 토종개나 토종개 믹스임을 고려해주세요."""

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt_text
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{img_base64}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=300
        )

        breed_info = response.choices[0].message.content
        print(f"🔍 견종 파악 결과:\n{breed_info}")
        return breed_info

    except Exception as e:
        print(f"❌ 견종 파악 실패: {e}")
        return "파악불가"

def analyze_image_with_gpt4v(img, focus="detailed", breed_info=None):
    """GPT-4V로 이미지 내용 분석"""
    try:
        import base64
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode()

        if focus == "rescue_dog":
            breed_context = ""
            if breed_info:
                breed_context = "\n\n이미 파악된 견종 정보: " + breed_info
            
            prompt_text = "이 유기견의 특징을 자세히 분석해서 다음 정보를 제공해주세요:" + breed_context + """

1. 견종과 크기: 정확한 견종 (위에 제공된 견종 정보 활용), 체격, 나이대 추정
2. 털색과 무늬 (매우 중요!): 정확한 털색 명시 (예: 갈색, 검은색, 흰색, 황갈색, 크림색 등), 무늬나 얼룩 패턴, 털의 길이와 질감
3. 외모적 특징: 귀 모양, 꼬리, 체형, 얼굴 생김새, 눈 색깔
4. 표정과 성격: 현재 표정에서 드러나는 성격적 특성
5. 자세와 행동: 현재 자세에서 보이는 활동성이나 차분함
6. 매력 포인트: 이 아이만의 특별한 매력이나 사랑스러운 점

특히 털색과 무늬는 매우 정확하게 묘사해주세요! 이는 생성된 이미지에서 동일한 아이로 인식될 수 있도록 하는 핵심 요소입니다.
견종은 반드시 위에 제공된 정보를 기준으로 하세요!"""

        elif focus == "target_space":
            prompt_text = """이 타겟 배경 이미지를 합성 관점에서 자세히 분석해서 다음 정보를 제공해주세요:

1. 공간의 성격: 실내/실외, 어떤 종류의 공간인지 (거실, 주방, 침실, 정원 등)
2. 조명과 분위기: 자연광/인공조명, 밝기, 색온도, 전체적인 분위기
3. 색상과 질감: 주요 색상, 바닥재, 벽면, 가구의 질감과 색상
4. 공간의 크기와 구조: 넓이, 높이, 가구 배치, 여유 공간
5. 스타일과 특성: 현대적/전통적, 깔끔함/아늑함, 전체적인 인테리어 스타일
6. 개가 자연스럽게 있을 수 있는 위치: 어느 부분에 개가 앉거나 있으면 자연스러울지

이 공간에 개가 자연스럽게 합성될 수 있도록 환경적 특성을 중심으로 분석해주세요."""

        elif focus == "care_space":
            prompt_text = """이 공간을 케어 활동 관점에서 자세히 분석해서 다음 정보를 제공해주세요:

1. 공간의 성격: 욕실, 주방, 거실 등의 용도와 특성
2. 케어 도구들: 보이는 케어 관련 도구나 시설들
3. 조명과 분위기: 자연광, 조명의 밝기와 따뜻함
4. 색상과 소재: 벽, 바닥, 가구의 색상과 질감
5. 공간 배치: 케어 활동하기 좋은 배치와 여유 공간
6. 안전성: 개가 안전하게 케어받을 수 있는 환경

개가 이 공간에서 편안하고 안전하게 케어받을 수 있는 환경적 요소들을 중심으로 설명해주세요."""

        else:
            prompt_text = "이 이미지에 무엇이 있는지 자세히 설명해주세요."

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt_text
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{img_base64}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=800
        )

        description = response.choices[0].message.content
        print(f"🔍 분석 완료: {description[:120]}...")
        return description

    except Exception as e:
        print(f"❌ 분석 실패: {e}")
        return "분석할 수 없는 이미지"

def create_care_activity_prompt(dog_desc, space_desc, activity, breed_info):
    """케어 활동 시각화 전용 프롬프트 생성 (실사 중심)"""
    
    # 활동별 세부 정보 (행복한 표현 강화, 사람 없이)
    if activity == "목욕하기":
        action = "sitting happily near bathing area with water and shampoo visible, looking relaxed after bath"
        mood = "목욕 후 깨끗해진 상태로 순수한 기쁨과 만족감을 보이며, 꼬리를 살랑살랑 흔들고 밝고 신뢰하는 눈빛"
    elif activity == "씻기기":
        action = "sitting contentedly near grooming supplies, looking well-groomed and happy"
        mood = "그루밍 후 깔끔해진 모습으로 평온하고 행복해하며, 완전한 신뢰와 행복감을 표현"
    else:  # 밥주기
        action = "eating or sitting near food bowl with nutritious food, showing excitement and gratitude"
        mood = "맛있는 음식 앞에서 열정적인 행복감을 보이며, 밝은 눈과 기민한 귀, 살짝 흔드는 꼬리"
    
    # 견종 정보 추출 (한국개 중심)
    breed_part = "Korean native dog mix"
    if breed_info and "견종:" in breed_info:
        extracted = breed_info.split("견종:")[1].split("\n")[0].strip()
        if "파악불가" not in extracted:
            breed_part = extracted
            # 한국어 견종명을 영어로 변환
            if "진돗개" in extracted:
                breed_part = "Jindo dog"
            elif "삽살개" in extracted:
                breed_part = "Sapsaree"
            elif "풍산개" in extracted:
                breed_part = "Pungsan dog"
            elif "한국토종개" in extracted or "토종개" in extracted:
                breed_part = "Korean native dog"
            elif "믹스" in extracted and ("한국" in extracted or "토종" in extracted):
                breed_part = "Korean native dog mix"
    
    # 개 특징 요약 (길이 제한)
    dog_summary = dog_desc[:250] + "..." if len(dog_desc) > 250 else dog_desc
    space_summary = space_desc[:150] + "..." if len(space_desc) > 150 else space_desc
    
    # 한국개와 타겟 배경 합성 프롬프트 (한글)
    prompt = f"""사진처럼 실제 같은 이미지: 원본 사진과 정확히 동일한 {breed_part}가 타겟 배경에서 {action}하는 모습을 합성하세요.

중요: 이 이미지는 원본 사진의 정확히 똑같은 한국개가 새로운 배경 환경에 자연스럽게 합성된 모습이어야 합니다.

개 정보: {dog_summary}
타겟 배경 정보: {space_summary}

보존할 한국개 특징:
- 전통적인 한국개 특징 유지: 쫑긋한 귀, 말린 꼬리, 단단한 체격
- 한국개 고유의 기질과 위엄 보존
- 한국 토종개의 특징적인 털 질감과 색상 유지
- 한국 견종 특유의 지적이고 충성스러운 표정

감정과 행복감:
{mood}
- 새로운 행복감과 함께 드러나는 동일한 한국개의 성격
- 신뢰와 만족을 보여주는 밝고 지적인 눈 (한국개는 표현력 있는 눈으로 유명함)
- 원래의 품격 있는 성격을 유지하면서 자연스럽게 행복한 표정
- 이 한국 유기견은 이제 사랑받고 보살핌을 받고 있음

원본 개 정체성 보존:
- 원본과 정확히 동일한 털색, 무늬, 얼룩 사용
- 동일한 귀 모양 (한국개는 보통 쫑긋하고 직립), 눈색, 코색
- 한국 견종 특유의 동일한 체격 비율과 탄탄한 체격
- 동일한 털 질감과 길이 (보통 이중털)
- 상처, 독특한 표시, 특징적인 부분들 보존
- 단순히 같은 견종이 아닌 동일한 개체로 보여야 함
- 한국개 특유의 기민하고 지적인 자세 유지

사진 스타일:
- 따뜻하고 포근한 일반 가정집 분위기
- 생활감이 느껴지는 자연스러운 인테리어 배경
- 편안하고 애정 어린 자연스러운 조명
- 개만 단독으로 나타나는 구성 (사람은 절대 나타나면 안됨)
- 진실한 가정생활 순간을 보여주는 다큐멘터리 스타일

가정집 배경 요소:
- 따뜻하고 편안한 가정집 분위기
- 원목 마루나 따뜻한 색감의 바닥
- 가족이 생활하는 공간의 자연스러운 가구들
- 창문을 통해 들어오는 부드러운 자연광
- 아늑하고 생활감 있는 거실이나 주방
- 소파, 러그, 쿠션 등 편안한 생활용품들
- 일반적인 한국 가정집의 따뜻한 분위기
- 집에서 느낄 수 있는 안락하고 포근한 환경

절대 금지사항:
- 사람의 모습, 손, 팔, 다리 등 인체 부위 절대 금지
- 사람의 그림자나 실루엣도 나타나면 안됨
- 사람이 케어하는 장면 절대 금지
- 개만 단독으로 촬영된 구도 필수
- 현대적이고 고급스러운 케어 용품들만 주변에 배치
- 개가 스스로 행복해하는 모습에 집중
- NO HUMANS, NO HANDS, NO PEOPLE - DOG ONLY

합성 목표: 정확히 동일한 한국 유기견을 타겟 배경 이미지에 자연스럽게 합성하여, 마치 그 공간에서 원래부터 살던 것처럼 자연스럽고 고유한 한국개 정체성과 성격을 보존하면서 행복한 모습을 보여주세요."""

    return prompt

def create_care_visualization(dog_img, space_img, activity):
    """케어 활동 시각화 생성"""
    print(f"🐕💝 '{activity}' 케어 활동 시각화 시작...")
    print("이 아이가 얼마나 정성스럽게 케어받을지 보여드릴게요!")

    # 0단계: 견종 파악 (가장 중요!)
    print("\n🔍 견종 정확히 파악 중...")
    print("- 이 단계가 매우 중요합니다. 견종을 정확히 파악해야 동일한 아이로 시각화됩니다.")
    breed_info = identify_dog_breed(dog_img)
    
    # 견종 파악 결과 확인 (한국개 우선)
    if "파악불가" in breed_info or not breed_info.strip():
        print("⚠️  견종 파악이 어렵습니다.")
        print("✅ 자동으로 한국토종개 믹스로 처리합니다.")
        breed_info = "견종: 한국토종개 믹스\n확신도: 자동 처리\n이유: 한국 유기견의 특성을 고려하여 토종개 믹스로 분류"
        print("✅ 한국토종개 믹스로 설정 완료!")
    else:
        print("✅ 견종 파악 완료!")

    # 1단계: 유기견 이미지 분석 (견종 정보 포함)
    print(f"\n🐕 유기견 분석 중...")
    print("- 이 아이의 특징과 성격을 파악하고 있습니다")
    dog_desc = analyze_image_with_gpt4v(dog_img, "rescue_dog", breed_info)

    # 2단계: 타겟 배경 분석
    print(f"\n🖼️ 타겟 배경 분석 중...")
    print(f"- {activity} 합성을 위한 최적의 배경 환경을 분석하고 있습니다")
    space_desc = analyze_image_with_gpt4v(space_img, "target_space")

    # 3단계: 케어 활동 프롬프트 생성 (견종 정보 포함)
    print(f"\n💝 '{activity}' 케어 시나리오 생성 중...")
    care_prompt = create_care_activity_prompt(dog_desc, space_desc, activity, breed_info)

    print(f"📋 따뜻한 케어 시나리오 준비 완료")

    # 4단계: 케어 활동 이미지 생성
    print(f"\n🎨 '{activity}' 케어 이미지 생성 중...")
    print("⏳ 동일한 견종으로 정성스럽게 케어받는 모습을 그려내고 있습니다...")

    result_img = generate_dalle_image(care_prompt, size="1024x1024")

    if result_img:
        print(f"✅ '{activity}' 케어 시각화 완료!")
        print("💕 견종이 보존되어 원본과 동일한 아이가 케어받는 모습입니다!")
        return result_img, care_prompt, breed_info
    else:
        print("❌ 케어 시각화 생성 실패")
        return None, care_prompt, breed_info

def display_image(img, title="Image"):
    """이미지 출력"""
    plt.figure(figsize=(12, 12))
    plt.imshow(img)
    plt.axis('off')
    plt.title(title, fontsize=14, pad=20)
    plt.show()

def display_images_side_by_side(images, titles):
    """여러 이미지를 나란히 출력"""
    fig, axes = plt.subplots(1, len(images), figsize=(6*len(images), 6))
    
    if len(images) == 1:
        axes = [axes]
    
    for i, (img, title) in enumerate(zip(images, titles)):
        axes[i].imshow(img)
        axes[i].axis('off')
        axes[i].set_title(title, fontsize=12, pad=10)
    
    plt.tight_layout()
    plt.show()

def display_prompt_info(prompt, breed_info):
    """프롬프트 정보를 시각적으로 표시"""
    print("\n" + "="*80)
    print("📋 사용된 프롬프트 정보")
    print("="*80)
    
    # 견종 정보 표시
    print(f"\n🔍 파악된 견종 정보:")
    print("-" * 40)
    print(breed_info)
    
    # 프롬프트 섹션별로 나누어 표시
    print(f"\n🎨 DALL-E 생성 프롬프트:")
    print("-" * 40)
    
    # 프롬프트를 섹션별로 분리하여 표시
    sections = prompt.split('\n\n')
    for i, section in enumerate(sections):
        if section.strip():
            if i == 0:
                print(f"📝 기본 설명:")
                print(f"   {section}")
            elif "BREED:" in section:
                print(f"\n🐕 견종 요구사항:")
                print(f"   {section}")
            elif "RESCUE DOG:" in section:
                print(f"\n🐾 유기견 특징:")
                print(f"   {section}")
            elif "CARE SPACE:" in section:
                print(f"\n🏠 케어 공간:")
                print(f"   {section}")
            elif "CARE ACTIVITY:" in section:
                print(f"\n💝 케어 활동:")
                print(f"   {section}")
            elif "CRITICAL BREED REQUIREMENTS:" in section:
                print(f"\n⚠️  견종 보존 요구사항:")
                for line in section.split('\n')[1:]:
                    if line.strip():
                        print(f"   {line}")
            elif "SCENE REQUIREMENTS:" in section:
                print(f"\n🎬 장면 요구사항:")
                for line in section.split('\n')[1:]:
                    if line.strip():
                        print(f"   {line}")
            elif "EMOTIONAL REQUIREMENTS:" in section:
                print(f"\n❤️  감정적 요구사항:")
                for line in section.split('\n')[1:]:
                    if line.strip():
                        print(f"   {line}")
            elif "TECHNICAL REQUIREMENTS:" in section:
                print(f"\n⚙️  기술적 요구사항:")
                for line in section.split('\n')[1:]:
                    if line.strip():
                        print(f"   {line}")
            elif "COMPOSITION DETAILS:" in section:
                print(f"\n🖼️  구성 세부사항:")
                for line in section.split('\n')[1:]:
                    if line.strip():
                        print(f"   {line}")
    
    print("\n" + "="*80)

def save_image(img, filename):
    """이미지 저장"""
    img.save(filename)
    print(f"💾 이미지가 '{filename}'로 저장되었습니다.")

# === 메인 실행 부분 ===
print("🐕💝 유기견 케어 활동 시각화 도구")
print("=" * 50)

# 로컬 독립 실행을 위한 파일 입력 설정
dog_image_path = "./data/arg1.jpg"  # 유기동물 사진
space_image_path = "./data/arg2.jpg"  # 커스텀 이미지 (사용 안함)
target_image_path = "./data/target.jpg"  # 합성할 타겟 이미지
selected_activity = "밥주기"

print(f"📸 설정된 입력값:")
print(f"1️⃣ 유기견 사진: {dog_image_path}")
print(f"2️⃣ 타겟 배경 이미지: {target_image_path}")
print(f"3️⃣ 선택된 활동: {selected_activity}")

# 1단계: 유기견 이미지 로드
print(f"\n🐕 유기견 사진 로드 중: {dog_image_path}")
try:
    dog_img = Image.open(dog_image_path)
    print("✅ 유기견 사진 준비 완료!")
except Exception as e:
    print(f"❌ 유기견 사진을 불러올 수 없습니다: {e}")
    print("arg1.jpg 파일이 현재 디렉토리에 있는지 확인해주세요.")
    exit()

# 2단계: 타겟 배경 이미지 로드
print(f"\n🖼️ 타겟 배경 이미지 로드 중: {target_image_path}")
try:
    target_img = Image.open(target_image_path)
    print("✅ 타겟 배경 이미지 준비 완료!")
except Exception as e:
    print(f"❌ 타겟 배경 이미지를 불러올 수 없습니다: {e}")
    print("target.jpg 파일이 data 디렉토리에 있는지 확인해주세요.")
    exit()

print(f"✅ '{selected_activity}' 케어 활동으로 시각화를 진행합니다!")

# 4단계: 케어 활동 시각화 실행
print(f"\n🎨 '{selected_activity}' 케어 시각화를 시작합니다!")

result_img, story_prompt, breed_info = create_care_visualization(dog_img, target_img, selected_activity)

if result_img:
    # 모든 이미지 나란히 출력 (입력 이미지들 + 생성된 이미지)
    images = [dog_img, target_img, result_img]
    titles = [
        f"🐕 유기견 원본",
        f"🖼️ 타겟 배경",
        f"💝 '{selected_activity}' - 합성 결과"
    ]
    display_images_side_by_side(images, titles)
    
    # 사용된 프롬프트 정보 시각화
    display_prompt_info(story_prompt, breed_info)
    
    # 이미지 저장
    filename = f"dog_care_{selected_activity.replace('/', '_')}.png"
    save_image(result_img, filename)
    
    # 케어 스토리 저장 (견종 정보 포함)
    story_filename = f"care_story_{selected_activity.replace('/', '_')}.txt"
    with open(story_filename, "w", encoding="utf-8") as f:
        f.write(f"💝 {selected_activity} 케어 시각화 스토리:\n\n")
        f.write(f"견종 정보:\n{breed_info}\n\n")
        f.write(f"시각화 프롬프트:\n{story_prompt}\n\n")
        f.write("이 이미지는 AI가 그려낸 이 아이가 사랑받으며 케어받는 모습입니다.\n")
        f.write("견종이 정확히 보존되어 원본과 동일한 아이의 모습으로 생성되었습니다.\n")
        f.write("실제 입양 후에도 이런 정성스런 케어를 받을 수 있기를 바랍니다! 🐾")
    
    print(f"📖 케어 스토리가 '{story_filename}'에 저장되었습니다.")
    
    # 다른 케어 활동도 생성할지 물어보기
    more_activities = input(f"\n🔄 같은 아이로 다른 케어 활동도 시각화하시겠습니까? (y/n): ") or "n"
    
    if more_activities.lower() == 'y':
        remaining_activities = [act for key, act in activities.items() if act != selected_activity]
        print(f"\n남은 케어 활동들: {', '.join(remaining_activities)}")
        
        for activity in remaining_activities:
            generate_more = input(f"'{activity}' 시각화를 생성하시겠습니까? (y/n): ") or "n"
            
            if generate_more.lower() == 'y':
                print(f"\n🎨 '{activity}' 케어 시각화 생성 중...")
                print("🔄 동일한 견종 정보로 생성합니다...")
                
                # 이미 파악된 견종 정보를 사용하여 일관성 유지
                result2, _, _ = create_care_visualization(dog_img, space_img, activity)
                
                if result2:
                    # 추가 케어 활동 이미지도 나란히 출력
                    images2 = [dog_img, space_img, result2]
                    titles2 = [
                        f"🐕 유기견 원본",
                        f"🏠 케어 공간", 
                        f"💝 '{activity}' - 사랑받는 모습"
                    ]
                    display_images_side_by_side(images2, titles2)
                    filename2 = f"dog_care_{activity.replace('/', '_')}.png"
                    save_image(result2, filename2)
                    print(f"✅ '{activity}' 케어 시각화 완료!")

    print("\n🌈 모든 케어 활동 시각화가 완료되었습니다!")
    print("💝 이 아이가 정말로 이런 사랑받는 삶을 살 수 있도록 입양을 고려해보세요!")
    print("🐾 모든 유기견들이 따뜻한 보살핌을 받을 수 있기를... 💕")

else:
    print("❌ 케어 시각화 생성에 실패했습니다.")
    print("💡 이미지나 프롬프트를 다시 확인해보세요.")

print("\n🌟 유기견 케어 활동 시각화 도구 사용을 완료했습니다!")
print("감사합니다! 🙏")