import React from 'react'
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Title.module.css'
import '../../src/assets/font.css'

// Before/After Slider Component
const BeforeAfterSlider = () => {
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastUserInteraction, setLastUserInteraction] = useState(Date.now());
  const [isInactiveMode, setIsInactiveMode] = useState(false);
  const [isInactivePaused, setIsInactivePaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [inactiveDirection, setInactiveDirection] = useState(1); // 1: 오른쪽, -1: 왼쪽
  const [imageIndex, setImageIndex] = useState(0); // 현재 이미지 세트 인덱스
  const [isShowingAfter, setIsShowingAfter] = useState(false); // 같은 세트 내에서 after 표시 여부
  const [isAnimating, setIsAnimating] = useState(false); // 애니메이션 진행 중 여부

  // 이미지 배열 정의
  const beforeImages = [
    '/images/before0.png',
    '/images/before1.png', 
    '/images/before2.png'
  ];
  
  const afterImages = [
    '/images/after0.png',
    '/images/after1.png',
    '/images/after2.png'
  ];

  // 이미지 자동 변경 로직
  useEffect(() => {
    // 사용자가 호버하거나 드래그 중이거나 애니메이션 중이면 자동 변경 중지
    if (isHovered || isDragging || isAnimating) return;
    
    let timeoutId;
    
    const scheduleNext = () => {
      if (!isShowingAfter) {
        // before 상태 → after로 슬라이더 이동 (4초 후)
        timeoutId = setTimeout(() => {
          animateToPosition(100, () => {
            setIsShowingAfter(true);
          });
        }, 4000);
      } else {
        // after 상태 → 다음 이미지의 before 상태로 (4초 후)
        timeoutId = setTimeout(() => {
          // 애니메이션 중이 아닐 때만 실행
          if (!isAnimating) {
            const nextImageIndex = (imageIndex + 1) % beforeImages.length;
            
            // 동시에 상태 변경하여 싱크 맞추기
            setImageIndex(nextImageIndex);
            setSliderPosition(0);
            setIsShowingAfter(false);
          }
        }, 4000);
      }
    };
    
    scheduleNext();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isShowingAfter, imageIndex, beforeImages.length, isHovered, isDragging, isAnimating]);

  // 사용자 비활성 감지 및 자동 슬라이드
  useEffect(() => {
    if (isDragging || isHovered) return;

    const inactiveCheck = setInterval(() => {
      const timeSinceInteraction = Date.now() - lastUserInteraction;
      const shouldBeInactive = timeSinceInteraction > 8000 && !isHovered;
      
      if (shouldBeInactive !== isInactiveMode) {
        setIsInactiveMode(shouldBeInactive);
        setIsInactivePaused(false);
        if (shouldBeInactive) {
          setInactiveDirection(1);
        }
      }
    }, 1000);

    let interval;
    if (isInactiveMode && !isInactivePaused && !isHovered) {
      interval = setInterval(() => {
        setSliderPosition(prev => {
          const step = 4 * inactiveDirection;
          let next = prev + step;
          
          if (next >= 100) {
            setInactiveDirection(-1);
            setIsInactivePaused(true);
            setTimeout(() => setIsInactivePaused(false), 3000);
            return 100;
          } else if (next <= 0) {
            setInactiveDirection(1);
            setIsInactivePaused(true);
            setTimeout(() => setIsInactivePaused(false), 3000);
            return 0;
          }
          
          return next;
        });
      }, 15);
    }

    return () => {
      clearInterval(inactiveCheck);
      if (interval) clearInterval(interval);
    };
  }, [isDragging, isInactiveMode, isInactivePaused, isHovered, lastUserInteraction, inactiveDirection]);

  const resetSliderToStart = () => {
    setSliderPosition(0);
    setIsShowingAfter(false);
  };

  const updateUserInteraction = (shouldResetSequence = true) => {
    setLastUserInteraction(Date.now());
    setIsInactiveMode(false);
    setIsInactivePaused(false);
    
    // 자동 시퀀스 리셋 여부 결정
    if (shouldResetSequence) {
      resetSliderToStart();
    }
  };

  const handleClick = (e) => {
    // 슬라이더 핸들 클릭은 무시
    if (e.target.closest(`.${styles.sliderBar}`)) return;
    // 다음 이미지 버튼 클릭은 무시
    if (e.target.closest(`.${styles.nextButton}`)) return;
    // 애니메이션 중이면 클릭 무시
    if (isAnimating) return;
    
    // 클릭 시에는 자동 시퀀스 리셋하지 않음
    updateUserInteraction(false);
    
    // 현재 상태에 따라 토글
    if (isShowingAfter || sliderPosition > 50) {
      // After 상태 → Before로
      animateToPosition(0, () => {
        setIsShowingAfter(false);
      });
    } else {
      // Before 상태 → After로
      animateToPosition(100, () => {
        setIsShowingAfter(true);
      });
    }
  };
  
  const handleNextImage = () => {
    if (isAnimating) return;
    
    updateUserInteraction();
    const nextImageIndex = (imageIndex + 1) % beforeImages.length;
    
    // 동시에 상태 변경하여 싱크 맞추기
    setImageIndex(nextImageIndex);
    setSliderPosition(0);
    setIsShowingAfter(false);
  };

  const animateToPosition = (target, onComplete = null) => {
    // 이미 애니메이션 중이면 무시
    if (isAnimating) return;
    
    setIsAnimating(true);
    const start = sliderPosition;
    const distance = target - start;
    const duration = 250;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const newPosition = start + (distance * eased);
      setSliderPosition(newPosition);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // 애니메이션 완료 시 상태 해제 및 콜백 실행
        setIsAnimating(false);
        if (onComplete) onComplete();
      }
    };

    requestAnimationFrame(animate);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    updateUserInteraction();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = Math.max(0, Math.min((x / rect.width) * 100, 100));
    
    setSliderPosition(percentage);
    // 드래그 시 실시간으로 상태 동기화
    setIsShowingAfter(percentage > 50);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    
    updateUserInteraction();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
    const percentage = Math.max(0, Math.min((x / rect.width) * 100, 100));
    
    setSliderPosition(percentage);
    // 터치 드래그 시 실시간으로 상태 동기화
    setIsShowingAfter(percentage > 50);
  };

  const handleDragStart = () => {
    setIsDragging(true);
    updateUserInteraction();
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    updateUserInteraction();
  };

  const handleMouseEnter = () => {
    updateUserInteraction();
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div className={styles.beforeAfterContainer}>
      <div 
        className={styles.beforeAfterWrapper}
        onMouseMove={handleMouseMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={(e) => {
          handleDragEnd(e);
          handleMouseLeave();
        }}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleDragEnd}
        onMouseEnter={handleMouseEnter}
        onClick={handleClick}
      >
        {/* Before Image */}
        <div className={styles.imageContainer}>
          <img 
            src={beforeImages[imageIndex]} 
            alt="Before - 유기동물 보호소" 
            className={styles.beforeImage}
          />
          <div className={styles.imageLabel + ' ' + styles.beforeLabel}>Before</div>
        </div>
        
        {/* After Image with Clip */}
        <div 
          className={`${styles.imageContainer} ${styles.afterContainer}`}
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img 
            src={afterImages[imageIndex]} 
            alt="After - 입양 후 행복한 일상" 
            className={styles.afterImage}
          />
          <div className={styles.imageLabel + ' ' + styles.afterLabel}>After</div>
        </div>
        
        {/* Slider Bar */}
        <div 
          className={styles.sliderBar}
          style={{ 
            left: `${sliderPosition}%`,
            transform: 'translateX(-50%)'
          }}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <div className={styles.sliderHandle}>
            <span className={styles.handleLine}></span>
            <span className={styles.handleLine}></span>
            <span className={styles.handleLine}></span>
          </div>
        </div>
      </div>
      
      {/* Next Image Button */}
      <button 
        className={styles.nextButton}
        onClick={handleNextImage}
        disabled={isAnimating}
      >
        다음 이미지
      </button>

      <div className={styles.sliderCaption}>
        <span className={styles.captionEmoji}>🐾</span>
        <p>
          {isHovered 
            ? '마우스 호버 중 - 대기 모드'
            : isInactiveMode && isInactivePaused 
            ? '잠시 정지 중... (4초 후 다시 시작)' 
            : isInactiveMode 
            ? '빠른 좌우 슬라이드 진행 중...' 
            : '클릭하거나 드래그해서 Before/After를 확인하세요'
          }
        </p>
      </div>
    </div>
  );
};
const Title = () => {
    return (
    <div className={styles['headline']}>
        <div className={styles["title-section"]}>
            <BeforeAfterSlider />
        </div>
        <nav className={styles["nav"]}>
            <ol>
                <li>
                    <Link to="/intro" onClick={() => window.scrollTo(0, 0)}><img src="..\images\query.png" alt="info"/></Link>
                    소개
                </li>
                <li><Link to="https://www.animals.or.kr/support/intro"><img src="..\images\high_priority.png" alt="info"/>
                    </Link>
                    소식
                </li>
                <li><Link to="https://kipfri.com/index.php/campaign"><img src="..\images\web_advertising.png" alt="info"/>
                    </Link>
                    캠페인
                </li>
                <li><Link to="https://likalika.com/"><img src="..\images\shopping_basket.png" alt="info"/>
                    </Link>
                    반려동물용품샵
                </li>
                
            </ol>
        </nav>
    </div>
  )
}

export default Title