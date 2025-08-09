import React, { useRef } from 'react';
import styles from './TopSix.module.css';
import '../../public/font/font.css';
import { FaArrowRightLong, FaChevronLeft, FaChevronRight } from "react-icons/fa6";

const TopSix = () => {
  const scrollContainerRef = useRef(null);

  const scroll = (scrollOffset) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: scrollOffset, behavior: 'smooth' });
    }
  };

  return (
    <div className={styles["info-list-section"]}>
      <div className={styles["navtopbar"]} style={{ display: 'flex', justifyContent: 'space-between', margin: '15px'}}>
      <span style={{ fontFamily: 'Ownglyph_meetme-Rg', fontSize: '25px' }}>
        가장 오래 기다린 용감한 아이들
      </span>
      <span style={{ display: 'flex', alignItems: 'center', fontFamily: 'revert', fontSize: '13px', fontWeight: 'bold', color: 'gray' }}>
        더보기
        <FaArrowRightLong style={{ marginLeft: '5px' }} />
      </span>
      </div>
      <div className={styles["scroll-wrapper"]}>
        <button className={`${styles["scroll-button"]} ${styles["left"]}`} onClick={() => scroll(-200)}><FaChevronLeft /></button>
        <div className={styles["info-list"]} ref={scrollContainerRef}>
          {[...Array(50)].map((_, index) => (
            <div key={index} className={styles["info-item"]}>
              <img src="/images/unknown_animal.png" alt={`정보 ${index + 1}`} />
            </div>
          ))}
        </div>
        <button className={`${styles["scroll-button"]} ${styles["right"]}`} onClick={() => scroll(200)}><FaChevronRight /></button>
      </div>
    </div>
  );
};

export default TopSix;