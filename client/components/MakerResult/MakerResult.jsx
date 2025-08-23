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

  // 동물 정보 (실제로는 API에서 가져올 데이터)
  const petInfo = {
    이름: petName,
    나이: '2살',
    성별: '수컷',
    보호시작날짜: '2023-01-15',
    특이사항: '사람을 잘 따르며 활발함.'
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
          <h1 className={styles.resultTitle}>완료되었습니다!</h1>
          <p className={styles.resultSubtitle}>{getActionMessage(action)}</p>
        </div>
        <div className={styles.resultImageContainer}>
          <img 
            src={resultImage} 
            alt="결과 이미지" 
            className={styles.resultImage}
          />
        </div>

        <div className={styles.resultInfoSection}>
          {/* <h2 className={styles.infoTitle}>반려동물 정보</h2> */}
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
            className={`${styles.actionButton} ${styles.secondary}`}
            onClick={() => {
              alert('공유 기능 준비중입니다!');
            }}
          >
            공유하기
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