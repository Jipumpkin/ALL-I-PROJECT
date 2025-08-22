import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import styles from './Animals.module.css';
import Pagination from '../Pagination/Pagination';

const Animals = () => {
  const [animals, setAnimals] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 보호소 목록을 저장할 상태
  const [shelters, setShelters] = useState([]);

  // API 요청 파라미터를 단순화 (shelter_id 추가)
  const [queryParams, setQueryParams] = useState({
    filter: 'all',
    page: 1,
    shelter_id: 'all', // 기본값은 '전체'
  });

  // 1. 컴포넌트가 처음 로드될 때 보호소 목록을 가져옵니다.
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
  }, []); // 빈 배열을 전달하여 한 번만 실행되도록 설정

  // 2. queryParams가 변경될 때마다 동물 목록을 가져옵니다.
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

  const handleFilterChange = (newFilter) => {
    setQueryParams(prev => ({ ...prev, filter: newFilter, page: 1 }));
  };
  
  // 보호소 선택 시 queryParams를 업데이트하는 핸들러
  const handleShelterChange = (e) => {
    setQueryParams(prev => ({ ...prev, shelter_id: e.target.value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setQueryParams(prev => ({ ...prev, page: newPage }));
    }
  };
  
  const genderMap = { M: '수컷', F: '암컷', Q: '불명' };

  return (
    <div className={styles.container}>
      <div className={styles.filterContainer}>
        {/* --- 카테고리 필터 버튼 --- */}
        <div className={styles.filterButtons}>
          <button onClick={() => handleFilterChange('all')} className={queryParams.filter === 'all' ? styles.active : ''}>전체</button>
          <button onClick={() => handleFilterChange('dog')} className={queryParams.filter === 'dog' ? styles.active : ''}>유기견</button>
          <button onClick={() => handleFilterChange('cat')} className={queryParams.filter === 'cat' ? styles.active : ''}>유기묘</button>
          <button onClick={() => handleFilterChange('other')} className={queryParams.filter === 'other' ? styles.active : ''}>기타</button>
        </div>

        {/* --- 보호소 필터 드롭다운 --- */}
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
      </div>

      {loading && <p>로딩 중...</p>}
      {error && <p>데이터를 불러오는 중 오류가 발생했습니다: {error.message}</p>}
      
      {!loading && !error && (
        <>
          <div className={styles.animalGrid}>
            {animals.length > 0 ? animals.map((animal) => (
              <div key={animal.animal_id} className={styles.animalCard}>
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
            )) : <p className={styles.noResults}>조건에 맞는 동물이 없습니다.</p>}
          </div>

          <Pagination 
            currentPage={queryParams.page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default Animals;