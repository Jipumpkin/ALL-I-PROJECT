import React, { useState, useEffect } from 'react';
import api from '../../axios';
import { Link } from 'react-router-dom';
import BravestAnimals from '../BravestAnimals/BravestAnimals.jsx';
import Content from '../Content/Content.jsx';
import styles from './Main.module.css';

const Main = () => {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 배열을 랜덤하게 섞는 함수
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        console.log('🔥 Main.jsx: 동물 데이터 요청 시작 - /animals?filter=all&page=1');
        const response = await api.get('/animals?filter=all&page=1');
        console.log('✅ Main.jsx: 동물 데이터 응답 성공:', response.data);
        console.log('📊 Main.jsx: 받은 동물 수:', response.data.animals?.length || 0);
        // 받아온 동물 목록을 랜덤하게 섞기
        const shuffledAnimals = shuffleArray(response.data.animals);
        setAnimals(shuffledAnimals);
      } catch (err) {
        console.error('❌ Main.jsx: 동물 데이터 요청 실패:', err.message);
        console.error('❌ Main.jsx: 에러 상세:', err);
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
              <BravestAnimals />
              <div className={styles['animal-grid']}>
                {animals.map((animal) => (
                  <div key={animal.animal_id} className={styles['animal-card']}>
                    <Link to={`/animal/${animal.animal_id}`} className={styles['animal-card-link']}>
                      <img src={animal.image_url} alt={animal.species} className={styles['animal-image']} onError={(e) => { e.target.src = '/images/unknown_animal.png'; }} />
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