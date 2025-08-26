import React, { useEffect, useRef, useState } from 'react';
import styles from './ScrollAnimation.module.css';

const ScrollAnimation = ({ 
  children, 
  animation = 'fadeInUp', 
  delay = 0,
  threshold = 0.1 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
        }
      },
      { threshold }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [delay, threshold]);

  return (
    <div 
      ref={elementRef}
      className={`${styles.scrollAnimation} ${styles[animation]} ${isVisible ? styles.visible : ''}`}
    >
      {children}
    </div>
  );
};

export default ScrollAnimation;