import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import styles from './BravestAnimals.module.css';

const BravestAnimals = () => {
  const [animals, setAnimals] = useState([]);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const fetchOldestAnimals = async () => {
      try {
        console.log('🔥 BravestAnimals.jsx: 가장 오래된 동물 데이터 요청 시작 - /api/animals/oldest');
        const response = await axios.get('/api/animals/oldest');
        console.log('✅ BravestAnimals.jsx: 가장 오래된 동물 데이터 응답 성공:', response.data);
        console.log('📊 BravestAnimals.jsx: 받은 동물 수:', response.data.animals?.length || 0);
        setAnimals(response.data.animals);
      } catch (err) {
        console.error("❌ BravestAnimals.jsx: 가장 오래된 동물 데이터 요청 실패:", err.message);
        console.error("❌ BravestAnimals.jsx: 에러 상세:", err);
      }
    };

    fetchOldestAnimals();
  }, []);

  const scroll = (scrollOffset) => {
    scrollContainerRef.current.scrollBy({ left: scrollOffset, behavior: 'smooth' });
  };

  if (animals.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>가장 오래 기다린 용감한 아이들</h2>
      <p className={styles.subtitle}>오랜 시간 가족을 기다리고 있어요</p>
      <div className={styles.carouselContainer}>
        <button className={`${styles.arrow} ${styles.left}`} onClick={() => scroll(-300)}>‹</button>
        <div className={styles.scrollContainer} ref={scrollContainerRef}>
          {animals.map(animal => (
            <Link to={`/animal/${animal.animal_id}`} key={animal.animal_id} className={styles.cardLink}>
              <div className={styles.card}>
                <img src={animal.image_url} alt={animal.species} className={styles.animalImage} onError={(e) => { e.target.src = '/images/unknown_animal.png'; }} />
                <div className={styles.info}>
                  <h3>{animal.species} ({animal.gender === 'male' ? '수컷' : '암컷'})</h3>
                  <p>{animal.region}</p>
                  <p>보호 시작일: {new Date(animal.rescued_at).toLocaleDateString()}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <button className={`${styles.arrow} ${styles.right}`} onClick={() => scroll(300)}>›</button>
      </div>
    </div>
  );
};

export default BravestAnimals;