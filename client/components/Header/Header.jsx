import React, { useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import './Header.css';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const nav = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    console.log("toggleMenu");
  };

  const toggleLogin = () => {
    console.log("Login");
    nav("/login");
    setIsMenuOpen(false);
  }
  const toggleJoin = () => {
    console.log("Join");
    nav("/register");
    setIsMenuOpen(false);
  }

  

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
        <div className={`hamburger-menu ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
        </div>
      </header>
      {/* <div className="header-background"></div> */}
      <nav className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <ul style={{display:'flex', flexDirection:'column'}}>
            <li><a href="#" onClick={toggleLogin}>로그인</a></li>
            <li><a href="#" onClick={toggleJoin}>회원가입</a></li>
          </ul>
        </nav>
    </>
  );
};

export default Header;
