import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import styles from './Animals.module.css';
import Pagination from '../Pagination/Pagination'; // Import the new component
import ScrollAnimation from '../ScrollAnimation/ScrollAnimation';
import Loading from '../Loading/Loading';

const Animals = () => {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'dog', 'cat', 'other'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchAnimals = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/animals?filter=${filter}&page=${page}`);
        setAnimals(response.data.animals);
        setTotalPages(response.data.totalPages);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnimals();
  }, [filter, page]); // Revert to original dependencies

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1); // Reset to first page when filter changes
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const genderMap = {
    male: '수컷',
    female: '암컷',
    unknown: '불명'
  };

  return (
    <div className={styles.container}>
      {/* 🎯 필터 버튼: fadeInUp 애니메이션 - 위에서 부드럽게 나타남 */}
      <ScrollAnimation animation="fadeInUp">
        <div className={styles.filterButtons}>
          <button onClick={() => handleFilterChange('all')} className={filter === 'all' ? styles.active : ''}>전체</button>
          <button onClick={() => handleFilterChange('dog')} className={filter === 'dog' ? styles.active : ''}>유기견</button>
          <button onClick={() => handleFilterChange('cat')} className={filter === 'cat' ? styles.active : ''}>유기묘</button>
          <button onClick={() => handleFilterChange('other')} className={filter === 'other' ? styles.active : ''}>기타</button>
        </div>
      </ScrollAnimation>

      {/* 🔄 로딩 상태: 개선된 로딩 스피너 */}
      {loading && <Loading message="동물들을 찾고 있어요..." />}
      
      {/* ❌ 에러 상태 */}
      {error && <p>Error fetching data: {error.message}</p>}
      
      {!loading && !error && (
        <>
          <div className={styles.animalGrid}>
            {/* 🎨 동물 카드들: 각각 순차적으로 나타나는 staggered animation */}
            {animals.map((animal, index) => (
              <ScrollAnimation 
                key={animal.animal_id} 
                animation="scaleIn" 
                delay={index * 80} // 80ms씩 지연되어 순차 등장
              >
                <div className={styles.animalCard}>
                  <Link to={`/animal/${animal.animal_id}`} className={styles.animalCardLink}>
                    <img src={animal.image_url} alt={animal.species} className={styles.animalImage} onError={(e) => { e.target.src = '/images/unknown_animal.png'; }} />
                    <div className={styles.animalInfo}>
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

          {/* 🎭 페이지네이션: fadeInUp 애니메이션 */}
          <ScrollAnimation animation="fadeInUp">
            <Pagination 
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </ScrollAnimation>
        </>
      )}
    </div>
  );
};

export default Animals;