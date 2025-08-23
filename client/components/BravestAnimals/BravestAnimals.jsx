import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './BravestAnimals.module.css';

const BravestAnimals = () => {
  const [animals, setAnimals] = useState([]);

  useEffect(() => {
    const fetchOldestAnimals = async () => {
      try {
        const response = await axios.get('/api/animals/oldest');
        setAnimals(response.data);
      } catch (err) {
        console.error("Error fetching oldest animals:", err);
      }
    };

    fetchOldestAnimals();
  }, []);

  if (animals.length === 0) {
    return null; // 데이터가 없으면 아무것도 렌더링하지 않음
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>용감한 아이들</h2>
      <p className={styles.subtitle}>가장 오랜 시간 가족을 기다리고 있어요</p>
      <div className={styles.grid}>
        {animals.map(animal => (
          <div key={animal.animal_id} className={styles.card}>
            <img src={animal.image_url} alt={animal.species} className={styles.image} />
            <div className={styles.info}>
              <h3>{animal.species} ({animal.gender === 'male' ? '수컷' : '암컷'})</h3>
              <p>{animal.region}</p>
              <p>구조일: {new Date(animal.rescued_at).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BravestAnimals;