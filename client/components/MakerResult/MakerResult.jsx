import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../axios';
import styles from './MakerResult.module.css';

const MakerResult = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [shelterData, setShelterData] = useState({
    shelter_name: '',
    shelter_address: '',
    shelter_contact_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  
  // URL 파라미터에서 데이터 가져오기
  const action = searchParams.get('action') || 'food';
  const petName = searchParams.get('petName') || '몽이';
  const resultImage = searchParams.get('resultImage') || "https://placehold.co/600x600/f97316/FFFFFF?text=Result+Image";
  
  // AI 합성 결과 데이터
  const breedInfo = searchParams.get('breedInfo') || '';
  const aiPrompt = searchParams.get('aiPrompt') || '';
  const processingTime = searchParams.get('processingTime') || 0;
  const errorMessage = searchParams.get('error') || '';
  
  // 선택된 동물 정보
  const species = searchParams.get('species') || '';
  const gender = searchParams.get('gender') || '';
  const age = searchParams.get('age') || '';
  const colorCd = searchParams.get('colorCd') || '';
  const specialMark = searchParams.get('specialMark') || '';
  const region = searchParams.get('region') || '';
  const rescued_at = searchParams.get('rescued_at') || '';
  const animalId = searchParams.get('animalId') || '';
  const original_image_url = searchParams.get('original_image_url') || '';
  
  // URL에서 가져온 보호소 정보
  const urlShelterName = searchParams.get('shelter_name') || '';
  const urlShelterAddress = searchParams.get('shelter_address') || '';
  const urlShelterContact = searchParams.get('shelter_contact_number') || '';
  
  // 보호소 정보 로드
  useEffect(() => {
    const fetchShelterInfo = async () => {
      // URL 파라미터에 보호소 정보가 있으면 사용
      if (urlShelterName || urlShelterAddress || urlShelterContact) {
        setShelterData({
          shelter_name: urlShelterName,
          shelter_address: urlShelterAddress,
          shelter_contact_number: urlShelterContact
        });
        return;
      }
      
      // 보호소 정보가 없고 animalId가 있으면 API에서 다시 조회
      if (animalId && !urlShelterName) {
        setLoading(true);
        try {
          const response = await api.get(`/animals/${animalId}`);
          const animalData = response.data;
          
          if (animalData && animalData.shelter) {
            setShelterData({
              shelter_name: animalData.shelter.shelter_name || '정보 없음',
              shelter_address: animalData.shelter.address || '정보 없음',
              shelter_contact_number: animalData.shelter.contact_number || '정보 없음'
            });
          }
        } catch (error) {
          console.error('보호소 정보 조회 실패:', error);
          setShelterData({
            shelter_name: '정보 없음',
            shelter_address: '정보 없음',
            shelter_contact_number: '정보 없음'
          });
        } finally {
          setLoading(false);
        }
      } else {
        // 기본값 설정
        setShelterData({
          shelter_name: '정보 없음',
          shelter_address: '정보 없음',
          shelter_contact_number: '정보 없음'
        });
      }
    };
    
    fetchShelterInfo();
  }, [animalId, urlShelterName, urlShelterAddress, urlShelterContact]);

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

  // 보호소 정보 (state에서 가져오기)
  const shelterInfo = {
    보호소명: shelterData.shelter_name || '정보 없음',
    주소: shelterData.shelter_address || '정보 없음',
    연락처: shelterData.shelter_contact_number || '정보 없음'
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
          <h1 className={styles.resultTitle}>
            {errorMessage ? '처리 중 오류가 발생했습니다' : getActionMessage(action)}
            {breedInfo && !errorMessage && <span className={styles.aiLabel}> (AI 생성)</span>}
          </h1>
          {errorMessage && (
            <p className={styles.errorMessage}>{errorMessage}</p>
          )}
          {processingTime > 0 && !errorMessage && (
            <p className={styles.processingInfo}>
              처리 시간: {(processingTime / 1000).toFixed(1)}초
            </p>
          )}
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

        {/* AI 합성 정보 섹션 */}
        {(breedInfo || aiPrompt) && !errorMessage && (
          <div className={styles.aiInfoSection}>
            <h3 className={styles.infoTitle}>AI 합성 정보</h3>
            {breedInfo && (
              <div className={styles.aiInfoBox}>
                <h4 className={styles.aiInfoSubtitle}>견종 인식 결과:</h4>
                <p className={styles.aiInfoText}>{breedInfo}</p>
              </div>
            )}
            {aiPrompt && (
              <div className={styles.aiInfoBox}>
                <h4 className={styles.aiInfoSubtitle}>AI 프롬프트:</h4>
                <details className={styles.promptDetails}>
                  <summary className={styles.promptSummary}>프롬프트 보기</summary>
                  <p className={styles.aiPromptText}>{aiPrompt}</p>
                </details>
              </div>
            )}
          </div>
        )}

        <div className={styles.resultActions}>
          <button 
            className={`${styles.actionButton} ${styles.primary}`}
            onClick={async () => {
              if (!resultImage) {
                return;
              }

              try {
                console.log('이미지 저장 시작:', resultImage);
                
                if (resultImage.startsWith('data:image/')) {
                  // base64 이미지인 경우 다운로드 링크 생성
                  console.log('Base64 이미지 처리 중...');
                  const link = document.createElement('a');
                  link.href = resultImage;
                  link.download = `pawpaw-${action}-${Date.now()}.png`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  console.log('이미지 다운로드 완료');
                } else {
                  // URL 이미지인 경우
                  console.log('URL 이미지 처리 중...', resultImage);
                  
                  // CORS 문제를 피하기 위해 canvas를 사용하여 이미지를 다운로드
                  const img = new Image();
                  img.crossOrigin = 'anonymous';
                  
                  img.onload = function() {
                    try {
                      const canvas = document.createElement('canvas');
                      const ctx = canvas.getContext('2d');
                      
                      canvas.width = img.naturalWidth;
                      canvas.height = img.naturalHeight;
                      
                      ctx.drawImage(img, 0, 0);
                      
                      canvas.toBlob((blob) => {
                        if (blob) {
                          const url = window.URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `pawpaw-${action}-${Date.now()}.png`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          window.URL.revokeObjectURL(url);
                          console.log('이미지 다운로드 완료');
                        } else {
                          throw new Error('Blob 생성 실패');
                        }
                      }, 'image/png');
                    } catch (canvasError) {
                      console.error('Canvas 처리 실패:', canvasError);
                      // Canvas 방법이 실패하면 직접 링크 방법 시도
                      const link = document.createElement('a');
                      link.href = resultImage;
                      link.download = `pawpaw-${action}-${Date.now()}.png`;
                      link.target = '_blank';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      console.log('대체 방법으로 다운로드 시도');
                    }
                  };
                  
                  img.onerror = function() {
                    console.error('이미지 로드 실패');
                    // 이미지 로드가 실패하면 직접 링크 방법 시도
                    const link = document.createElement('a');
                    link.href = resultImage;
                    link.download = `pawpaw-${action}-${Date.now()}.png`;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    console.log('대체 방법으로 다운로드 시도');
                  };
                  
                  img.src = resultImage;
                }
              } catch (error) {
                console.error('이미지 저장 실패:', error);
                // 최종 백업 방법: 새 탭에서 이미지 열기
                try {
                  window.open(resultImage, '_blank');
                  console.log('새 창에서 이미지 열기');
                } catch (fallbackError) {
                  console.error('백업 방법도 실패:', fallbackError);
                }
              }
            }}
            disabled={!resultImage}
          >
            저장하기
          </button>
          <button 
            className={`${styles.actionButton} ${styles.secondary}`}
            onClick={() => setShowImageModal(true)}
          >
            크게 보기
          </button>
          <button 
            className={`${styles.actionButton} ${styles.tertiary}`}
            onClick={() => {
              // 기존 동물 정보를 유지하여 다시 시도
              const animalInfo = {
                species,
                gender,
                age,
                colorCd,
                specialMark,
                region,
                rescued_at,
                animalId,
                shelter_name: urlShelterName || shelterData.shelter_name,
                shelter_address: urlShelterAddress || shelterData.shelter_address,
                shelter_contact_number: urlShelterContact || shelterData.shelter_contact_number,
                image_url: original_image_url || resultImage // 원본 이미지 우선, 없으면 결과 이미지
              };
              
              console.log('다시 시도 버튼 클릭 - 동물 정보:', animalInfo);
              
              // 페이지 이동 시 상단으로 스크롤
              window.scrollTo(0, 0);
              
              navigate('/maker', { 
                state: { 
                  animal: animalInfo 
                } 
              });
            }}
          >
            다시 시도
          </button>
        </div>

        {/* 이미지 모달 */}
        {showImageModal && (
          <div className={styles.modalOverlay} onClick={() => setShowImageModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <button 
                className={styles.modalCloseButton}
                onClick={() => setShowImageModal(false)}
              >
                ×
              </button>
              <img 
                src={resultImage} 
                alt="결과 이미지 크게보기" 
                className={styles.modalImage}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MakerResult;