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

  // 자동 이미지 변경 (4초마다 다음 이미지 세트로, 항상 before부터 시작)
  useEffect(() => {
    // 사용자가 드래그 중이면 자동 변경 중지
    if (isDragging) return;
    
    const interval = setInterval(() => {
      setImageIndex(prevIndex => (prevIndex + 1) % beforeImages.length);
      // 이미지 세트가 바뀔 때마다 before로 리셋
      setSliderPosition(0);
      setIsShowingAfter(false);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [isDragging, beforeImages.length]);

  // 비활성 자동 슬라이드 기능 제거

  const resetSliderToStart = () => {
    setSliderPosition(0);
    setIsShowingAfter(false);
  };

  const updateUserInteraction = (shouldResetSequence = false) => {
    setLastUserInteraction(Date.now());
    setIsInactiveMode(false);
    setIsInactivePaused(false);
    
    // 자동 시퀀스 리셋하지 않음
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
    
    // 클릭 위치에 따라 슬라이더 위치 설정
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = Math.max(0, Math.min((x / rect.width) * 100, 100));
    
    setSliderPosition(percentage);
    setIsShowingAfter(percentage > 50);
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
    
    // 1cm를 픽셀로 변환 (대략 38픽셀)
    const threshold = (38 / rect.width) * 100;
    
    let finalPercentage = percentage;
    let showAfter = percentage > 50;
    
    // 왼쪽 끝 1cm 이내면 before로 고정
    if (percentage <= threshold) {
      finalPercentage = 0;
      showAfter = false;
    }
    // 오른쪽 끝 1cm 이내면 after로 고정  
    else if (percentage >= 100 - threshold) {
      finalPercentage = 100;
      showAfter = true;
    }
    
    setSliderPosition(finalPercentage);
    setIsShowingAfter(showAfter);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    
    updateUserInteraction();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
    const percentage = Math.max(0, Math.min((x / rect.width) * 100, 100));
    
    // 1cm를 픽셀로 변환 (대략 38픽셀)
    const threshold = (38 / rect.width) * 100;
    
    let finalPercentage = percentage;
    let showAfter = percentage > 50;
    
    // 왼쪽 끝 1cm 이내면 before로 고정
    if (percentage <= threshold) {
      finalPercentage = 0;
      showAfter = false;
    }
    // 오른쪽 끝 1cm 이내면 after로 고정  
    else if (percentage >= 100 - threshold) {
      finalPercentage = 100;
      showAfter = true;
    }
    
    setSliderPosition(finalPercentage);
    setIsShowingAfter(showAfter);
  };

  const handleDragStart = () => {
    setIsDragging(true);
    updateUserInteraction(false); // 자동 시퀀스 리셋하지 않고 현재 위치 유지
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    // 드래그 끝난 위치에서 상태 고정
    setIsShowingAfter(sliderPosition > 50);
    updateUserInteraction(false); // 자동 시퀀스 리셋하지 않음
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
        <p>클릭하거나 드래그해서 Before/After를 확인하세요</p>
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