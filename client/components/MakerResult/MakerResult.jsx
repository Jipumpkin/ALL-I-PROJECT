import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './MakerResult.module.css';

const MakerResult = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // URL 파라미터에서 데이터 가져오기
  const action = searchParams.get('action') || 'food';
  const petName = searchParams.get('petName') || '몽이';
  const resultImage = searchParams.get('resultImage') || "https://placehold.co/600x600/f97316/FFFFFF?text=Result+Image";
  
  // 선택된 동물 정보
  const species = searchParams.get('species') || '';
  const gender = searchParams.get('gender') || '';
  const age = searchParams.get('age') || '';
  const colorCd = searchParams.get('colorCd') || '';
  const specialMark = searchParams.get('specialMark') || '';
  const region = searchParams.get('region') || '';
  const rescued_at = searchParams.get('rescued_at') || '';
  const shelter_name = searchParams.get('shelter_name') || '';
  const shelter_address = searchParams.get('shelter_address') || '';
  const shelter_contact_number = searchParams.get('shelter_contact_number') || '';

  // 성별 매핑
  const genderMap = {
    male: '수컷',
    female: '암컷',
    unknown: '불명'
  };

  // 날짜 포맷
  const formatDate = (dateString) => {
    if (!dateString) return '정보 없음';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      return dateString;
    }
  };

  // 동물 정보 (URL 파라미터에서 가져온 실제 데이터)
  const petInfo = {
    품종: species || '정보 없음',
    성별: genderMap[gender] || '정보 없음',
    출생년도: age || '정보 없음',
    색상: colorCd || '정보 없음',
    특이사항: specialMark || '없음',
    구조지역: region || '정보 없음',
    구조일자: formatDate(rescued_at) || '정보 없음'
  };

  // 보호소 정보
  const shelterInfo = {
    보호소명: shelter_name || '정보 없음',
    주소: shelter_address || '정보 없음',
    연락처: shelter_contact_number || '정보 없음'
  };

  const getActionMessage = (action) => {
    switch (action) {
      case 'food':
        return '맛있게 밥을 먹었어요';
      case 'shower':
        return '깨끗하게 목욕했어요';
      case 'grooming':
        return '예쁘게 미용했어요';
      default:
        return '완료되었어요';
    }
  };

  return (
    <div className={styles.body}>
      <div className={styles.resultContainer}>
        <div className={styles.resultHeader}>
          <h1 className={styles.resultTitle}>{getActionMessage(action)}</h1>
        </div>
        <div className={styles.resultImageContainer}>
          <img 
            src={resultImage} 
            alt="결과 이미지" 
            className={styles.resultImage}
          />
        </div>

        <div className={styles.resultInfoSection}>
          <h3 className={styles.infoTitle}>동물 정보</h3>
          <div className={styles.infoTableContainer}>
            <table className={styles.infoTable}>
              <thead>
                <tr>
                  <th className={styles.tableHeader}>목록</th>
                  <th className={styles.tableHeader}>내용</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(petInfo).map(([key, value]) => (
                  <tr key={key}>
                    <td className={styles.tableCellKey}>{key}</td>
                    <td className={styles.tableCellValue}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <h3 className={styles.infoTitle}>보호소 정보</h3>
          <div className={styles.infoTableContainer}>
            <table className={styles.infoTable}>
              <thead>
                <tr>
                  <th className={styles.tableHeader}>목록</th>
                  <th className={styles.tableHeader}>내용</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(shelterInfo).map(([key, value]) => (
                  <tr key={key}>
                    <td className={styles.tableCellKey}>{key}</td>
                    <td className={styles.tableCellValue}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.resultActions}>
          <button 
            className={`${styles.actionButton} ${styles.primary}`}
            onClick={() => {
              alert('이미지가 저장되었습니다!');
            }}
          >
            저장하기
          </button>
          <button 
            className={`${styles.actionButton} ${styles.tertiary}`}
            onClick={() => navigate('/maker')}
          >
            다시 시도
          </button>
        </div>
      </div>
    </div>
  );
};

export default MakerResult;