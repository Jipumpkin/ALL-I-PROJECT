import React from 'react';
import styles from './LoginModal.module.css';
import { IoClose } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../src/context/AuthContext';

const LoginModal = ({ setIsOpen }) => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  // 페이지 이동 후 모달 닫기
  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  // 로그아웃 처리
  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  return (
    <>
      {/* 모달 뒷 배경 */}
      <div className={styles["modal-overlay"]} onClick={() => setIsOpen(false)}></div>
      
      {/* 모달 컨텐츠 */}
      <div className={styles["modal-content"]}>
        <button className={styles["modal-close-btn"]} onClick={() => setIsOpen(false)}>
          <IoClose />
        </button>
        
        <h2>메뉴</h2>
        
        {isAuthenticated() || true ? (
          // 로그인 상태일 때
          <>
            <div className={styles["user-info"]}>
              <p>안녕하세요, <strong>{user?.name || user?.username}</strong>님!</p>
            </div>
            <div className={styles["menu-buttons"]}>
              <button className={styles["menu-btn"]} onClick={() => handleNavigate('/maker')}>합성하기</button>
              <button className={styles["menu-btn"]} onClick={() => handleNavigate('/animals')}>유기동물</button>
              <button className={styles["menu-btn"]} onClick={() => handleNavigate('/adoption-apply')}>입양 신청하기</button>
              <button className={styles["menu-btn"]} onClick={() => handleNavigate('/my-account')}>마이페이지</button>
              <button className={`${styles["menu-btn"]} ${styles["logout-btn"]}`} onClick={handleLogout}>로그아웃</button>
            </div>
          </>
        ) : (
          // 비로그인 상태일 때
          <>
            <div className={styles["menu-buttons"]}>
              <button className={styles["menu-btn"]} onClick={() => handleNavigate('/login')}>로그인</button>
              <button className={styles["menu-btn"]} onClick={() => handleNavigate('/register')}>회원가입</button>
              <button className={styles["menu-btn"]} onClick={() => handleNavigate('/animals')}>유기동물</button>
            </div>
            
            <div className={styles["modal-links"]}>
              <span onClick={() => handleNavigate('/forgot-id')}>아이디 찾기</span>
              <span onClick={() => handleNavigate('/forgot-password')}>비밀번호 찾기</span>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default LoginModal;
