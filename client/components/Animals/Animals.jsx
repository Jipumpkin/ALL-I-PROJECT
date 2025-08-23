import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styles from './Animals.module.css';
import Pagination from '../Pagination/Pagination';
import ScrollAnimation from '../ScrollAnimation/ScrollAnimation';
import Loading from '../Loading/Loading';

const Animals = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [animals, setAnimals] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shelters, setShelters] = useState([]);

  // ✅ 초기 queryParams
  const [queryParams, setQueryParams] = useState(() => {
    const params = new URLSearchParams(location.search);
    return {
      filter: params.get('filter') || 'all',
      page: parseInt(params.get('page'), 10) || 1,
      shelter_id: params.get('shelter_id') || 'all',
    };
  });

  // 보호소 목록 가져오기
  useEffect(() => {
    const fetchShelters = async () => {
      try {
        const response = await axios.get('/api/animals/shelters');
        setShelters(response.data);
      } catch (err) {
        console.error("보호소 목록을 불러오는 데 실패했습니다.", err);
      }
    };
    fetchShelters();
  }, []);

  // 동물 목록 가져오기
  useEffect(() => {
    const fetchAnimals = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams(queryParams).toString();
        const response = await axios.get(`/api/animals?${params}`);
        setAnimals(response.data.animals);
        setTotalPages(response.data.totalPages);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnimals();
  }, [queryParams]);

  // ✅ queryParams 변경 시 URL 업데이트
  useEffect(() => {
    const params = new URLSearchParams(queryParams).toString();
    navigate(`?${params}`, { replace: true });
  }, [queryParams, navigate]);

  // 핸들러
  const handleFilterChange = (newFilter) => {
    setQueryParams(prev => ({ ...prev, filter: newFilter, page: 1 }));
  };

  const handleShelterChange = (e) => {
    setQueryParams(prev => ({ ...prev, shelter_id: e.target.value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setQueryParams(prev => ({ ...prev, page: newPage }));
    }
  };

  const genderMap = { male: '수컷', female: '암컷', unknown: '불명' };

  // ✅ 최종 UI
  return (
    <div className={styles.container}>
      {/* 🎯 필터 버튼 */}
      <ScrollAnimation animation="fadeInUp">
        <div className={styles.filterButtons}>
          <button onClick={() => handleFilterChange('all')} className={queryParams.filter === 'all' ? styles.active : ''}>전체</button>
          <button onClick={() => handleFilterChange('dog')} className={queryParams.filter === 'dog' ? styles.active : ''}>유기견</button>
          <button onClick={() => handleFilterChange('cat')} className={queryParams.filter === 'cat' ? styles.active : ''}>유기묘</button>
          <button onClick={() => handleFilterChange('other')} className={queryParams.filter === 'other' ? styles.active : ''}>기타</button>
        </div>
      </ScrollAnimation>

      {/* 보호소 필터 */}
      <div className={styles.shelterFilter}>
        <select value={queryParams.shelter_id} onChange={handleShelterChange}>
          <option value="all">모든 보호소</option>
          {shelters.map(shelter => (
            <option key={shelter.shelter_id} value={shelter.shelter_id}>
              {shelter.shelter_name}
            </option>
          ))}
        </select>
      </div>

      {/* 🔄 로딩 */}
      {loading && <Loading message="동물들을 찾고 있어요..." />}

      {/* ❌ 에러 */}
      {error && <p>데이터를 불러오는 중 오류가 발생했습니다: {error.message}</p>}

      {/* ✅ 데이터 렌더링 */}
      {!loading && !error && (
        <>
          <div className={styles.animalGrid}>
            {animals.length > 0 ? animals.map((animal, index) => (
              <ScrollAnimation 
                key={animal.animal_id} 
                animation="scaleIn" 
                delay={index * 80}
              >
                <div className={styles.animalCard}>
                  <Link to={`/animal/${animal.animal_id}`} className={styles.animalCardLink}>
                    <img 
                      src={animal.image_url} 
                      alt={animal.species} 
                      className={styles.animalImage} 
                      onError={(e) => { e.target.src = '/images/unknown_animal.png'; }} 
                    />
                    <div className={styles.animalInfo}>
                      <p><strong>품종:</strong> {animal.species}</p>
                      <p><strong>생년:</strong> {animal.age}</p>
                      <p><strong>성별:</strong> {genderMap[animal.gender] || '정보 없음'}</p>
                      <p><strong>구조지역:</strong> {animal.region}</p>
                    </div>
                  </Link>
                </div>
              </ScrollAnimation>
            )) : (
              <p className={styles.noResults}>조건에 맞는 동물이 없습니다.</p>
            )}
          </div>

          {/* 🎭 페이지네이션 */}
          <ScrollAnimation animation="fadeInUp">
            <Pagination 
              currentPage={queryParams.page}
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
