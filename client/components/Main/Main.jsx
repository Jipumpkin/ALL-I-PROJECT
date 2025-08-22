import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import TopSix from '../TopSix/TopSix.jsx';
import Content from '../Content/Content.jsx';
import ScrollAnimation from '../ScrollAnimation/ScrollAnimation';
import Loading from '../Loading/Loading';
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
          {/* 🔄 로딩 상태: 개선된 로딩 스피너 */}
          {loading && <Loading message="동물 정보를 불러오는 중..." />}
          
          {/* ❌ 에러 상태: 에러 메시지 */}
          {error && <p>Error fetching data: {error.message}</p>}
          
          {!loading && !error && (
            <>
              {/* 🎭 TopSix 컴포넌트: fadeInUp 애니메이션 - 아래에서 위로 부드럽게 나타남 */}
              <ScrollAnimation animation="fadeInUp">
                <TopSix />
              </ScrollAnimation>
              
              {/* 🎨 동물 그리드: 각 카드가 순차적으로 나타남 (staggered animation) */}
              <div className={styles['animal-grid']}>
                {animals.map((animal, index) => (
                  <ScrollAnimation 
                    key={animal.animal_id} 
                    animation="scaleIn" 
                    delay={index * 100} // 100ms씩 지연되어 순차적으로 나타남
                  >
                    <div className={styles['animal-card']}>
                      <Link to={`/animal/${animal.animal_id}`} className={styles['animal-card-link']}>
                        <img src={animal.image_url} alt={animal.species} className={styles['animal-image']} />
                        <div className={styles['animal-info']}>
                            <p><strong>품종:</strong> {animal.species}</p>
                          <p><strong>생년:</strong> {animal.age}</p>
                          <p><strong>성별:</strong> {genderMap[animal.gender] || '정보 없음'}</p>
                          <p><strong>구조지역:</strong> {animal.region}</p>
                        </div>
                      </Link>
                    </div>
                  </ScrollAnimation>
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