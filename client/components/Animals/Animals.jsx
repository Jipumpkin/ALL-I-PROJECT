import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Animals.module.css';

const Animals = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  return (
    <div className={styles["animals-container"]}>
      <div className={styles["header"]}>
        <h2 className={styles["animals-title"]}>유기동물</h2>
      </div>

      <div className={styles["category-buttons"]}>
        <button 
          className={`${styles["category-btn"]} ${selectedCategory === 'all' ? styles["active"] : ''}`}
          onClick={() => handleCategoryChange('all')}
        >
          전체
        </button>
        <button 
          className={`${styles["category-btn"]} ${selectedCategory === 'dog' ? styles["active"] : ''}`}
          onClick={() => handleCategoryChange('dog')}
        >
          유기견
        </button>
        <button 
          className={`${styles["category-btn"]} ${selectedCategory === 'cat' ? styles["active"] : ''}`}
          onClick={() => handleCategoryChange('cat')}
        >
          유기묘
        </button>
      </div>

      <div className={styles["animals-content"]}>
        <p>선택된 카테고리: {
          selectedCategory === 'all' ? '전체' :
          selectedCategory === 'dog' ? '유기견' :
          selectedCategory === 'cat' ? '유기묘' : ''
        }</p>
        {/* 여기에 실제 동물 목록이 들어갈 예정 */}
      </div>
    </div>
  );
};

export default Animals;