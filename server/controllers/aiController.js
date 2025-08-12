const openai = require('../config/createai');
// const Image = require('../models/Image');
const User = require('../models/User');
const Animal = require('../models/Animal');
const path = require('path');
const fs = require('fs');



const aiController = {
    generateAiImage: async (req, res) => {
        try {
            const { animal_id, user_id, style, extraImageUrl, extraImageBase64 } = req.body;

            // 동물 이미지 가져오기
            const animal = await Animal.findById(animal_id);
            if (!animal) {
                return res.status(404).json({ error: '동물 이미지를 찾을 수 없습니다.'});
            }
            const animalImageUrl = animal.image_url;


            // 사용자 이미지 가져오기
            let userImageUrl;
            if (extraImageUrl === "registered") {

                // 회원가입 시 등록한 이미지
                const user = await User.findById(user_id);
                if (!user) {
                    return res.status(404).json({ error: "사용자 이미지를 찾을 수 없습니다."});
                }
                userImageUrl = user.image_url; 

            } else if (extraImageUrl === "default") {

                // 우리 쪽에서 제공하는 이미지
                userImageUrl = '기본 이미지 url'
            } else if (extraImageUrl === "new" && extraImageBase64) {

                //새로운 이미지 파일 업로드(base64->파일저장)
                const fileName = `upload_${Date.now()}.png`;

                const savePath = path.join(__dirname, "../uploads", fileName);

                const base64Data = extraImageBase64.replace(/^data:image\/png;base64,/, "");

                 fs.writeFileSync(savePath, base64Data, "base64");
                 userImageUrl = `${req.protocol}://${req.get("host")}/uploads/${fileName}`;
            } else {
                return res.status(400).json({ error: "이미지 소스 선택이 잘못되었습니다." });

            }
                
            if (!animalImageUrl || !userImageUrl ) {
                return res.status(400).json({ error: '동물사진과 집 사진을 올려주세요.'});
            }

            // 스타일 프롬프트 설정
            let promptTemplate = "";
            if (style === "bath") {
                promptTemplate = "반려동물을 깨끗이 목욕시키는 모습, 따뜻한 분위기, 현실적인 스타일";
            } else if (style === "meal") {
                promptTemplate = "반려동물이 맛있게 식사하는 모습, 편안하고 따뜻한 분위기, 현실적인 스타일";
            } else if (style === "styling") {
                promptTemplate = "반려동물이 미용을 하고 귀여운 옷을 입고 있는 모습, 선명하고 현실적인 스타일";
            } else {
                return res.status(400).json({ error: "스타일이 잘못되었습니다."})
            }

            // gpt 모델 이용해서 dalle 프롬프트 생성
            const promptResponse = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "당신은 DALL·E 프롬프트 작성 전문가입니다. 사용자가 한국어로 요청해도 DALL·E가 잘 이해할 수 있도록 영어로 변환하여 고품질 프롬프트를 작성하세요."
                    },
                    {
                        role: "user",
                        content: `다음 이미지들을 자연스럽게 합성해주세요: 프롬프트(${promptTemplate}), 유기동물(${animalImageUrl}), 집(${userImageUrl})`
                    }
                ]
            });

            const dallePrompt = promptResponse.choices[0].message.content;

            // dalle 모델로 이미지 생성
            const imageResponse = await openai.images.generate({
                model:"dall-e-3",
                prompt: dallePrompt,
                size: "1024x1024"
            });

            const imageUrl = imageResponse.data[0].url;

            // 결과 반환
            res.json({ imageUrl });

        } catch (error) {
            console.error (error); 
                res.status(500).json({ error: "오류가 발생하였습니다." });
            }
    }
};

module.exports = aiController ;