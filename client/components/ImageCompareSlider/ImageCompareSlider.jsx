import React, { useState, useRef, useEffect } from 'react';
import './ImageCompareSlider.css';

const ImageCompareSlider = ({ imageBefore, imageAfter }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;

    const { left, width } = containerRef.current.getBoundingClientRect();
    let position = ((e.clientX - left) / width) * 100;
    if (position < 0) position = 0;
    if (position > 100) position = 100;
    setSliderPosition(position);
  };

  const handleTouchMove = (e) => {
    if (!containerRef.current || !e.touches[0]) return;

    const { left, width } = containerRef.current.getBoundingClientRect();
    let position = ((e.touches[0].clientX - left) / width) * 100;
    if (position < 0) position = 0;
    if (position > 100) position = 100;
    setSliderPosition(position);
  };

  return (
    <div
      className="image-compare-container"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    >
      <img src={imageBefore} alt="Before" className="image-before" />
      <img
        src={imageAfter}
        alt="After"
        className="image-after"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      />
      <div className="slider-line" style={{ left: `${sliderPosition}%` }}></div>
      <div className="slider-handle" style={{ left: `${sliderPosition}%` }}></div>
    </div>
  );
};

export default ImageCompareSlider;
