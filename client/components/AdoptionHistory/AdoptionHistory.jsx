import React, { useState, useEffect } from 'react';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../axios';
import styles from './AdoptionHistory.module.css';

const AdoptionHistory = () => {
  const { user } = useAuth();
  const [adoptionHistory, setAdoptionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdoptionHistory = async () => {
      try {
        setLoading(true);
        // 실제 API가 있다면 사용, 없다면 더미 데이터로 표시
        // const response = await api.get('/adoption-history');
        // setAdoptionHistory(response.data);
        
        // 임시 더미 데이터
        setAdoptionHistory([
          {
            id: 1,
            animal_name: '몽이',
            animal_species: '개',
            animal_breed: '믹스',
            shelter_name: '서울시 동물보호소',
            application_date: '2024-01-15',
            status: '심사중',
            animal_image: '/images/child-puppy.png'
          },
          {
            id: 2,
            animal_name: '나비',
            animal_species: '고양이',
            animal_breed: '러시안 블루',
            shelter_name: '경기도 동물보호센터',
            application_date: '2024-02-20',
            status: '승인완료',
            animal_image: '/images/child-puppy.png'
          }
        ]);
        
      } catch (err) {
        console.error('입양 내역 조회 실패:', err);
        setError('입양 내역을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAdoptionHistory();
    }
  }, [user]);

  const getStatusStyle = (status) => {
    switch (status) {
      case '심사중':
        return styles.statusPending;
      case '승인완료':
        return styles.statusApproved;
      case '거절':
        return styles.statusRejected;
      default:
        return styles.statusDefault;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>입양 신청 내역을 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>입양 신청 내역</h1>
        <p className={styles.subtitle}>
          {user?.username || user?.name}님의 입양 신청 현황을 확인하세요
        </p>
      </div>

      {adoptionHistory.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🐾</div>
          <h3>입양 신청 내역이 없습니다</h3>
          <p>아직 입양 신청을 하지 않으셨네요.</p>
          <button 
            className={styles.browseButton}
            onClick={() => window.location.href = '/animals'}
          >
            유기동물 둘러보기
          </button>
        </div>
      ) : (
        <div className={styles.historyList}>
          {adoptionHistory.map((application) => (
            <div key={application.id} className={styles.applicationCard}>
              <div className={styles.animalInfo}>
                <div className={styles.animalImage}>
                  <img 
                    src={application.animal_image} 
                    alt={application.animal_name}
                    onError={(e) => {
                      e.target.src = '/images/unknown_animal.png';
                    }}
                  />
                </div>
                <div className={styles.animalDetails}>
                  <h3 className={styles.animalName}>{application.animal_name}</h3>
                  <p className={styles.animalBreed}>
                    {application.animal_species} • {application.animal_breed}
                  </p>
                  <p className={styles.shelterName}>{application.shelter_name}</p>
                </div>
              </div>
              
              <div className={styles.applicationDetails}>
                <div className={styles.applicationDate}>
                  <span className={styles.label}>신청일</span>
                  <span className={styles.date}>
                    {formatDate(application.application_date)}
                  </span>
                </div>
                
                <div className={styles.applicationStatus}>
                  <span 
                    className={`${styles.status} ${getStatusStyle(application.status)}`}
                  >
                    {application.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdoptionHistory;