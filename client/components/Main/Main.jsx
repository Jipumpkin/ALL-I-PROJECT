import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import TopSix from '../TopSix/TopSix.jsx';
import Content from '../Content/Content.jsx';
import styles from './Main.module.css';

const Main = () => {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        // 백엔드 API 엔드포인트를 /api/animals/list로 수정합니다.
        const response = await axios.get('/api/animals?filter=all&page=1');
        setAnimals(response.data.animals);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnimals();
  }, []);

  const genderMap = {
    male: '수컷',
    female: '암컷',
    unknown: '불명'
  };

  return (
    <div className={styles['main-Container']}>
      <Content>
        <div className={styles['animal-list-container']}>
          {loading && <p>Loading...</p>}
          {error && <p>Error fetching data: {error.message}</p>}
          {!loading && !error && (
            <>
              <TopSix />
              <div className={styles['animal-grid']}>
                {animals.map((animal) => (
                  <div key={animal.animal_id} className={styles['animal-card']}>
                    <Link to={`/animal/${animal.animal_id}`} className={styles['animal-card-link']}>
                      <img src={animal.image_url} alt={animal.species} className={styles['animal-image']} />
                      <div className={styles['animal-info']}>
                        <p><strong>품종:</strong> {animal.species}</p>
                        <p><strong>출생년도:</strong> {animal.age}</p>
                        <p><strong>성별:</strong> {genderMap[animal.gender] || '정보 없음'}</p>
                        <p><strong>구조지역:</strong> {animal.region}</p>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </Content>
    </div>
  );
};

export default Main;