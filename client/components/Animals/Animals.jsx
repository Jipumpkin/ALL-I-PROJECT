import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../axios';
import styles from './Animals.module.css';
import Pagination from '../Pagination/Pagination';
import ScrollAnimation from '../ScrollAnimation/ScrollAnimation';
import SimpleLoading from '../SimpleLoading/SimpleLoading';
import ErrorMessage from '../ErrorMessage/ErrorMessage';

const Animals = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [animals, setAnimals] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shelters, setShelters] = useState([]);
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('region') || 'all';
  });
  const [userImages, setUserImages] = useState([]);

  // ✅ 초기 queryParams
  const [queryParams, setQueryParams] = useState(() => {
    const params = new URLSearchParams(location.search);
    return {
      filter: params.get('filter') || 'all',
      page: parseInt(params.get('page'), 10) || 1,
      shelter_id: params.get('shelter_id') || 'all',
      region: params.get('region') || 'all',
    };
  });

  // 깨진 문자 정제 함수
  const cleanText = (text) => {
    if (!text) return text;
    // 깨진 문자(□, �, ��) 제거
    return text.replace(/[□�]/g, '').trim();
  };

  // 지역을 도/특별시 단위로 추출
  const extractMainRegion = (regionOrAddress) => {
    const text = cleanText(regionOrAddress);
    if (!text) return '기타';
    
    // 주요 지역 패턴 추출 (도, 특별시, 광역시, 특별자치시, 특별자치도)
    const patterns = [
      /^([가-힣]+특별자치도)/,   // ~특별자치도 (우선 매칭)
      /^([가-힣]+도)/,  // ~도
      /^([가-힣]+특별시)/,  // ~특별시  
      /^([가-힣]+광역시)/,  // ~광역시
      /^([가-힣]+특별자치시)/   // ~특별자치시
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    
    return '기타';
  };

  // 보호소 목록 가져오기
  useEffect(() => {
    const fetchShelters = async () => {
      try {
        const response = await axios.get('/api/animals/shelters');
        setShelters(response.data);
        
        // 도/특별시 단위로 지역 그룹화
        const mainRegions = response.data.map(s => 
          extractMainRegion(s.address || s.region)
        );
        const uniqueRegions = [...new Set(mainRegions)]
          .filter(region => region !== '강원도' && region !== '전라북도') // 구 지역명 제외
          .sort();
        setRegions(uniqueRegions);
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

  const handleRegionChange = (e) => {
    const newRegion = e.target.value;
    setSelectedRegion(newRegion);
    setQueryParams(prev => ({ 
      ...prev, 
      shelter_id: 'all', 
      region: newRegion,
      page: 1 
    }));
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

  const filteredShelters = selectedRegion === 'all'
    ? shelters.map(shelter => ({
        ...shelter,
        shelter_name: cleanText(shelter.shelter_name),
        region: cleanText(shelter.region)
      })).sort((a, b) => a.shelter_name.localeCompare(b.shelter_name))
    : shelters
        .filter(shelter => {
          const mainRegion = extractMainRegion(shelter.address || shelter.region);
          return mainRegion === selectedRegion;
        })
        .map(shelter => ({
          ...shelter,
          shelter_name: cleanText(shelter.shelter_name),
          region: cleanText(shelter.region)
        }))
        .sort((a, b) => a.shelter_name.localeCompare(b.shelter_name));

  // ✅ 최종 UI
  return (
    <div className={styles.container}>
      <div className={styles.filterContainer}>
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
          <select value={selectedRegion} onChange={handleRegionChange}>
            <option value="all">모든 지역</option>
            {regions.map(region => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
          <select value={queryParams.shelter_id} onChange={handleShelterChange}>
            <option value="all">모든 보호소</option>
            {filteredShelters.map(shelter => (
              <option key={shelter.shelter_id} value={shelter.shelter_id}>
                {shelter.shelter_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 🔄 로딩 */}
      {loading && <SimpleLoading message="페이지 로딩중" />}

      {/* ❌ 에러 */}
      {error && <ErrorMessage message={`데이터를 불러오는 중 오류가 발생했습니다: ${error.message}`} />}

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
                      <p><strong>출생년도:</strong> {animal.age}</p>
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