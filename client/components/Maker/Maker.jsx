import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Maker.module.css';

const Maker = () => {
  const [userImageUrl, setUserImageUrl] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [buttonStyle, setButtonStyle] = useState({});
  const imageContainerRef = useRef(null);
  const navigate = useNavigate();

  // 표에서 동물 이름 가져오기
  const petName = '몽이';

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
    setTimeout(() => {
      setShowLoadingModal(false);
      // URL 파라미터로 데이터 전달
      const params = new URLSearchParams({
        action: action,
        petName: petName,
        resultImage: "https://placehold.co/600x600/f97316/FFFFFF?text=Result+Image"
      });
      navigate(`/maker/result?${params.toString()}`);
    }, 3000);
  };

  return (
    <div className={styles.mainContainer}>

      {/* 선택한 유기동물 이미지 영역 */}
      <div className={styles.petImagePlaceholder}>
        선택한 유기동물 이미지
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
              onClick={() => setShowLoadingModal(false)}
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
              <td className={styles.tableCellKey}>이름</td>
              <td className={styles.tableCellValue}>몽이</td>
            </tr>
            <tr>
              <td className={styles.tableCellKey}>나이</td>
              <td className={styles.tableCellValue}>2살</td>
            </tr>
            <tr>
              <td className={styles.tableCellKey}>성별</td>
              <td className={styles.tableCellValue}>수컷</td>
            </tr>
            <tr>
              <td className={styles.tableCellKey}>보호 시작날짜</td>
              <td className={styles.tableCellValue}>2023-01-15</td>
            </tr>
            <tr>
              <td className={styles.tableCellKey}>특이사항</td>
              <td className={styles.tableCellValue}>사람을 잘 따르며 활발함.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Maker;
