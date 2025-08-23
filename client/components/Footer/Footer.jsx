import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles['footer-content']}>
        <div className={styles['footer-section']}>
          <div className={styles['footer-brand']}>
            <span className={styles['brand-name']}>🐾 PAW PAW</span>
            <p className={styles['brand-desc']}>유기동물과 사람 사이의 따뜻한 연결</p>
          </div>
        </div>
        <div className={styles['footer-section']}>
          <div className={styles['footer-links']}>
            <Link to="/intro" onClick={() => window.scrollTo(0, 0)}>서비스 소개</Link>
            <a href="https://www.animal.go.kr" target="_blank" rel="noopener noreferrer">동물보호관리시스템</a>
            <a href="https://www.animal.go.kr/front/awtis/vworld/vworldMap.do?menuNo=5000000027" target="_blank" rel="noopener noreferrer">입양센터 찾기</a>
          </div>
        </div>
        <div className={styles['footer-section']}>
          <div className={styles['footer-info']}>
            <p className={styles['contact-info']}>📞 상담 문의: 1588-0000</p>
            <p className={styles['contact-info']}>📧 pawpaw.adopt@gmail.com</p>
            <p className={styles['copyright']}>&copy; {new Date().getFullYear()} PAW PAW. 모든 권리 보유.</p>
          </div>
        </div>
      </div>
     
    </footer>
  );
};

export default Footer;