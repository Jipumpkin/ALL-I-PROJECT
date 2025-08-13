import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../src/context/AuthContext';
import styles from './AdoptionHistory.module.css';

const AdoptionHistory = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [adoptionList, setAdoptionList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    // 임시 데이터 (추후 API 연동)
    const mockData = [
      {
        id: 1,
        animalName: '바둑이',
        animalType: '강아지',
        breed: '골든리트리버',
        applicationDate: '2024-01-15',
        status: '승인됨',
        shelterName: '서울시 동물보호센터',
        age: '2세',
        imageUrl: '/images/dog1.jpg'
      },
      {
        id: 2,
        animalName: '나비',
        animalType: '고양이',
        breed: '페르시안',
        applicationDate: '2024-02-20',
        status: '검토중',
        shelterName: '부산시 동물보호센터',
        age: '1세',
        imageUrl: '/images/cat1.jpg'
      },
      {
        id: 3,
        animalName: '콩이',
        animalType: '강아지',
        breed: '비글',
        applicationDate: '2024-03-10',
        status: '거절됨',
        shelterName: '대구시 동물보호센터',
        age: '3세',
        imageUrl: '/images/dog2.jpg'
      }
    ];

    setTimeout(() => {
      setAdoptionList(mockData);
      setLoading(false);
    }, 1000);
  }, [isAuthenticated, navigate]);

  const getStatusColor = (status) => {
    switch (status) {
      case '승인됨':
        return styles.approved;
      case '검토중':
        return styles.pending;
      case '거절됨':
        return styles.rejected;
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <h2>입양 신청 내역을 불러오는 중...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>입양 신청 내역</h2>
        <button onClick={() => navigate('/my-account')} className={styles.backButton}>
          마이메뉴로 돌아가기
        </button>
      </div>

      {adoptionList.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>입양 신청 내역이 없습니다</h3>
          <p>아직 입양 신청을 하지 않으셨군요.</p>
          <button onClick={() => navigate('/')} className={styles.browseButton}>
            동물 둘러보기
          </button>
        </div>
      ) : (
        <div className={styles.adoptionList}>
          {adoptionList.map((adoption) => (
            <div key={adoption.id} className={styles.adoptionCard}>
              <div className={styles.cardHeader}>
                <h3>{adoption.animalName}</h3>
                <span className={`${styles.status} ${getStatusColor(adoption.status)}`}>
                  {adoption.status}
                </span>
              </div>
              
              <div className={styles.cardContent}>
                <div className={styles.animalInfo}>
                  <p><strong>종류:</strong> {adoption.animalType}</p>
                  <p><strong>품종:</strong> {adoption.breed}</p>
                  <p><strong>나이:</strong> {adoption.age}</p>
                  <p><strong>보호소:</strong> {adoption.shelterName}</p>
                </div>
                
                <div className={styles.applicationInfo}>
                  <p><strong>신청일:</strong> {adoption.applicationDate}</p>
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