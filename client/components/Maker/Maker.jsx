import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Maker.module.css';

const Maker = () => {
  const [userImageUrl, setUserImageUrl] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [buttonStyle, setButtonStyle] = useState({});
  const imageContainerRef = useRef(null);
  const timerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const animal = location.state?.animal;

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

    return () => {
      if (imageContainerRef.current) {
        observer.unobserve(imageContainerRef.current);
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

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
    let message = '처리 중입니다...\n조금만 기다려주세요!';
    
    setLoadingMessage(message);
    setShowLoadingModal(true);
    
    // 3초 후 로딩 모달 닫고 결과 페이지로 이동
    timerRef.current = setTimeout(() => {
      setShowLoadingModal(false);
      // URL 파라미터로 데이터 전달
      const params = new URLSearchParams({
        action: action,
        petName: animal?.species || '유기동물',
        resultImage: "https://placehold.co/600x600/f97316/FFFFFF?text=Result+Image"
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
        {animal ? (
          <img src={animal.image_url} alt={animal.species} className={styles.petImage} />
        ) : (
          '선택한 유기동물 이미지'
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
              onClick={() => handleImageChange("https://placehold.co/400x400/FF5733/FFFFFF?text=Saved+Image")}
            >
              회원가입 시 넣은 이미지
            </button>
            <label className={`${styles.modalOptionButton} ${styles.secondary}`}>
              새로운 이미지 넣기
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
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
        {animal ? (
          <table className={styles.infoTable}>
            <tbody>
              <tr>
                <td className={styles.tableCellKey}>출생년도</td>
                <td className={styles.tableCellValue}>{animal.age}</td>
              </tr>
              <tr>
                <td className={styles.tableCellKey}>성별</td>
                <td className={styles.tableCellValue}>{genderMap[animal.gender] || '정보 없음'}</td>
              </tr>
              <tr>
                <td className={styles.tableCellKey}>보호 시작날짜</td>
                <td className={styles.tableCellValue}>{formatDate(animal.rescued_at)}</td>
              </tr>
              <tr>
                <td className={styles.tableCellKey}>특이사항</td>
                <td className={styles.tableCellValue}>{animal.specialMark || '없음'}</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <p>표시할 동물 정보가 없습니다.</p>
        )}
      </div>
    </div>
  );
};



export default Maker;
