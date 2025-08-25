import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import styles from './TopSix.module.css';

const TopSix = () => {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchOldestAnimals = async () => {
      try {
        // Assuming an API endpoint for oldest animals
        const response = await axios.get('/api/animals/oldest?limit=12');
        setAnimals(response.data.animals);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOldestAnimals();
  }, []);

  const scroll = (scrollOffset) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += scrollOffset;
    }
  };

  const genderMap = {
    male: '수컷',
    female: '암컷',
    unknown: '불명'
  };

  if (loading) return <p>Loading oldest animals...</p>;
  if (error) return <p>Error loading oldest animals: {error.message}</p>;

  return (
    <div className={styles['info-list-section']}>
      <h2>보호소에서 가장 오래된 동물들</h2>
      <div className={styles['scroll-wrapper']}>
        <button className={`${styles['scroll-button']} ${styles.left}`} onClick={() => scroll(-300)}>
          &lt;
        </button>
        <div className={styles['info-list']} ref={scrollRef}>
          {animals.map((animal) => (
            <div key={animal.animal_id} className={styles['info-item']}>
              <Link to={`/animal/${animal.animal_id}`}>
                <img src={animal.image_url} alt={animal.species} className={styles.animalImage} onError={(e) => { e.target.src = '/images/unknown_animal.png'; }} />
              </Link>
            </div>
          ))}
        </div>
        <button className={`${styles['scroll-button']} ${styles.right}`} onClick={() => scroll(300)}>
          &gt;
        </button>
      </div>
    </div>
  );
};

export default TopSix;