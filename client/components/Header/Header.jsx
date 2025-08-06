import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="logo">
        <a href="/">
          <div className="imgFoot">
            <img src="/images/foot.png" alt="로고" width="40" />
          </div>
          <span className="logo-text-front">PAW</span>
          <span className="logo-text-back">PAW</span>
        </a>
      </div>
      <nav className="nav-menu">
        <ul>
        </ul>
      </nav>
    </header>
  );
};

export default Header;