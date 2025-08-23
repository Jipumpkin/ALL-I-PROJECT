import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../axios';
import styles from './Maker.module.css';

const Maker = () => {
  const [userImageUrl, setUserImageUrl] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [buttonStyle, setButtonStyle] = useState({});
  const [userRegistrationImage, setUserRegistrationImage] = useState(null);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const imageContainerRef = useRef(null);
  const timerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // 사용자 등록 이미지 가져오기
  const fetchUserRegistrationImage = async () => {
    // user.id 또는 user.user_id 확인
    const userId = user?.id || user?.user_id;
    if (userId) {
      try {
        const response = await fetch(`http://localhost:3003/api/users/${userId}/images`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.length > 0) {
            // 가장 최근에 업로드한 이미지 사용
            setUserRegistrationImage(data.data[0].image_url);
          }
        }
      } catch (error) {
        console.error('사용자 이미지 가져오기 실패:', error);
      }
    }
  };

  // 성별 매핑 함수
  const getGenderText = (gender) => {
    const genderMap = { 
      male: '수컷', 
      female: '암컷', 
      unknown: '불명' 
    };
    return genderMap[gender] || gender;
  };

  // 날짜 포맷 함수
  const formatDate = (dateString) => {
    if (!dateString) return '정보 없음';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { height } = entry.contentRect;
        setButtonStyle({
          height: `${height / 5}px`,
          padding: '0.25rem'
        });
      }
    });

    if (imageContainerRef.current) {
      observer.observe(imageContainerRef.current);
    }

    // 컴포넌트 마운트 시 사용자 등록 이미지 가져오기
    fetchUserRegistrationImage();

    // URL 파라미터에서 선택된 동물 ID 확인
    const searchParams = new URLSearchParams(location.search);
    const animalId = searchParams.get('animalId');
    
    if (animalId) {
      // 특정 동물 정보 가져오기
      const fetchSelectedAnimal = async () => {
        try {
          const response = await api.get(`/api/animals/${animalId}`);
          if (response.data) {
            setSelectedAnimal(response.data);
            // 선택된 동물의 이미지를 사용자 이미지로도 자동 설정
            if (response.data.image_url) {
              setUserImageUrl(response.data.image_url);
            }
          }
        } catch (error) {
          console.error('선택된 동물 정보 가져오기 실패:', error);
        }
      };
      fetchSelectedAnimal();
    }

    return () => {
      if (imageContainerRef.current) {
        observer.unobserve(imageContainerRef.current);
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [user, location]);

  // Function to handle image change
  const handleImageChange = (url) => {
    setUserImageUrl(url);
    setShowModal(false);
  };

  // Function to handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        handleImageChange(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 아이콘 클릭 핸들러
  const handleIconClick = (action) => {
    if (!selectedAnimal) {
      alert('유기동물 목록에서 동물을 선택하고 오세요!');
      return;
    }

    const petName = selectedAnimal.species || '동물';
    let message = '';
    switch (action) {
      case 'food':
        message = `${petName}\n밥 먹는 중\n조금만 기다려주세요!`;
        break;
      case 'shower':
        message = `${petName}\n목욕 하는 중\n조금만 기다려주세요!`;
        break;
      case 'grooming':
        message = `${petName}\n미용 하는 중\n조금만 기다려주세요!`;
        break;
      default:
        message = '처리 중입니다...';
    }
    
    setLoadingMessage(message);
    setShowLoadingModal(true);
    
    // 3초 후 로딩 모달 닫고 결과 페이지로 이동
    timerRef.current = setTimeout(() => {
      setShowLoadingModal(false);
      // URL 파라미터로 데이터 전달
      const params = new URLSearchParams({
        action: action,
        petName: petName,
        resultImage: selectedAnimal.image_url || "https://placehold.co/600x600/f97316/FFFFFF?text=Result+Image"
      });
      navigate(`/maker/result?${params.toString()}`);
    }, 3000);
  };

  const handleCancelLoading = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setShowLoadingModal(false);
  };

  const genderMap = {
    male: '수컷',
    female: '암컷',
    unknown: '불명'
  };

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
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  return (
    <div className={styles.mainContainer}>

      {/* 선택한 유기동물 이미지 영역 */}
      <div className={styles.petImagePlaceholder}>
        {selectedAnimal ? (
          <img 
            src={selectedAnimal.image_url} 
            alt={selectedAnimal.species}
            className={styles.petImage}
            onError={(e) => { e.target.src = '/images/unknown_animal.png'; }}
          />
        ) : (
          <div className={styles.placeholderText}>
            유기동물을 선택하여 합성하기를 시작하세요
          </div>
        )}
      </div>

      {/* 아이콘 버튼 3개 */}
      <div className={styles.iconButtonsContainer}>
        <button className={styles.iconButton} style={buttonStyle} onClick={() => handleIconClick('food')}>
          <img src="/images/Bob.png" alt="dog icon" style={{ width: '95%', height: '95%', objectFit: 'contain' }} />
        </button>
        <button className={styles.iconButton} style={buttonStyle} onClick={() => handleIconClick('shower')}> 
          <img src="/images/ShowerBut.png" alt="shower icon"
          style={{width:"95%", height:"95%", objectFit:"contain"}}/>
        </button>
        <button className={styles.iconButton} style={buttonStyle} onClick={() => handleIconClick('grooming')}> 
          <img src="/images/pretty.png" alt="grooming icon"
          style={{width:"95%", height:"95%", objectFit:"contain"}} />
        </button>
      </div>

      {/* 사용자 이미지 영역 */}
      <div
        ref={imageContainerRef}
        className={styles.userImageContainer}
        onClick={() => setShowModal(true)}
      >
        {userImageUrl ? (
          <img src={userImageUrl} alt="사용자 이미지" className={styles.userImage} />
        ) : (
          <span className={styles.userImageText}>사용자 이미지</span>
        )}
      </div>

      {/* 이미지 변경 옵션 모달 */}
      {showModal && (
        <div className={styles.imageModalOverlay}>
          <div className={styles.imageModal}>
            <h3 className={styles.modalTitle}>프로필 이미지 변경</h3>
            <button
              className={`${styles.modalOptionButton} ${styles.primary}`}
              onClick={() => {
                if (userRegistrationImage) {
                  handleImageChange(userRegistrationImage);
                } else {
                  alert('회원가입 시 등록한 이미지가 없습니다.');
                }
              }}
              disabled={!userRegistrationImage}
            >
              회원가입 시 넣은 이미지
              {!userRegistrationImage && ' (없음)'}
            </button>
            <label className={`${styles.modalOptionButton} ${styles.secondary}`}>
              새로운 이미지 넣기
              <input type="file" accept="image/*" style={{display: 'none'}} onChange={handleFileUpload} />
            </label>
            <button
              className={`${styles.modalOptionButton} ${styles.tertiary}`}
              onClick={() => handleImageChange("https://placehold.co/400x400/33A3FF/FFFFFF?text=Default+Image")}
            >
              기본 이미지 넣기
            </button>
            <button className={styles.modalCloseButton} onClick={() => setShowModal(false)}>
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 로딩 모달 */}
      {showLoadingModal && (
        <div className={styles.loadingModalOverlay}>
          <div className={styles.loadingModal}>
            <button 
              className={styles.loadingCloseButton} 
              onClick={handleCancelLoading}
            >
              ×
            </button>
            <div className={styles.loadingSpinner}></div>
            <div className={styles.loadingMessage}>
              {loadingMessage.split('\n').map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 유기동물 정보 테이블 */}
      <div className={styles.infoTableContainer}>
        <table className={styles.infoTable}>
          <thead>
            <tr>
              <th className={styles.tableHeader}>목록</th>
              <th className={styles.tableHeader}>내용</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={styles.tableCellKey}>품종</td>
              <td className={styles.tableCellValue}>
                {selectedAnimal ? selectedAnimal.species : '동물을 선택해주세요'}
              </td>
            </tr>
            <tr>
              <td className={styles.tableCellKey}>성별</td>
              <td className={styles.tableCellValue}>
                {selectedAnimal ? getGenderText(selectedAnimal.gender) : '-'}
              </td>
            </tr>
            <tr>
              <td className={styles.tableCellKey}>나이</td>
              <td className={styles.tableCellValue}>
                {selectedAnimal ? selectedAnimal.age : '-'}
              </td>
            </tr>
            <tr>
              <td className={styles.tableCellKey}>색상</td>
              <td className={styles.tableCellValue}>
                {selectedAnimal ? (selectedAnimal.colorCd || '정보 없음') : '-'}
              </td>
            </tr>
            <tr>
              <td className={styles.tableCellKey}>특이사항</td>
              <td className={styles.tableCellValue}>
                {selectedAnimal ? (selectedAnimal.specialMark || '정보 없음') : '-'}
              </td>
            </tr>
            <tr>
              <td className={styles.tableCellKey}>구조 지역</td>
              <td className={styles.tableCellValue}>
                {selectedAnimal ? selectedAnimal.region : '-'}
              </td>
            </tr>
            <tr>
              <td className={styles.tableCellKey}>구조 일자</td>
              <td className={styles.tableCellValue}>
                {selectedAnimal ? formatDate(selectedAnimal.rescued_at) : '-'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Maker;