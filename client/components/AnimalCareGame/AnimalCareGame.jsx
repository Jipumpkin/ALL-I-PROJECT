import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../axios';
import styles from './AnimalCareGame.module.css';

// 케어 애니메이션 디스플레이 컴포넌트 (포우 게임 스타일)
const CareAnimationDisplay = ({ careType, animalName, animalSpecies }) => {
  const [animationFrame, setAnimationFrame] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationFrame(prev => (prev + 1) % 4);
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  const getCareAnimation = () => {
    const baseAnimal = `🐕`; // 기본 동물 이모지
    const frames = animationFrame;
    
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
              <div className={styles.careDesc}>{animalName}이(가) 목욕을 즐기고 있어요!</div>
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
              <div className={styles.careDesc}>{animalName}이(가) 맛있게 먹고 있어요!</div>
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
              <div className={styles.careDesc}>{animalName}이(가) 예뻐지고 있어요!</div>
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
              <div className={styles.careDesc}>{animalName}이(가) 신나게 뛰어다니고 있어요!</div>
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
  
  // 이미지 생성 관련 상태
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [showImageGeneration, setShowImageGeneration] = useState(false);
  
  // 돌본 동물들과 기록 관련 상태
  const [careHistory, setCareHistory] = useState([]);
  const [showCareHistory, setShowCareHistory] = useState(false);
  const [todayRecord, setTodayRecord] = useState('');

  // 실제 유기동물 데이터 가져오기
  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        console.log('🔥 AnimalCareGame: 유기동물 데이터 요청 시작');
        const response = await api.get('/animals?filter=all&page=1');
        console.log('✅ AnimalCareGame: 유기동물 데이터 응답 성공:', response.data);
        
        // 전체 동물 배열을 랜덤으로 섞고 6마리 선택
        const shuffledAnimals = [...response.data.animals].sort(() => Math.random() - 0.5);
        const gameAnimals = shuffledAnimals.slice(0, 6).map((animal, index) => ({
          id: animal.animal_id,
          name: `${animal.species} 친구 #${animal.animal_id}`,
          species: animal.species,
          image_url: animal.image_url,
          description: `${animal.region}에서 구조된 ${animal.gender === 'male' ? '수컷' : animal.gender === 'female' ? '암컷' : ''} ${animal.species}`,
          age: animal.age,
          region: animal.region,
          gender: animal.gender
        }));
        
        setAnimals(gameAnimals);
        console.log('📊 AnimalCareGame: 게임용 동물 데이터 준비 완료:', gameAnimals.length, '마리');
      } catch (error) {
        console.error('❌ AnimalCareGame: 유기동물 데이터 로드 실패:', error);
        // 실패 시 샘플 데이터 사용
        const fallbackAnimals = [
          {
            id: 1,
            name: "초코",
            species: "개",
            image_url: "/images/hoochoo1.jpeg",
            description: "활발한 강아지"
          },
          {
            id: 2, 
            name: "나비",
            species: "고양이",
            image_url: "/images/pretty.png",
            description: "온순한 고양이"
          },
          {
            id: 3,
            name: "뽀미",
            species: "개", 
            image_url: "/images/Bob.png",
            description: "귀여운 강아지"
          }
        ];
        setAnimals(fallbackAnimals);
      } finally {
        setLoadingAnimals(false);
      }
    };

    fetchAnimals();
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

  // 케어 활동 실행 (애니메이션 포함)
  const performCare = (careType) => {
    if (gameEnded || timeLeft <= 0 || showCareAnimation) return;
    
    const effect = careEffects[careType];
    if (timeLeft < effect.time) {
      setMessage("⏰ 시간이 부족해요!");
      return;
    }

    // 케어 애니메이션 시작
    setCurrentCareType(careType);
    setShowCareAnimation(true);
    
    // 애니메이션 시간 (3초)
    setTimeout(() => {
      // 스탯 업데이트
      setCareStats(prev => {
        const newStats = { ...prev };
        Object.keys(effect).forEach(key => {
          if (key !== 'time' && key !== 'message' && key !== 'icon') {
            newStats[key] = Math.max(0, Math.min(100, prev[key] + effect[key]));
          }
        });
        return newStats;
      });

      // 시간 감소
      setTimeLeft(prev => prev - effect.time);
      
      // 완료한 작업 추가
      setCompletedTasks(prev => [...prev, careType]);
      
      // 메시지 표시
      setMessage(effect.message);
      
      // 애니메이션 종료
      setShowCareAnimation(false);
      setCurrentCareType('');
      
      // 메시지 3초 후 사라짐
      setTimeout(() => setMessage(''), 3000);
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
        resultMessage = "🏆 완벽한 하루였어요! " + selectedAnimal.name + "이(가) 정말 행복해해요!";
        grade = "S";
      } else if (totalScore >= 60) {
        resultMessage = "😊 좋은 하루였어요! " + selectedAnimal.name + "이(가) 만족해해요!";
        grade = "A";
      } else {
        resultMessage = "😔 " + selectedAnimal.name + "이(가) 더 많은 관심이 필요해요...";
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
    setMessage(`${animal.name}이(가) 당신을 기다리고 있어요! 🐾`);
  };

  // 게임 리셋
  const resetGame = () => {
    setSelectedAnimal(null);
    setGameStarted(false);
    setGameEnded(false);
    setMessage('');
    setGeneratedImage(null);
    setShowImageGeneration(false);
    setTodayRecord('');
    setAnimalMood('normal');
  };

  // 최고 케어 활동 결정 (가장 높은 스탯 기준)
  const getBestCareActivity = () => {
    const stats = {
      '씻기기': careStats.cleanliness,
      '밥주기': careStats.hunger,
      '미용하기': careStats.beauty
    };
    
    return Object.entries(stats).reduce((best, [activity, value]) => 
      value > stats[best] ? activity : best
    , '씻기기');
  };

  // DALL-E 이미지 생성 함수
  const generateCareImage = async () => {
    if (!selectedAnimal) return;
    
    try {
      setIsGeneratingImage(true);
      setShowImageGeneration(true);
      
      const bestActivity = getBestCareActivity();
      
      console.log('🎨 이미지 생성 시작:', {
        animal: selectedAnimal.name,
        activity: bestActivity,
        mood: animalMood
      });
      
      // 백엔드 API 호출 (DALL-E 연동)
      const response = await api.post('/api/generate-care-image', {
        animalData: {
          id: selectedAnimal.id,
          name: selectedAnimal.name,
          species: selectedAnimal.species,
          image_url: selectedAnimal.image_url,
          description: selectedAnimal.description
        },
        careActivity: bestActivity,
        careStats: careStats,
        animalMood: animalMood,
        completedTasks: completedTasks
      });
      
      if (response.data.success) {
        setGeneratedImage({
          url: response.data.image_path,
          activity: bestActivity,
          filename: response.data.filename,
          timestamp: response.data.timestamp
        });
        console.log('✅ 이미지 생성 완료:', response.data.filename);
      } else {
        throw new Error(response.data.error || '이미지 생성에 실패했습니다');
      }
      
    } catch (error) {
      console.error('❌ 이미지 생성 오류:', error);
      setMessage('🎨 이미지 생성에 실패했습니다. 나중에 다시 시도해주세요.');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setIsGeneratingImage(false);
    }
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
            🐾 하루 동물 케어 시뮬레이션 🐾
          </div>
          <button 
            className={styles.historyButton}
            onClick={() => setShowCareHistory(!showCareHistory)}
          >
            📝 케어 기록 {careHistory.length > 0 && `(${careHistory.length})`}
          </button>
        </div>
        <p className={styles.gameDescription}>
          실제 보호소의 유기동물을 선택하고 24시간 동안 정성껏 돌봐주세요!<br/>
          씻기기, 밥주기, 미용, 산책을 통해 행복하게 만들어주세요.
        </p>
        
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
                        <span className={styles.historyName}>{record.animal.name}</span>
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
                        <span className={styles.animalSpecies}>{animal.species}</span>
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
              <div className={styles.realDataNotice}>
                💡 <strong>실제 보호소 동물들</strong>과 함께하는 시뮬레이션입니다. 
                게임 후 관심이 생기셨다면 실제 입양도 고려해보세요! 🏡
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
        <h2>🐾 {selectedAnimal.name}이(가)의 하루</h2>
        <div className={styles.timeInfo}>
          <span className={styles.timeLeft}>⏰ 남은 시간: {timeLeft}시간</span>
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
              animalSpecies={selectedAnimal.species}
            />
          ) : (
            <>
              <div className={`${styles.animalContainer} ${styles[animalMood]}`}>
                <img 
                  src={selectedAnimal.image_url} 
                  alt={selectedAnimal.name}
                  className={`${styles.mainAnimalImage} ${styles[animalMood + 'Image']}`}
                  onError={(e) => { 
                    e.target.src = '/images/unknown_animal.png'; 
                  }}
                />
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
            placeholder={`${selectedAnimal.name}이(가)와의 특별한 순간을 기록해보세요... 예: "처음에는 무서워했지만 점점 마음을 열었어요"`}
            className={styles.recordTextarea}
            maxLength={100}
          />
          <div className={styles.recordCounter}>
            {todayRecord.length}/100자
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
            
            {/* 이미지 생성 섹션 */}
            {!showImageGeneration && (
              <div className={styles.imageGenerationPrompt}>
                <h3>🎨 특별한 추억을 만들어보세요!</h3>
                <p>
                  {selectedAnimal.name}이(가)와 함께한 {getBestCareActivity()} 장면을 
                  AI가 그려드릴게요!
                </p>
                <button 
                  className={styles.generateImageButton} 
                  onClick={generateCareImage}
                  disabled={isGeneratingImage}
                >
                  {isGeneratingImage ? (
                    <>
                      <span className={styles.loadingSpinner}></span>
                      AI가 그림을 그리고 있어요...
                    </>
                  ) : (
                    <>🎨 케어 장면 그려받기</>
                  )}
                </button>
              </div>
            )}
            
            {/* 생성된 이미지 표시 */}
            {generatedImage && (
              <div className={styles.generatedImageSection}>
                <h3>🖼️ {selectedAnimal.name}이(가)와의 {generatedImage.activity} 장면</h3>
                <div className={styles.generatedImageContainer}>
                  <img 
                    src={generatedImage.url} 
                    alt={`${selectedAnimal.name}의 ${generatedImage.activity} 장면`}
                    className={styles.generatedImage}
                  />
                  <div className={styles.imageCaption}>
                    AI가 그려준 {selectedAnimal.name}이(가)와의 특별한 순간
                  </div>
                </div>
                <div className={styles.imageActions}>
                  <button 
                    className={styles.downloadButton}
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = generatedImage.url;
                      link.download = `${selectedAnimal.name}_${generatedImage.activity}_${generatedImage.timestamp}.png`;
                      link.click();
                    }}
                  >
                    📥 이미지 다운로드
                  </button>
                  <button 
                    className={styles.shareButton}
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: `${selectedAnimal.name}이(가)와의 ${generatedImage.activity} 장면`,
                          text: '포우포우에서 동물 케어 시뮬레이션을 했어요!',
                          url: window.location.href
                        });
                      }
                    }}
                  >
                    🔗 공유하기
                  </button>
                </div>
              </div>
            )}
            
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
    </div>
  );
};

export default AnimalCareGame;