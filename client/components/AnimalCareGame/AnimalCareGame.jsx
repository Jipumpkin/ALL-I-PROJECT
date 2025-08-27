import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../axios';
import styles from './AnimalCareGame.module.css';

// 공 던지기 미니 게임 컴포넌트
const BallGameComponent = ({ onComplete, onClose, score, setScore }) => {
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 80 });
  const [targetPosition, setTargetPosition] = useState({ x: 75, y: 30 });
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameActive, setGameActive] = useState(true);

  useEffect(() => {
    if (timeLeft > 0 && gameActive) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setGameActive(false);
      setTimeout(() => onComplete(score), 1000);
    }
  }, [timeLeft, gameActive, score, onComplete]);

  const throwBall = (e) => {
    if (!gameActive) return;
    
    e.stopPropagation();
    
    // 클릭한 위치로 공을 이동
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;
    
    setBallPosition({ x: clickX, y: clickY });
    
    // 타겟과의 거리 계산
    const distance = Math.abs(clickX - targetPosition.x) + Math.abs(clickY - targetPosition.y);
    if (distance < 20) {
      setScore(score + 10);
      // 새로운 타겟 위치
      setTargetPosition({
        x: Math.random() * 80 + 10,
        y: Math.random() * 50 + 20
      });
    } else {
      setScore(Math.max(0, score - 2));
    }
    
    // 1초 후 공 위치 리셋
    setTimeout(() => {
      setBallPosition({ x: 50, y: 80 });
    }, 1000);
  };

  return (
    <div className={styles.miniGameContainer}>
      <div className={styles.gameHeader}>
        <h3>🎾 공 던지기 게임</h3>
        <div className={styles.gameStats}>
          <span>점수: {score}</span>
          <span>시간: {timeLeft}초</span>
        </div>
      </div>
      
      <div className={styles.ballGameField} onClick={throwBall}>
        <div 
          className={styles.target}
          style={{ left: `${targetPosition.x}%`, top: `${targetPosition.y}%` }}
        >
          🎯
        </div>
        <div 
          className={styles.ball}
          style={{ left: `${ballPosition.x}%`, top: `${ballPosition.y}%` }}
        >
          ⚽
        </div>
        <div className={styles.dog}>🐕</div>
        {!gameActive && (
          <div className={styles.gameEndOverlay}>
            <h4>게임 종료!</h4>
            <p>최종 점수: {score}점</p>
          </div>
        )}
      </div>
      
      <div className={styles.gameInstructions}>
        <p>🎯 필드를 클릭해서 공을 던져보세요! 타겟에 가깝게 던질수록 점수가 올라요!</p>
        <button onClick={onClose} className={styles.closeGameButton}>
          게임 종료
        </button>
      </div>
    </div>
  );
};

// 낚시 미니 게임 컴포넌트  
const FishingGameComponent = ({ onComplete, onClose, score, setScore }) => {
  const [fishVisible, setFishVisible] = useState(false);
  const [fishPosition, setFishPosition] = useState(50);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameActive, setGameActive] = useState(true);

  useEffect(() => {
    if (timeLeft > 0 && gameActive) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setGameActive(false);
      setTimeout(() => onComplete(score), 1000);
    }
  }, [timeLeft, gameActive, score, onComplete]);

  useEffect(() => {
    if (!gameActive) return;
    
    const fishTimer = setInterval(() => {
      if (Math.random() < 0.3) {
        setFishVisible(true);
        setFishPosition(Math.random() * 80 + 10);
        setTimeout(() => setFishVisible(false), 2000);
      }
    }, 1500);
    
    return () => clearInterval(fishTimer);
  }, [gameActive]);

  const catchFish = () => {
    if (fishVisible && gameActive) {
      setScore(score + 15);
      setFishVisible(false);
    }
  };

  return (
    <div className={styles.miniGameContainer}>
      <div className={styles.gameHeader}>
        <h3>🎣 낚시 게임</h3>
        <div className={styles.gameStats}>
          <span>점수: {score}</span>
          <span>시간: {timeLeft}초</span>
        </div>
      </div>
      
      <div className={styles.fishingGameField}>
        <div className={styles.water}>
          🌊🌊🌊🌊🌊🌊🌊🌊
        </div>
        {fishVisible && (
          <div 
            className={styles.fish}
            style={{ left: `${fishPosition}%` }}
            onClick={catchFish}
          >
            🐟
          </div>
        )}
        <div className={styles.cat}>🐱</div>
        <div className={styles.fishingRod}>🎣</div>
        {!gameActive && (
          <div className={styles.gameEndOverlay}>
            <h4>게임 종료!</h4>
            <p>최종 점수: {score}점</p>
          </div>
        )}
      </div>
      
      <div className={styles.gameInstructions}>
        <p>🐟 물고기가 나타나면 빨리 클릭하세요!</p>
        <button onClick={onClose} className={styles.closeGameButton}>
          게임 종료
        </button>
      </div>
    </div>
  );
};

