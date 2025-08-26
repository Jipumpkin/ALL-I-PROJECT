import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './AnimalDetail.module.css';
import { useAuth } from '../../src/context/AuthContext';

const AnimalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const [animal, setAnimal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnimal = async () => {
      try {
        const response = await axios.get(`/api/animals/${id}`);
        setAnimal(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnimal();
  }, [id]);

  const handleMakerClick = () => {
    if (auth.isAuthenticated()) {
      navigate('/maker', { state: { animal: animal } });
    } else {
      navigate('/login');
    }
  };

  const handleAdoptionApplyClick = () => {
    if (auth.isAuthenticated()) {
      navigate(`/adoption-apply`, { state: { animal: animal } });
    } else {
      navigate('/login');
    }
  };

  if (loading) {
    return <div className={styles.container}><p>로딩 중...</p></div>;
  }

  if (error) {
    return <div className={styles.container}><p>오류 발생: {error.message}</p></div>;
  }

  if (!animal) {
    return <div className={styles.container}><p>동물 정보를 찾을 수 없습니다.</p></div>;
  }

  const genderMap = {
    male: '수컷',
    female: '암컷',
    unknown: '불명'
  };

  const formatDate = (dateString) => {
    if (!dateString) return '정보 없음';
    try {
      const date = new Date(dateString);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return dateString; // Return original string if date is invalid
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString; // Return original string in case of an error
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.profileSection}>
        <img src={animal.image_url} alt={animal.species} className={styles.animalImage} onError={(e) => { e.target.src = '/images/unknown_animal.png'; }} />
      </div>

      <div className={styles.infoWrapper}>
        <div className={styles.infoTable}>
          <div className={styles.infoRow}>
            <div className={styles.infoLabel}>품종</div>
            <div className={styles.infoValue}>{animal.species}</div>
          </div>
          <div className={styles.infoRow}>
            <div className={styles.infoLabel}>성별</div>
            <div className={styles.infoValue}>{genderMap[animal.gender] || '정보 없음'}</div>
          </div>
          <div className={styles.infoRow}>
            <div className={styles.infoLabel}>출생년도</div>
            <div className={styles.infoValue}>{animal.age}</div>
          </div>
          <div className={styles.infoRow}>
            <div className={styles.infoLabel}>색상</div>
            <div className={styles.infoValue}>{animal.colorCd || '정보 없음'}</div>
          </div>
          <div className={styles.infoRow}>
            <div className={styles.infoLabel}>특이사항</div>
            <div className={styles.infoValue}>{animal.specialMark || '없음'}</div>
          </div>
          <div className={styles.infoRow}>
            <div className={styles.infoLabel}>구조 지역</div>
            <div className={styles.infoValue}>{animal.region}</div>
          </div>
          <div className={styles.infoRow}>
            <div className={styles.infoLabel}>구조 일자</div>
            <div className={styles.infoValue}>{formatDate(animal.rescued_at)}</div>
          </div>
        </div>

        <hr className={styles.divider} />

        <div className={styles.infoTable}>
          <h3 className={styles.tableTitle}>보호소 정보</h3>
          <div className={styles.infoRow}>
            <div className={styles.infoLabel}>보호소 이름</div>
            <div className={styles.infoValue}>
              {animal.shelter?.shelter_name || '정보 없음'}
              {animal.shelter?.shelter_name && (
                <a 
                  href={`https://www.google.com/search?q=${encodeURIComponent(animal.shelter.shelter_name)}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.shortcutButton}
                >
                  &#x2197; {/* Replace "바로가기" with the arrow icon */}
                </a>
              )}
            </div>
          </div>
          <div className={styles.infoRow}>
            <div className={styles.infoLabel}>주소</div>
            <div className={styles.infoValue}>{animal.shelter?.address || '정보 없음'}</div>
          </div>
          <div className={styles.infoRow}>
            <div className={styles.infoLabel}>연락처</div>
            <div className={styles.infoValue}>{animal.shelter?.contact_number || '정보 없음'}</div>
          </div>
        </div>
      </div>

      <div className={styles.buttonContainer}>
        <button className={styles.actionButton} onClick={handleMakerClick}>
          이미지 합성
        </button>
        <button className={styles.actionButton} onClick={handleAdoptionApplyClick}>
          입양 신청하기
        </button>
      </div>
    </div>
  );
};

export default AnimalDetail;
