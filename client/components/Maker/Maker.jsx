import { useState, useRef, useEffect } from 'react';
import styles from './Maker.module.css';

const Maker = () => {
  const [userImageUrl, setUserImageUrl] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [buttonStyle, setButtonStyle] = useState({});
  const imageContainerRef = useRef(null);

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

  return (
    <div className={styles.mainContainer}>

      {/* 선택한 유기동물 이미지 영역 */}
      <div className={styles.petImagePlaceholder}>
        선택한 유기동물 이미지
      </div>

      {/* 아이콘 버튼 3개 */}
      <div className={styles.iconButtonsContainer}>
        <button className={styles.iconButton} style={buttonStyle}>
          <img src="/images/maker1.png" alt="dog icon" style={{ width: '95%', height: '95%', objectFit: 'contain' }} />
        </button>
        <button className={styles.iconButton} style={buttonStyle}>
          <i className="fa-solid fa-paw text-2xl"></i>
        </button>
        <button className={styles.iconButton} style={buttonStyle}>
          <i className="fa-solid fa-ruler-horizontal text-2xl"></i>
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