// 퍼즐 미니 게임 컴포넌트
const PuzzleGameComponent = ({ onComplete, onClose, score, setScore }) => {
  const [pieces, setPieces] = useState([3, 1, 4, 2, 0]); // 0은 빈 공간
  const [moves, setMoves] = useState(0);
  const [gameActive, setGameActive] = useState(true);
  const correctOrder = [1, 2, 3, 4, 0];

  const movePiece = (index) => {
    if (!gameActive) return;
    
    const emptyIndex = pieces.indexOf(0);
    
    // 1차원 퍼즐이므로 좌우 이동만 허용
    const validMove = 
      (index === emptyIndex - 1 && emptyIndex % 5 !== 0) ||
      (index === emptyIndex + 1 && (emptyIndex + 1) % 5 !== 0);
    
    if (validMove) {
      const newPieces = [...pieces];
      [newPieces[index], newPieces[emptyIndex]] = [newPieces[emptyIndex], newPieces[index]];
      setPieces(newPieces);
      setMoves(moves + 1);
      
      // 퍼즐 완성 체크
      if (JSON.stringify(newPieces) === JSON.stringify(correctOrder)) {
        const finalScore = Math.max(50 - moves, 10);
        setScore(finalScore);
        setGameActive(false);
        setTimeout(() => onComplete(finalScore), 1000);
      }
    }
  };

  return (
    <div className={styles.miniGameContainer}>
      <div className={styles.gameHeader}>
        <h3>🧩 퍼즐 게임</h3>
        <div className={styles.gameStats}>
          <span>이동 횟수: {moves}</span>
        </div>
      </div>
      
      <div className={styles.puzzleGameField}>
        <div className={styles.puzzleGrid}>
          {pieces.map((piece, index) => (
            <div
              key={index}
              className={`${styles.puzzlePiece} ${piece === 0 ? styles.empty : ''}`}
              onClick={() => movePiece(index)}
              style={{ cursor: 'pointer' }}
            >
              {piece === 0 ? '' : piece}
            </div>
          ))}
        </div>
        {!gameActive && (
          <div className={styles.gameEndOverlay}>
            <h4>퍼즐 완성!</h4>
            <p>최종 점수: {score}점 ({moves}번 이동)</p>
          </div>
        )}
      </div>
      
      <div className={styles.gameInstructions}>
        <p>🧩 숫자를 1,2,3,4 순서대로 배열하세요!</p>
        <button onClick={onClose} className={styles.closeGameButton}>
          게임 종료
        </button>
      </div>
    </div>
  );
};

// 케어 애니메이션 디스플레이 컴포넌트
const CareAnimationDisplay = ({ careType, animalName }) => {
  const [animationFrame, setAnimationFrame] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationFrame(prev => (prev + 1) % 4);
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  const getCareAnimation = () => {
    const frames = animationFrame;
    
    // 한국어 조사 처리 함수
    const getKoreanParticle = (name, particle) => {
      if (!name) return '';
      
      const lastChar = name.charAt(name.length - 1);
      const lastCharCode = lastChar.charCodeAt(0);
      
      // 한글인지 확인
      if (lastCharCode >= 0xAC00 && lastCharCode <= 0xD7A3) {
        const finalConsonant = (lastCharCode - 0xAC00) % 28;
        
        if (particle === '이/가') {
          return finalConsonant > 0 ? '이' : '가';
        } else if (particle === '을/를') {
          return finalConsonant > 0 ? '을' : '를';
        } else if (particle === '은/는') {
          return finalConsonant > 0 ? '은' : '는';
        } else if (particle === '와/과') {
          return finalConsonant > 0 ? '과' : '와';
        }
      }
      
      // 한글이 아닌 경우 기본값
      if (particle === '이/가') return '가';
      if (particle === '을/를') return '를';
      if (particle === '은/는') return '는';
      if (particle === '와/과') return '와';
      
      return '';
    };
    
    switch(careType) {
      case 'wash':
        return (
          <div className={styles.careAnimation}>
            <div className={styles.animationBubbles}>
              {[...Array(6)].map((_, i) => (
                <span key={i} className={`${styles.bubble} ${styles[`bubble${i}`]}`}>🫧</span>
              ))}
            </div>
            <div className={styles.bathtub}>🛁</div>
            <div className={`${styles.animalInCare} ${styles.washing}`}>
              {frames % 2 === 0 ? '🐕💦' : '🐕✨'}
            </div>
            <div className={styles.careText}>
              <div className={styles.careTitle}>🧼 씻기기 중...</div>
              <div className={styles.careDesc}>{animalName}{getKoreanParticle(animalName, '이/가')} 목욕을 즐기고 있어요!</div>
            </div>
            <div className={styles.progressDots}>
              {[...Array(4)].map((_, i) => (
                <span key={i} className={i <= frames ? styles.activeDot : styles.dot}>●</span>
              ))}
            </div>
          </div>
        );
        
      case 'feed':
        return (
          <div className={styles.careAnimation}>
            <div className={styles.foodBowl}>🥣</div>
            <div className={styles.foodItems}>
              <span className={styles.food1}>🍖</span>
              <span className={styles.food2}>🥕</span>
              <span className={styles.food3}>🦴</span>
            </div>
            <div className={`${styles.animalInCare} ${styles.eating}`}>
              {frames % 2 === 0 ? '🐕😋' : '🐕🍽️'}
            </div>
            <div className={styles.careText}>
              <div className={styles.careTitle}>🍽️ 밥 주기 중...</div>
              <div className={styles.careDesc}>{animalName}{getKoreanParticle(animalName, '이/가')} 맛있게 먹고 있어요!</div>
            </div>
            <div className={styles.progressDots}>
              {[...Array(4)].map((_, i) => (
                <span key={i} className={i <= frames ? styles.activeDot : styles.dot}>●</span>
              ))}
            </div>
          </div>
        );
        
      case 'groom':
        return (
          <div className={styles.careAnimation}>
            <div className={styles.groomTools}>
              <span className={styles.brush}>🪮</span>
              <span className={styles.scissors}>✂️</span>
              <span className={styles.perfume}>🌸</span>
            </div>
            <div className={`${styles.animalInCare} ${styles.grooming}`}>
              {frames % 2 === 0 ? '🐕✨' : '🐕💅'}
            </div>
            <div className={styles.sparkles}>
              {[...Array(8)].map((_, i) => (
                <span key={i} className={`${styles.sparkle} ${styles[`sparkle${i}`]}`}>✨</span>
              ))}
            </div>
            <div className={styles.careText}>
              <div className={styles.careTitle}>✂️ 미용 중...</div>
              <div className={styles.careDesc}>{animalName}{getKoreanParticle(animalName, '이/가')} 예뻐지고 있어요!</div>
            </div>
            <div className={styles.progressDots}>
              {[...Array(4)].map((_, i) => (
                <span key={i} className={i <= frames ? styles.activeDot : styles.dot}>●</span>
              ))}
            </div>
          </div>
        );
        
      case 'walk':
        return (
          <div className={styles.careAnimation}>
            <div className={styles.walkPath}>
              <div className={styles.pathLine}>🛤️</div>
              <div className={styles.trees}>🌳🌲🌳</div>
            </div>
            <div className={`${styles.animalInCare} ${styles.walking}`}>
              {frames % 2 === 0 ? '🐕🚶‍♂️' : '🐕‍🦺🏃‍♂️'}
            </div>
            <div className={styles.walkEffects}>
              <span className={styles.pawPrint1}>🐾</span>
              <span className={styles.pawPrint2}>🐾</span>
              <span className={styles.pawPrint3}>🐾</span>
            </div>
            <div className={styles.careText}>
              <div className={styles.careTitle}>🚶‍♂️ 산책 중...</div>
              <div className={styles.careDesc}>{animalName}{getKoreanParticle(animalName, '이/가')} 신나게 뛰어다니고 있어요!</div>
            </div>
            <div className={styles.progressDots}>
              {[...Array(4)].map((_, i) => (
                <span key={i} className={i <= frames ? styles.activeDot : styles.dot}>●</span>
              ))}
            </div>
          </div>
        );
        
      default:
        return <div>케어 중...</div>;
    }
  };
  
  return (
    <div className={styles.careAnimationContainer}>
      {getCareAnimation()}
    </div>
  );
};

