import React from 'react';
import './LoginModal.css';
import { IoClose } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

const LoginModal = ({ setIsOpen }) => {
  const navigate = useNavigate();

  // 페이지 이동 후 모달 닫기
  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* 모달 뒷 배경 */}
      <div className="modal-overlay" onClick={() => setIsOpen(false)}></div>
      
      {/* 모달 컨텐츠 */}
      <div className="modal-content">
        <button className="modal-close-btn" onClick={() => setIsOpen(false)}>
          <IoClose />
        </button>
        
        <h2>로그인</h2>
        
        <div className="login-form">
          <input type="text" placeholder="아이디를 입력하세요" />
          <input type="password" placeholder="비밀번호를 입력하세요" />
          <button className="login-btn">로그인</button>
        </div>
        
        <div className="modal-links">
          <span onClick={() => handleNavigate('/register')}>회원가입</span>
          <span onClick={() => handleNavigate('/forgot-id')}>아이디 찾기</span>
          <span onClick={() => handleNavigate('/forgot-password')}>비밀번호 찾기</span>
        </div>
      </div>
    </>
  );
};

export default LoginModal;
