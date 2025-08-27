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
        const response = await axios.get('/api/animals/oldest');
        setAnimals(response.data.animals);
      } catch (err) {
        console.error("Error fetching oldest animals:", err);
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
      <h2 className={styles.title}>가장 오래 가족을 기다린 친구들</h2>
      <p className={styles.subtitle}>가장 오랜 시간 가족을 기다리고 있어요</p>
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