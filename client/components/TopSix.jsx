import React, { useRef } from 'react';
import './TopSix.css';
import '../public/font/font.css';

const TopSix = () => {
  const scrollContainerRef = useRef(null);

  const scroll = (scrollOffset) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: scrollOffset, behavior: 'smooth' });
    }
  };

  return (
    <div className="info-list-section">
      <span style={{ fontFamily: 'Ownglyph_meetme-Rg', fontSize: '25px' }}>
        가장 오래 기다린 용감한 아이들
      </span>
      <div className="scroll-wrapper">
        <button className="scroll-button left" onClick={() => scroll(-200)}>&lt;</button>
        <div className="info-list" ref={scrollContainerRef}>
          {[...Array(50)].map((_, index) => (
            <div key={index} className="info-item">
              <img src="/images/bone.png" alt={`정보 ${index + 1}`} />
            </div>
          ))}
        </div>
        <button className="scroll-button right" onClick={() => scroll(200)}>&gt;</button>
      </div>
    </div>
  );
};

export default TopSix;