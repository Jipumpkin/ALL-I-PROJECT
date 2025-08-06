import React, { useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);


  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <header className="header">
        <div className="logo">
          <a href="/">
            <div className="imgFoot">
            <img src="/images/foot.png" alt="로고" width="40" />
            </div>
            <span style={{color:'#EEDC52'}} className="logo-text">PAW </span>
            <span style={{color:'#30CDB0'}} className="logo-text">PAW </span>

          </a>
        </div>
        <div className={`hamburger-menu ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
        </div>
      </header>
      {/* <div className="header-background"></div> */}
      <nav className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <ul style={{display:'flex', flexDirection:'column'}}>
            <li><a href="#" onClick={toggleMenu}>로그인</a></li>
            <li><a href="#" onClick={toggleMenu}>회원가입</a></li>
          </ul>
        </nav>
    </>
  );
};

export default Header;
