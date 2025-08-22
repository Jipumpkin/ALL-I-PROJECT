import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './AnimalDetail.module.css';

const AnimalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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

  const handleImageUploadClick = () => {
    navigate('/image-uploader');
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

  return (
    <div className={styles.container}>
      <div className={styles.profileSection}>
        <img src={animal.image_url} alt={animal.species} className={styles.profileImage} />
      </div>
      <div className={styles.infoSection}>
        <p><strong>품종:</strong> {animal.species}</p>
        <p><strong>성별:</strong> {genderMap[animal.gender] || '정보 없음'}</p>
        <p><strong>나이:</strong> {animal.age}</p>
        <p><strong>색상:</strong> {animal.colorCd || '정보 없음'}</p>
        <p><strong>특이사항:</strong> {animal.specialMark || '없음'}</p>
        <p><strong>구조 지역:</strong> {animal.region}</p>
        <p><strong>구조 일자:</strong> {animal.rescued_at}</p>
        {/* 추가 정보가 있다면 여기에 나열 */}
      </div>
      <hr className={styles.divider} />
      <div className={styles.shelterInfoSection}>
        <h3>보호소 정보</h3>
        <p><strong>보호소 이름:</strong> {animal.shelter_name || '정보 없음'}</p>
        <p><strong>주소:</strong> {animal.shelter_address || '정보 없음'}</p>
        <p><strong>연락처:</strong> {animal.shelter_contact_number || '정보 없음'}</p>
      </div>
      <button className={styles.uploadButton}>
        이미지 합성
      </button>
    </div>
  );
};

export default AnimalDetail;