const AnimalCareGame = () => {
  const navigate = useNavigate();
  
  // 게임 상태
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [careStats, setCareStats] = useState({
    cleanliness: 30,  // 청결도 (씻기기)
    hunger: 20,       // 배고픔 (밥주기) 
    beauty: 25,       // 미용도 (미용)
    energy: 40        // 활력도 (산책)
  });
  const [timeLeft, setTimeLeft] = useState(24); // 남은 시간
  const [message, setMessage] = useState('');
  const [completedTasks, setCompletedTasks] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loadingAnimals, setLoadingAnimals] = useState(true);
  const [showCareAnimation, setShowCareAnimation] = useState(false);
  const [currentCareType, setCurrentCareType] = useState('');
  const [animalMood, setAnimalMood] = useState('normal'); // dirty, normal, happy, clean, beautiful
  
  // AI 생성 이미지 관련 상태
  const [generatedImages, setGeneratedImages] = useState({}); // careType별 생성된 이미지들
  const [currentDisplayImage, setCurrentDisplayImage] = useState(''); // 현재 표시 중인 이미지
  const [isGeneratingImage, setIsGeneratingImage] = useState(false); // 이미지 생성 중 상태
  
  // 돌본 동물들과 기록 관련 상태
  const [careHistory, setCareHistory] = useState([]);
  const [showCareHistory, setShowCareHistory] = useState(false);
  const [todayRecord, setTodayRecord] = useState('');
  
  // 동물 필터 관련 상태
  const [animalFilter, setAnimalFilter] = useState('all'); // 'all', 'dog', 'cat', 'other'
  const [allAnimals, setAllAnimals] = useState([]); // 전체 동물 목록
  
  // 이름 지어주기 관련 상태
  const [showNamingModal, setShowNamingModal] = useState(false);
  const [customName, setCustomName] = useState('');
  
  // 미니 게임 관련 상태
  const [showMiniGame, setShowMiniGame] = useState(false);
  const [currentMiniGame, setCurrentMiniGame] = useState(null); // 'ball', 'fishing', 'puzzle'
  const [miniGameScore, setMiniGameScore] = useState(0);

  // 실제 유기동물 데이터 가져오기 - 초기에는 전체 필터로 시작
  useEffect(() => {
    const initializeAnimals = async () => {
      try {
        console.log('🔥 AnimalCareGame: 유기동물 데이터 초기화 시작');
        // 초기에는 전체 동물 데이터로 시작
        await filterAnimals('all');
        
        console.log('📊 AnimalCareGame: 초기화 완료');
        setLoadingAnimals(false);
      } catch (error) {
        console.error('❌ AnimalCareGame: 초기화 실패:', error);
        // 실패 시 샘플 데이터 사용
        const fallbackAnimals = [
          {
            id: 1,
            name: "개 친구 #1",
            species: "개",
            image_url: "/images/hoochoo1.jpeg",
            description: "활발한 강아지"
          },
          {
            id: 2, 
            name: "고양이 친구 #2",
            species: "고양이",
            image_url: "/images/pretty.png",
            description: "온순한 고양이"
          },
          {
            id: 3,
            name: "개 친구 #3",
            species: "개", 
            image_url: "/images/Bob.png",
            description: "귀여운 강아지"
          }
        ];
        setAnimals(fallbackAnimals);
        setAllAnimals(fallbackAnimals);
        setLoadingAnimals(false);
      }
    };

    initializeAnimals();
  }, []);

  // 케어 활동 효과 (더 구체적이고 정확한 변화)
  const careEffects = {
    wash: { 
      cleanliness: 35, 
      energy: -3, 
      time: 3,
      message: "따뜻한 물로 깨끗하게 목욕했어요! 털이 보송보송해졌어요! 🛁",
      detailedChange: "털에 묻은 흙과 냄새가 사라지고, 피부가 건강해졌어요",
      visualChange: "fur becomes fluffy and clean, dirt removed, skin healthy and pink",
      icon: "🧼"
    },
    feed: { 
      hunger: 40, 
      energy: 15, 
      time: 2,
      message: "영양가 있는 사료를 맛있게 먹었어요! 배가 든든해요! 🍖",
      detailedChange: "건강한 체중이 늘고, 털에 윤기가 나기 시작해요",
      visualChange: "eating happily with full belly, brighter eyes, healthier coat shine",
      icon: "🍽️"
    },
    groom: { 
      beauty: 30, 
      cleanliness: 15, 
      time: 4,
      message: "전문적인 그루밍을 받았어요! 털이 단정하고 발톱도 깔끔해요! ✂️",
      detailedChange: "털이 예쁘게 다듬어지고, 발톱이 적당히 잘려서 걷기 편해요",
      visualChange: "neatly trimmed fur, clean and shaped nails, professional groomed appearance",
      icon: "✨"
    },
    walk: { 
      energy: 30, 
      hunger: -10, 
      time: 5,
      message: "신나게 산책하고 왔어요! 근육이 탄탄해지고 스트레스가 풀렸어요! 🚶‍♂️",
      detailedChange: "다리 근육이 발달하고, 정신적으로 안정되며 사회성이 좋아져요",
      visualChange: "stronger leg muscles, alert and happy expression, confident posture",
      icon: "🐕‍🦺"
    }
  };

  // AI 이미지 생성 함수
  const generateCareImage = async (careType, currentStats, mood) => {
    try {
      console.log(`🎨 ${careType} AI 이미지 생성 시작...`);
      setIsGeneratingImage(true);
      
      // 케어 활동 한국어 매핑
      const careTypeMapping = {
        'wash': '씻기기',
        'feed': '밥주기', 
        'groom': '미용하기',
        'walk': '산책하기'
      };
      
      const koreanCareType = careTypeMapping[careType];
      
      const requestData = {
        animalData: selectedAnimal,
        careActivity: koreanCareType,
        careStats: currentStats,
        animalMood: mood,
        completedTasks: completedTasks
      };

      console.log('📤 AI 이미지 생성 요청 데이터:', requestData);

      const response = await api.post('/ai/generate-care-image', requestData);
      
      if (response.data.success && response.data.image_path) {
        console.log('✅ AI 이미지 생성 성공:', response.data.image_path);
        
        // 생성된 이미지를 케어 타입별로 저장
        setGeneratedImages(prev => ({
          ...prev,
          [careType]: {
            url: response.data.image_path,
            timestamp: new Date().toISOString(),
            activity: koreanCareType,
            mood: mood,
            stats: currentStats
          }
        }));
        
        // 현재 표시할 이미지를 새로 생성된 이미지로 설정
        setCurrentDisplayImage(response.data.image_path);
        
        return response.data.image_path;
      } else {
        console.warn('⚠️ AI 이미지 생성 실패, mock 모드:', response.data);
        return null;
      }
      
    } catch (error) {
      console.error('❌ AI 이미지 생성 에러:', error);
      return null;
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // 케어 활동 실행 (애니메이션 + AI 이미지 생성)
  const performCare = async (careType) => {
    if (gameEnded || timeLeft <= 0 || showCareAnimation) return;
    
    const effect = careEffects[careType];
    if (timeLeft < effect.time) {
      setMessage("⏰ 시간이 부족해요!");
      return;
    }

    // 케어 애니메이션 시작
    setCurrentCareType(careType);
    setShowCareAnimation(true);
    setMessage(`${effect.icon} ${careType === 'wash' ? '씻기는' : careType === 'feed' ? '밥을 주는' : careType === 'groom' ? '미용하는' : '산책하는'} 중...`);
    
    // 새로운 스탯 미리 계산 (AI 생성용)
    const newStats = { ...careStats };
    Object.keys(effect).forEach(key => {
      if (key !== 'time' && key !== 'message' && key !== 'icon' && key !== 'detailedChange' && key !== 'visualChange') {
        newStats[key] = Math.max(0, Math.min(100, careStats[key] + effect[key]));
      }
    });
    
    // 새로운 기분 계산
    const newMood = calculateAnimalMood(newStats);
    
    // AI 이미지 생성 (병렬로 실행)
    const aiImagePromise = generateCareImage(careType, newStats, newMood);
    
    // 애니메이션 시간 (3초)
    setTimeout(async () => {
      // 스탯 업데이트
      setCareStats(newStats);

      // 시간 감소
      setTimeLeft(prev => prev - effect.time);
      
      // 완료한 작업 추가
      setCompletedTasks(prev => [...prev, careType]);
      
      // AI 이미지 결과 확인
      const generatedImageUrl = await aiImagePromise;
      if (generatedImageUrl) {
        // 임시로 생성된 이미지를 표시 (실제로는 animalImage를 교체하지 않음 - 원본 보존)
        console.log(`🖼️ ${careType} 케어 결과 이미지:`, generatedImageUrl);
        setMessage(`${effect.message} 🎨 AI가 ${selectedAnimal.name}의 변화된 모습을 그려줬어요!`);
      } else {
        setMessage(effect.message);
      }
      
      // 애니메이션 종료
      setShowCareAnimation(false);
      setCurrentCareType('');
      
      // 메시지 5초 후 사라짐 (AI 이미지 확인 시간)
      setTimeout(() => setMessage(''), 5000);
    }, 3000);
  };

  // 게임 종료 체크
  useEffect(() => {
    if (timeLeft <= 0 && gameStarted) {
      setGameEnded(true);
      
      const totalScore = Object.values(careStats).reduce((sum, stat) => sum + stat, 0) / 4;
      let resultMessage = "";
      let grade = "";
      
      if (totalScore >= 80) {
        resultMessage = `🏆 완벽한 하루였어요! ${getAnimalNameWithParticle(selectedAnimal, '이/가')} 정말 행복해해요!`;
        grade = "S";
      } else if (totalScore >= 60) {
        resultMessage = `😊 좋은 하루였어요! ${getAnimalNameWithParticle(selectedAnimal, '이/가')} 만족해해요!`;
        grade = "A";
      } else {
        resultMessage = `😔 ${getAnimalNameWithParticle(selectedAnimal, '이/가')} 더 많은 관심이 필요해요...`;
        grade = "B";
      }
      
      setMessage(resultMessage);
      
      // 케어 기록에 추가
      const newRecord = {
        id: Date.now(),
        animal: selectedAnimal,
        date: new Date().toLocaleDateString('ko-KR'),
        time: new Date().toLocaleTimeString('ko-KR'),
        finalStats: careStats,
        completedTasks: [...completedTasks],
        totalScore: Math.round(totalScore),
        grade: grade,
        mood: animalMood,
        note: todayRecord
      };
      
      setCareHistory(prev => [newRecord, ...prev]);
    }
  }, [timeLeft, gameStarted, careStats, selectedAnimal, completedTasks, animalMood, todayRecord]);

  // 동물 상태에 따른 무드 업데이트
  useEffect(() => {
    if (gameStarted) {
      const avgStats = (careStats.cleanliness + careStats.hunger + careStats.beauty + careStats.energy) / 4;
      
      if (avgStats < 30) {
        setAnimalMood('dirty');
      } else if (avgStats < 50) {
        setAnimalMood('normal');
      } else if (avgStats < 70) {
        setAnimalMood('happy');
      } else if (avgStats < 85) {
        setAnimalMood('clean');
      } else {
        setAnimalMood('beautiful');
      }
    }
  }, [careStats, gameStarted]);

  // 게임 시작
  const startGame = (animal) => {
    setSelectedAnimal(animal);
    setGameStarted(true);
    setGameEnded(false);
    setTimeLeft(24);
    setCareStats({
      cleanliness: 30,
      hunger: 20,
      beauty: 25,
      energy: 40
    });
    setCompletedTasks([]);
    // 무드는 자동으로 계산되도록 초기값 제거
    setMessage(`${getAnimalNameWithParticle(animal, '이/가')} 당신을 기다리고 있어요! 🐾`);
  };

  // 게임 리셋
  const resetGame = () => {
    setSelectedAnimal(null);
    setGameStarted(false);
    setGameEnded(false);
    setMessage('');
    setGeneratedImages({});
    setCurrentDisplayImage('');
    setIsGeneratingImage(false);
    setTodayRecord('');
    setAnimalMood('normal');
  };

  // 동물 기분 계산 함수
  const calculateAnimalMood = (stats) => {
    const totalScore = (stats.cleanliness + stats.hunger + stats.beauty + stats.energy) / 4;
    
    if (totalScore >= 80) return 'beautiful';
    if (totalScore >= 60) return 'clean';
    if (totalScore >= 40) return 'happy';
    if (totalScore >= 20) return 'normal';
    return 'dirty';
  };

  // 동물 필터링 함수 - 유기동물 페이지와 동일한 API 사용
  const filterAnimals = async (filterType) => {
    try {
      console.log(`🔍 ${filterType} 필터로 동물 데이터 요청...`);
      const response = await api.get(`/animals?filter=${filterType}&page=1`);
      console.log(`✅ ${filterType} 필터 응답:`, response.data.animals.length, '마리');
      
      // API에서 받은 데이터를 게임용으로 변환
      const apiAnimals = response.data.animals.map((animal) => ({
        id: animal.animal_id,
        name: `${animal.species} 친구 #${animal.animal_id}`,
        species: animal.species,
        image_url: animal.image_url,
        description: `${animal.region}에서 구조된 ${animal.gender === 'male' ? '수컷' : animal.gender === 'female' ? '암컷' : ''} ${animal.species}`,
        age: animal.age,
        region: animal.region,
        gender: animal.gender
      }));
      
      // 랜덤으로 섞어서 6마리 선택
      const shuffledAnimals = [...apiAnimals].sort(() => Math.random() - 0.5);
      const selectedAnimals = shuffledAnimals.slice(0, 6);
      
      console.log(`🎲 랜덤 선택 완료: ${selectedAnimals.length}마리`);
      
      setAnimals(selectedAnimals);
      setAnimalFilter(filterType);
      
    } catch (error) {
      console.error(`❌ ${filterType} 필터 요청 실패:`, error);
      // 에러 시 기존 전체 데이터에서 랜덤 선택
      if (allAnimals.length > 0) {
        const shuffled = [...allAnimals].sort(() => Math.random() - 0.5);
        const fallback = shuffled.slice(0, 6);
        setAnimals(fallback);
        setAnimalFilter(filterType);
      }
    }
  };

  // 이름 지어주기 함수
  const openNamingModal = () => {
    setCustomName('');
    setShowNamingModal(true);
  };

  const closeNamingModal = () => {
    setShowNamingModal(false);
    setCustomName('');
  };

  const applyCustomName = () => {
    if (customName.trim() && selectedAnimal) {
      const newName = customName.trim();
      setSelectedAnimal(prevAnimal => ({
        ...prevAnimal,
        customName: newName,
        displayName: newName
      }));
      setMessage(`🎉 "${newName}"라는 멋진 이름을 지어주었어요!`);
      setTimeout(() => setMessage(''), 3000);
      closeNamingModal();
    }
  };

  // 한국어 조사 처리 함수
  const getKoreanParticle = (name, particle) => {
    if (!name) return '';
    
    const lastChar = name.charAt(name.length - 1);
    const lastCharCode = lastChar.charCodeAt(0);
    
    // 한글인지 확인
    if (lastCharCode >= 0xAC00 && lastCharCode <= 0xD7A3) {
      const finalConsonant = (lastCharCode - 0xAC00) % 28;
      
      if (particle === '이/가') {
        return finalConsonant > 0 ? '이' : '가';
      } else if (particle === '을/를') {
        return finalConsonant > 0 ? '을' : '를';
      } else if (particle === '은/는') {
        return finalConsonant > 0 ? '은' : '는';
      } else if (particle === '와/과') {
        return finalConsonant > 0 ? '과' : '와';
      }
    }
    
    // 한글이 아닌 경우 기본값
    if (particle === '이/가') return '가';
    if (particle === '을/를') return '를';
    if (particle === '은/는') return '는';
    if (particle === '와/과') return '와';
    
    return '';
  };

  // 동물 이름을 조사와 함께 표시하는 함수
  const getAnimalNameWithParticle = (animal, particle = '이/가') => {
    const displayName = animal.displayName || animal.customName || animal.name;
    const koreanParticle = getKoreanParticle(displayName, particle);
    return `${displayName}${koreanParticle}`;
  };

  // 랜덤 이름 생성 함수
  const generateRandomName = () => {
    const dogNames = ['초코', '몽이', '별이', '구름이', '하늘이', '바둑이', '복돌이', '맥스', '루이', '코코'];
    const catNames = ['나비', '공주', '미미', '야옹이', '봄이', '달이', '별이', '루나', '체리', '쿠키'];
    const otherNames = ['포동이', '털뭉치', '귀염이', '사랑이', '행복이', '희망이', '천사', '보석이', '햇님이', '달님이'];
    
    let namePool = otherNames;
    if (selectedAnimal?.species?.includes('개')) {
      namePool = dogNames;
    } else if (selectedAnimal?.species?.includes('고양이')) {
      namePool = catNames;
    }
    
    const randomName = namePool[Math.floor(Math.random() * namePool.length)];
    setCustomName(randomName);
  };

  // 미니 게임 시작 함수
  const startMiniGame = () => {
    if (!selectedAnimal) return;
    
    // 동물 종류에 따라 다른 미니 게임 선택
    let gameType = 'puzzle'; // 기본값
    if (selectedAnimal.species?.includes('개')) {
      gameType = 'ball';
    } else if (selectedAnimal.species?.includes('고양이')) {
      gameType = 'fishing';
    }
    
    setCurrentMiniGame(gameType);
    setMiniGameScore(0);
    setShowMiniGame(true);
    
    setMessage(`🎮 ${getAnimalNameWithParticle(selectedAnimal, '와/과')} 함께 미니 게임을 시작해요!`);
    setTimeout(() => setMessage(''), 3000);
  };

  const closeMiniGame = () => {
    setShowMiniGame(false);
    setCurrentMiniGame(null);
    setMiniGameScore(0);
  };

  const completeMiniGame = (score) => {
    // 미니 게임 완료 시 케어 스탯 보너스
    const bonus = Math.min(20, score * 2);
    setCareStats(prevStats => ({
      ...prevStats,
      energy: Math.min(100, prevStats.energy + bonus),
      beauty: Math.min(100, prevStats.beauty + Math.floor(bonus / 2))
    }));
    
    setMessage(`🏆 미니 게임 완료! ${score}점을 획득했어요! 에너지 +${bonus}`);
    setTimeout(() => setMessage(''), 4000);
    closeMiniGame();
  };

  // 수동으로 기록 저장하는 함수
  const saveCurrentRecord = () => {
    if (!selectedAnimal || !todayRecord.trim()) {
      setMessage('💭 기록할 내용을 입력해주세요!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const totalScore = Object.values(careStats).reduce((sum, stat) => sum + stat, 0) / 4;
    let grade = "";
    
    if (totalScore >= 80) {
      grade = "S";
    } else if (totalScore >= 60) {
      grade = "A";
    } else {
      grade = "B";
    }

    const newRecord = {
      id: Date.now(),
      animal: selectedAnimal,
      date: new Date().toLocaleDateString('ko-KR'),
      time: new Date().toLocaleTimeString('ko-KR'),
      finalStats: careStats,
      completedTasks: [...completedTasks],
      totalScore: Math.round(totalScore),
      grade: grade,
      mood: animalMood,
      note: todayRecord,
      isManualSave: true // 수동 저장 표시
    };

    const updatedHistory = [newRecord, ...careHistory];
    setCareHistory(updatedHistory);
    localStorage.setItem('careHistory', JSON.stringify(updatedHistory));
    
    setMessage(`📝 ${selectedAnimal.name}와의 기록이 저장되었어요!`);
    setTimeout(() => setMessage(''), 3000);
    
    // 기록 저장 후 텍스트 초기화 (선택사항)
    // setTodayRecord('');
  };

  // 스탯 바 컴포넌트
  const StatBar = ({ label, value, icon, color }) => (
    <div className={styles.statBar}>
      <div className={styles.statLabel}>
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div className={styles.statBarBg}>
        <div 
          className={styles.statBarFill}
          style={{ 
            width: `${value}%`, 
            backgroundColor: color,
            transition: 'width 0.5s ease'
          }}
        />
      </div>
      <span className={styles.statValue}>{value}%</span>
    </div>
  );

  if (!gameStarted) {
    return (
      <div className={styles.gameContainer}>
        <div className={styles.gameHeader}>
          <button 
            className={styles.backButton}
            onClick={() => navigate(-1)}
          >
            ← 뒤로가기
          </button>
          <div className={styles.gameTitle}>
            케어 시뮬레이션
          </div>
          <button 
            className={styles.historyButton}
            onClick={() => setShowCareHistory(!showCareHistory)}
          >
            📝 케어 기록 {careHistory.length > 0 && `(${careHistory.length})`}
          </button>
        </div>
        
        {/* 케어 기록 표시 */}
        {showCareHistory && (
          <div className={styles.careHistorySection}>
            <h3>🏆 내가 돌본 동물들</h3>
            {careHistory.length === 0 ? (
              <p className={styles.noCareHistory}>
                아직 돌본 동물이 없어요. 첫 번째 동물을 돌봐주세요! 🐾
              </p>
            ) : (
              <div className={styles.careHistoryGrid}>
                {careHistory.slice(0, 6).map(record => (
                  <div key={record.id} className={styles.careHistoryCard}>
                    <img 
                      src={record.animal.image_url} 
                      alt={record.animal.name}
                      className={styles.historyAnimalImage}
                      onError={(e) => { e.target.src = '/images/unknown_animal.png'; }}
                    />
                    <div className={styles.historyInfo}>
                      <div className={styles.historyHeader}>
                        <span className={styles.historyName}>
                          {record.animal.name}
                          {record.isManualSave && (
                            <span className={styles.manualSaveBadge}>📝</span>
                          )}
                        </span>
                        <span className={`${styles.historyGrade} ${styles[`grade${record.grade}`]}`}>
                          {record.grade}
                        </span>
                      </div>
                      <div className={styles.historyDetails}>
                        <span className={styles.historyDate}>{record.date}</span>
                        <span className={styles.historyScore}>{record.totalScore}점</span>
                      </div>
                      <div className={styles.historyMood}>
                        {record.mood === 'beautiful' && <span>🥰 완벽해요!</span>}
                        {record.mood === 'clean' && <span>😄 깨끗해요!</span>}
                        {record.mood === 'happy' && <span>😊 좋아요!</span>}
                        {record.mood === 'normal' && <span>😐 보통이에요</span>}
                        {record.mood === 'dirty' && <span>😔 더러워요...</span>}
                      </div>
                      {record.note && (
                        <div className={styles.historyNote}>
                          💭 "{record.note}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        <div className={styles.animalSelection}>
          <h3>돌볼 동물을 선택해주세요:</h3>
          
          {/* 동물 필터 버튼들 */}
          <div className={styles.animalFilterContainer}>
            <button 
              className={`${styles.filterButton} ${animalFilter === 'all' ? styles.active : ''}`}
              onClick={() => filterAnimals('all')}
            >
              🐾 전체
            </button>
            <button 
              className={`${styles.filterButton} ${animalFilter === 'dog' ? styles.active : ''}`}
              onClick={() => filterAnimals('dog')}
            >
              🐕 개
            </button>
            <button 
              className={`${styles.filterButton} ${animalFilter === 'cat' ? styles.active : ''}`}
              onClick={() => filterAnimals('cat')}
            >
              🐱 고양이
            </button>
            <button 
              className={`${styles.filterButton} ${animalFilter === 'other' ? styles.active : ''}`}
              onClick={() => filterAnimals('other')}
            >
              🦜 기타
            </button>
          </div>
          
          {loadingAnimals ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p>보호소에서 동물 친구들을 데려오고 있어요... 🐕🐱</p>
            </div>
          ) : (
            <>
              <p className={styles.animalCount}>
                🏠 현재 {animals.length}마리의 동물이 여러분의 사랑을 기다리고 있어요!
              </p>
              <div className={styles.animalGrid}>
                {animals.map(animal => (
                  <div 
                    key={animal.id} 
                    className={styles.animalCard}
                    onClick={() => startGame(animal)}
                  >
                    <img 
                      src={animal.image_url} 
                      alt={animal.name}
                      className={styles.animalImage}
                      onError={(e) => { 
                        e.target.src = '/images/unknown_animal.png'; 
                      }}
                    />
                    <div className={styles.animalInfo}>
                      <h4>{animal.name}</h4>
                      <div className={styles.animalDetails}>
                        {animal.age && <span className={styles.animalAge}>🎂 {animal.age}</span>}
                        {animal.gender && (
                          <span className={styles.animalGender}>
                            {animal.gender === 'male' ? '♂️ 수컷' : animal.gender === 'female' ? '♀️ 암컷' : '❓'}
                          </span>
                        )}
                      </div>
                      <p className={styles.animalDescription}>{animal.description}</p>
                    </div>
                    <button className={styles.selectButton}>
                      💝 이 친구와 함께하기
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gameContainer}>
      <div className={styles.gameHeader}>
        <h2>🐾 {getAnimalNameWithParticle(selectedAnimal, '이/가')}의 하루</h2>
        <div className={styles.timeInfo}>
          <button className={styles.namingButton} onClick={openNamingModal}>
            ✏️ 이름 짓기
          </button>
          <button className={styles.resetButton} onClick={resetGame}>
            다른 동물 선택
          </button>
        </div>
      </div>

      {message && (
        <div className={styles.messageBox}>
          {message}
        </div>
      )}

      <div className={styles.gameBoard}>
        <div className={styles.animalDisplay}>
          {showCareAnimation ? (
            <CareAnimationDisplay 
              careType={currentCareType} 
              animalName={selectedAnimal.name}
            />
          ) : (
            <>
              <div className={`${styles.animalContainer} ${styles[animalMood]}`}>
                <div className={styles.imageContainer}>
                  {/* AI 이미지 생성 중일 때 로딩 표시 */}
                  {isGeneratingImage && (
                    <div className={styles.imageLoadingOverlay}>
                      <div className={styles.imageLoader}>🎨 AI가 그리고 있어요...</div>
                    </div>
                  )}
                  
                  {/* 현재 표시할 이미지 결정 */}
                  <img 
                    src={currentDisplayImage || selectedAnimal.image_url} 
                    alt={`${selectedAnimal.name}${currentDisplayImage ? ' (케어 후)' : ''}`}
                    className={`${styles.mainAnimalImage} ${styles[animalMood + 'Image']} ${currentDisplayImage ? styles.aiGeneratedImage : ''}`}
                    onError={(e) => { 
                      e.target.src = selectedAnimal.image_url || '/images/unknown_animal.png'; 
                      setCurrentDisplayImage(''); // AI 이미지 로드 실패시 원본으로 복구
                    }}
                  />
                  
                  {/* AI 생성 이미지 표시 중일 때 라벨 */}
                  {currentDisplayImage && (
                    <div className={styles.aiImageLabel}>
                      🤖 AI가 그린 {selectedAnimal.name}
                    </div>
                  )}
                </div>
                <div className={styles.moodEffects}>
                  {animalMood === 'dirty' && <span className={styles.dirtEffect}>💦</span>}
                  {animalMood === 'happy' && <span className={styles.happyEffect}>😊</span>}
                  {animalMood === 'clean' && <span className={styles.cleanEffect}>✨</span>}
                  {animalMood === 'beautiful' && <span className={styles.beautifulEffect}>✨💖</span>}
                </div>
              </div>
              <div className={styles.animalInfo}>
                <h3>{selectedAnimal.name}</h3>
                <p>{selectedAnimal.species}</p>
                <div className={styles.moodIndicator}>
                  {animalMood === 'dirty' && <span>😔 더러워요...</span>}
                  {animalMood === 'normal' && <span>😐 보통이에요</span>}
                  {animalMood === 'happy' && <span>😊 좋아요!</span>}
                  {animalMood === 'clean' && <span>😄 깨끗해요!</span>}
                  {animalMood === 'beautiful' && <span>🥰 완벽해요!</span>}
                </div>
                
                {/* AI 이미지 컨트롤 버튼들 */}
                {Object.keys(generatedImages).length > 0 && (
                  <div className={styles.imageControls}>
                    <button 
                      className={`${styles.imageToggleBtn} ${!currentDisplayImage ? styles.active : ''}`}
                      onClick={() => setCurrentDisplayImage('')}
                    >
                      📷 원본
                    </button>
                    {Object.entries(generatedImages).map(([careType, imageData]) => (
                      <button 
                        key={careType}
                        className={`${styles.imageToggleBtn} ${currentDisplayImage === imageData.url ? styles.active : ''}`}
                        onClick={() => setCurrentDisplayImage(imageData.url)}
                        title={`${imageData.activity} 후 모습`}
                      >
                        {careType === 'wash' ? '🛁' : 
                         careType === 'feed' ? '🍽️' : 
                         careType === 'groom' ? '✨' : '🚶‍♂️'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className={styles.statsPanel}>
          <h3>📊 상태</h3>
          <StatBar 
            label="청결도" 
            value={careStats.cleanliness} 
            icon="🧼" 
            color="#4FC3F7"
          />
          <StatBar 
            label="포만감" 
            value={careStats.hunger} 
            icon="🍖" 
            color="#66BB6A"
          />
          <StatBar 
            label="미용도" 
            value={careStats.beauty} 
            icon="✨" 
            color="#AB47BC"
          />
          <StatBar 
            label="활력도" 
            value={careStats.energy} 
            icon="⚡" 
            color="#FF7043"
          />
        </div>

        <div className={styles.todayRecordSection}>
          <h3>📝 오늘의 기록</h3>
          <textarea
            value={todayRecord}
            onChange={(e) => setTodayRecord(e.target.value)}
            placeholder={`${getAnimalNameWithParticle(selectedAnimal, '이/가')}와의 특별한 순간을 기록해보세요... 예: "처음에는 무서워했지만 점점 마음을 열었어요"`}
            className={styles.recordTextarea}
            maxLength={100}
          />
          <div className={styles.recordActions}>
            <div className={styles.recordCounter}>
              {todayRecord.length}/100자
            </div>
            <button 
              className={styles.saveRecordButton}
              onClick={saveCurrentRecord}
              disabled={!todayRecord.trim()}
            >
              💾 기록 저장하기
            </button>
          </div>
        </div>

        <div className={styles.careButtons}>
          <h3>🎮 케어 활동</h3>
          <div className={styles.buttonGrid}>
            <button 
              className={styles.careButton}
              onClick={() => performCare('wash')}
              disabled={gameEnded || timeLeft < careEffects.wash.time}
            >
              <span className={styles.buttonIcon}>🧼</span>
              <span className={styles.buttonText}>씻기기</span>
              <span className={styles.buttonTime}>({careEffects.wash.time}시간)</span>
            </button>
            
            <button 
              className={styles.careButton}
              onClick={() => performCare('feed')}
              disabled={gameEnded || timeLeft < careEffects.feed.time}
            >
              <span className={styles.buttonIcon}>🍽️</span>
              <span className={styles.buttonText}>밥주기</span>
              <span className={styles.buttonTime}>({careEffects.feed.time}시간)</span>
            </button>
            
            <button 
              className={styles.careButton}
              onClick={() => performCare('groom')}
              disabled={gameEnded || timeLeft < careEffects.groom.time}
            >
              <span className={styles.buttonIcon}>✂️</span>
              <span className={styles.buttonText}>미용하기</span>
              <span className={styles.buttonTime}>({careEffects.groom.time}시간)</span>
            </button>
            
            <button 
              className={styles.careButton}
              onClick={() => performCare('walk')}
              disabled={gameEnded || timeLeft < careEffects.walk.time}
            >
              <span className={styles.buttonIcon}>🚶‍♂️</span>
              <span className={styles.buttonText}>산책하기</span>
              <span className={styles.buttonTime}>({careEffects.walk.time}시간)</span>
            </button>
          </div>
        </div>

        {/* 미니 게임 섹션 */}
        <div className={styles.careButtons}>
          <h3>🎮 미니 게임</h3>
          <div className={styles.buttonGrid}>
            <button 
              className={styles.miniGameButton}
              onClick={startMiniGame}
              disabled={gameEnded}
            >
              <span className={styles.buttonIcon}>
                {selectedAnimal.species?.includes('개') ? '🎾' : 
                 selectedAnimal.species?.includes('고양이') ? '🎣' : '🧩'}
              </span>
              <span className={styles.buttonText}>
                {selectedAnimal.species?.includes('개') ? '공 던지기' : 
                 selectedAnimal.species?.includes('고양이') ? '낚시 게임' : '퍼즐 게임'}
              </span>
              <span className={styles.buttonTime}>에너지 회복!</span>
            </button>
          </div>
        </div>
      </div>

      {gameEnded && (
        <div className={styles.gameEndModal}>
          <div className={styles.gameEndContent}>
            <h2>🎉 하루가 끝났어요!</h2>
            <div className={styles.finalStats}>
              <h3>최종 상태:</h3>
              <StatBar label="청결도" value={careStats.cleanliness} icon="🧼" color="#4FC3F7" />
              <StatBar label="포만감" value={careStats.hunger} icon="🍖" color="#66BB6A" />
              <StatBar label="미용도" value={careStats.beauty} icon="✨" color="#AB47BC" />
              <StatBar label="활력도" value={careStats.energy} icon="⚡" color="#FF7043" />
            </div>
            
            
            <div className={styles.gameEndButtons}>
              <button className={styles.playAgainButton} onClick={resetGame}>
                🎮 다시 하기
              </button>
              <button 
                className={styles.goHomeButton} 
                onClick={() => navigate('/intro')}
              >
                🏠 홈으로 가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이름 짓기 모달 */}
      {showNamingModal && (
        <div className={styles.gameEndModal}>
          <div className={styles.gameEndContent}>
            <h2>✏️ 이름을 지어주세요!</h2>
            <p style={{ textAlign: 'center', marginBottom: '20px', color: '#64748b' }}>
              이 귀여운 {selectedAnimal.species}에게 특별한 이름을 지어주세요 💝
            </p>
            
            <div className={styles.namingInputContainer}>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="이름을 입력해주세요"
                className={styles.namingInput}
                maxLength={10}
                onKeyPress={(e) => e.key === 'Enter' && applyCustomName()}
              />
              <button 
                className={styles.randomNameButton}
                onClick={generateRandomName}
                type="button"
              >
                🎲 랜덤
              </button>
            </div>
            
            <div className={styles.gameEndButtons}>
              <button 
                className={styles.playAgainButton}
                onClick={applyCustomName}
                disabled={!customName.trim()}
              >
                ✨ 이름 확정
              </button>
              <button 
                className={styles.goHomeButton}
                onClick={closeNamingModal}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 미니 게임 모달 */}
      {showMiniGame && (
        <div className={styles.gameEndModal}>
          <div className={styles.miniGameModalContent}>
            {currentMiniGame === 'ball' && (
              <BallGameComponent 
                onComplete={completeMiniGame}
                onClose={closeMiniGame}
                score={miniGameScore}
                setScore={setMiniGameScore}
              />
            )}
            {currentMiniGame === 'fishing' && (
              <FishingGameComponent 
                onComplete={completeMiniGame}
                onClose={closeMiniGame}
                score={miniGameScore}
                setScore={setMiniGameScore}
              />
            )}
            {currentMiniGame === 'puzzle' && (
              <PuzzleGameComponent 
                onComplete={completeMiniGame}
                onClose={closeMiniGame}
                score={miniGameScore}
                setScore={setMiniGameScore}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimalCareGame;