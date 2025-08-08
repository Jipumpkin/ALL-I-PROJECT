import React, { useState } from 'react';
import './Header.css';
import LoginModal from '../LoginModal/LoginModal'; // LoginModal 컴포넌트 import

const Header = () => {
  const [isModalOpen, setIsModalOpen] = useState(false); // 모달 상태 관리

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  return (
    <>
      <header className="header">
        <div className="logo">
          <a href="/">
            <div className="imgFoot">
              <img src="/images/foot.png" alt="로고" width="40" />
            </div>
            <span className="logo-text">PAW </span>
            <span className="logo-text">PAW </span>
          </a>
        </div>
        {/* 햄버거 메뉴 클릭 시 모달 토글 */}
        <div className={`hamburger-menu ${isModalOpen ? 'active' : ''}`} onClick={toggleModal}>
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
        </div>
      </header>

      {/* isModalOpen이 true일 때 LoginModal 렌더링 */}
      {isModalOpen && <LoginModal setIsOpen={setIsModalOpen} />}
    </>
  );
};

export default Header;
