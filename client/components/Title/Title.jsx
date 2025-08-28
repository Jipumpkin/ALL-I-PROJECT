import React from 'react'
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Title.module.css'
import '../../src/assets/font.css'

// Before/After Slider Component
const BeforeAfterSlider = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [lastUserInteraction, setLastUserInteraction] = useState(Date.now());
  const [isInactiveMode, setIsInactiveMode] = useState(false);
  const [isInactivePaused, setIsInactivePaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [inactiveDirection, setInactiveDirection] = useState(1); // 1: 오른쪽, -1: 왼쪽

  // 사용자 비활성 감지 및 자동 슬라이드
  useEffect(() => {
    if (isDragging || isHovered) return; // 호버 중일 때도 슬라이드 중지

    // 사용자 비활성 체크 (10초 후 빠른 모드)
    const inactiveCheck = setInterval(() => {
      const timeSinceInteraction = Date.now() - lastUserInteraction;
      const shouldBeInactive = timeSinceInteraction > 10000 && !isHovered;
      
      if (shouldBeInactive && !isInactiveMode) {
        setIsInactiveMode(true);
        setIsInactivePaused(false); // 비활성 모드 시작시 일시정지 해제
        setInactiveDirection(1); // 오른쪽으로 시작
      } else if (!shouldBeInactive && isInactiveMode) {
        setIsInactiveMode(false);
        setIsInactivePaused(false);
      }
    }, 1000);

    let interval;

    if (isInactiveMode && !isHovered) {
      if (!isInactivePaused) {
        // 비활성 모드: 좌우로 왔다갔다 슬라이드
        interval = setInterval(() => {
          setSliderPosition(prev => {
            const step = 6 * inactiveDirection; // 6%씩 더 빠르게 이동
            let next = prev + step;
            
            // 경계에 도달하면 방향 바꾸고 일시정지
            if (next >= 100) {
              setInactiveDirection(-1); // 왼쪽으로 방향 변경
              setIsInactivePaused(true);
              setTimeout(() => {
                setIsInactivePaused(false);
              }, 4000); // 4초 정지 (더 긴 텀)
              return 100;
            } else if (next <= 0) {
              setInactiveDirection(1); // 오른쪽으로 방향 변경
              setIsInactivePaused(true);
              setTimeout(() => {
                setIsInactivePaused(false);
              }, 4000); // 4초 정지 (더 긴 텀)
              return 0;
            }
            
            return next;
          });
        }, 10); // 10ms 간격으로 더 빠르게
      }
    }
    // 호버 중이거나 활성 모드일 때는 슬라이드 없음

    return () => {
      clearInterval(inactiveCheck);
      if (interval) clearInterval(interval);
    };
  }, [isDragging, isInactiveMode, isInactivePaused, isHovered, lastUserInteraction, inactiveDirection]);

  const updateUserInteraction = () => {
    setLastUserInteraction(Date.now());
    setIsInactiveMode(false);
    setIsInactivePaused(false);
  };

  const handleClick = (e) => {
    // 슬라이더 핸들 클릭은 무시
    if (e.target.closest(`.${styles.sliderBar}`)) return;
    
    updateUserInteraction();
    const targetPosition = sliderPosition > 50 ? 0 : 100;
    animateToPosition(targetPosition);
  };

  const animateToPosition = (target) => {
    const start = sliderPosition;
    const distance = target - start;
    const duration = 250; // 0.25초로 매우 빠르게
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // easeOutExpo 이징 함수 (매우 빠르고 부드럽게)
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      const newPosition = start + (distance * eased);
      setSliderPosition(newPosition);

      if (progress < 1) {
        requestAnimationFrame(animate);
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
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    
    updateUserInteraction();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
    const percentage = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percentage);
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
            src="/images/poster1.jpg" 
            alt="Before - 유기동물 보호소" 
            className={styles.beforeImage}
          />
          <div className={styles.imageLabel + ' ' + styles.beforeLabel}>Before</div>
        </div>
        
        {/* After Image with Clip */}
        <div 
          className={styles.imageContainer + ' ' + styles.afterContainer}
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img 
            src="/images/child-puppy.png" 
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
    const images = [
        '/images/poster1.jpg',
        '/images/poster2.jpg',
        '/images/poster4.jpg',
        '/images/poster5.jpg',
        '/images/poster6.jpg',
        '/images/hoochoo1.jpeg',

    ];
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    useEffect(() => {
        if (isPaused) return;
    
        const interval = setInterval(() => {
          setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 3000); // Change image every 3 seconds
    
        return () => clearInterval(interval);
      }, [isPaused, images.length]);
    // const nextImage = () => {
    //     setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    //  };

  const goToImage = (index) => {
        setCurrentImageIndex(index);
    };

    const prevImage = () => {
        setCurrentImageIndex((prevIndex) => 
            prevIndex === 0 ? images.length - 1 : prevIndex - 1
        );
    };

    const nextImage = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    };
    return (
    <div className={styles['headline']}>
        <div className={styles["title-section"]}>
            <BeforeAfterSlider />
        </div>
        <nav className={styles["nav"]}>
            <ol>
                <li>
                    <Link to="/intro" onClick={() => window.scrollTo(0, 0)}><img src="../images/nav_icon_info.png" alt="info"/></Link>
                    소개
                </li>
                <li><Link to="https://www.animals.or.kr/support/intro"><img src="../images/nav_icon_donate.png" alt="info"/>
                    </Link>
                    소식
                </li>
                <li><Link to="https://kipfri.com/index.php/campaign"><img src="../images/nav_icon_campaign.png" alt="info"/>
                    </Link>
                    캠페인
                </li>
                <li><Link to="https://likalika.com/"><img src="../images/nav_icon_store.png" alt="info"/>
                    </Link>
                    애견샵
                </li>
                
            </ol>
        </nav>
    </div>
  )
}

export default Title