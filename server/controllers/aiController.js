const createai = require('../config/createai');

// const aiController = {
//     generateAiImage: async (req, res) => {
//         try {
//             const { petImageUrl, homeImageUrl } = req.bosy;

//             if (!petImageUrl || !homeImageUrl ) {
//                 return res.status(400).json({ error: '동물사진과 집 사진을 올려주세요.'});
//             }

//             // gpt 모델 이용해서 dalle 프롬프트 생성
//             const promptResponse = await openai.chat.completions.create({
//                 model: "gpr-4o-mini",
//                 message: [
//                     {
//                         role: "system",
//                         content: "당신은 DALL·E 프롬프트 작성 전문가입니다. 사용자가 한국어로 요청해도 DALL·E가 잘 이해할 수 있도록 영어로 변환하여 고품질 프롬프트를 작성하세요."
//                     },
//                     {
//                         role: "user",
//                         content: `다음 두 이미지를 자연스럽게 합성해주세요: 유기동물(${petImageUrl}), 집(${homeImageUrl})`
//                     }
//                 ]
//             });

//             const dallePrompt = promptResponse.choices[0].message.content;

//             // dalle 모델로 이미지 생성
//             const imageResponse = await openai.images.generate({
//                 model:"gpt-image-1",
//                 prompt: daleePrompt,
//                 size: "1024x1024"
//             });

//             const imageUrl = imageResponse.data[0].url;

//             // 결과 반환
//             res.json({ imageUrl });

//         } catch (error) {
//             console.error (error); 
//                 res.status(500).json({ error: "오류가 발생하였습니다."});
//             }
//     }
// };

module.exports = aiController ;