import React from 'react';
import styles from './Loading.module.css';

// 목욕 애니메이션 컴포넌트
const ShowerAnimation = () => {
  const bubbleStyles = Array.from({ length: 15 }).map(() => ({
    left: `${Math.random() * 90 + 5}%`,
    width: `${Math.random() * 15 + 5}px`,
    height: `${Math.random() * 15 + 5}px`,
    animationDuration: `${Math.random() * 3 + 2}s`,
    animationDelay: `${Math.random() * 2}s`,
  }));

  return (
    <div className={styles.bathtub}>
      <div className={styles.water}></div>
      <div className={styles.dogShower}>
        <div className={styles.dogHead}>
          <div className={styles.ears}>
            <div className={`${styles.ear} ${styles.left}`}></div>
            <div className={`${styles.ear} ${styles.right}`}></div>
          </div>
          <div className={styles.eyes}>
            <div className={styles.eye}></div>
            <div className={styles.eye}></div>
          </div>
          <div className={styles.nose}></div>
        </div>
      </div>
      <div className={styles.bubbles}>
        {bubbleStyles.map((style, index) => (
          <div key={index} className={styles.bubble} style={style}></div>
        ))}
      </div>
    </div>
  );
};

const FoodAnimation = () => (
  <div className={styles.foodContainer}>
    <div className={styles.dogFood}>
      <div className={styles.dogHead}>
        <div className={styles.ears}>
          <div className={`${styles.ear} ${styles.left}`}></div>
          <div className={`${styles.ear} ${styles.right}`}></div>
        </div>
        <div className={styles.eyes}>
          <div className={styles.eye}></div>
          <div className={styles.eye}></div>
        </div>
        <div className={styles.nose}></div>
      </div>
    </div>
    <div className={styles.bowl}>
      <div className={styles.food} style={{ left: '20%' }}></div>
      <div className={styles.food} style={{ left: '40%', animationDelay: '0.5s' }}></div>
      <div className={styles.food} style={{ left: '60%', animationDelay: '1s' }}></div>
    </div>
  </div>
);

const GroomingAnimation = () => (
  <div className={styles.groomingContainer}>
    <div className={styles.dogHeadGrooming}>
      <div className={styles.dogHead}>
        <div className={styles.ears}>
          <div className={`${styles.ear} ${styles.left}`}></div>
          <div className={`${styles.ear} ${styles.right}`}></div>
        </div>
        <div className={styles.eyes}>
          <div className={styles.eye}></div>
          <div className={styles.eye}></div>
        </div>
        <div className={styles.nose}></div>
      </div>
    </div>
    <div className={styles.scissors}>
      <div className={`${styles.scissorHandle} ${styles.one}`}></div>
      <div className={`${styles.scissorHandle} ${styles.two}`}></div>
      <div className={`${styles.scissorBlade} ${styles.one}`}></div>
      <div className={`${styles.scissorBlade} ${styles.two}`}></div>
    </div>
  </div>
);


const Loading = ({ message = '처리 중...', animationType = 'shower' }) => {
  const renderAnimation = () => {
    switch (animationType) {
      case 'food':
        return <FoodAnimation />;
      case 'grooming':
        return <GroomingAnimation />;
      case 'shower':
      default:
        return <ShowerAnimation />;
    }
  };

  return (
    <div className={styles.loadingContainer}>
      {renderAnimation()}
      <div className={styles.message}>
        {message.split('\n').map((line, index) => (
          <div key={index}>{line}</div>
        ))}
      </div>
    </div>
  );
};

export default Loading;