import React from 'react'
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Title.module.css'
import '../../public/font/font.css'
const Title = () => {
    const images = [
        '/images/poster1.jpg',
        '/images/poster2.jpg',
        '/images/poster4.jpg',
        '/images/poster5.jpg',
        '/images/poster6.jpg',
        '/images/hoochoo1.jpeg',

    ];
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    useEffect(() => {
        if (isPaused) return;
    
        const interval = setInterval(() => {
          setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 3000); // Change image every 3 seconds
    
        return () => clearInterval(interval);
      }, [isPaused]);
    const nextImage = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
     };

  const goToImage = (index) => {
        setCurrentImageIndex(index);
    };
    return (
    <div className={styles['headline']}>
        <div className={styles["title-section"]} onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
            <img src={images[currentImageIndex]} alt="Carousel" className={styles["carousel-image"]} />
            <div className={styles["carousel-dots"]}>
                {images.map((_, index) => (
                    <div
                        key={index}
                        className={`${styles["carousel-dot"]} ${index === currentImageIndex ? styles['active'] : ''}`}
                        onClick={() => goToImage(index)}
                    ></div>
                ))}
            </div>
        </div>
        <nav className={styles["nav"]}>
            <ol>
                <li>
                    <Link to="https://www.animals.or.kr/support/intro"><img src="../images/nav_icon_info.png" alt="info"/></Link>
                    소개
                </li>
                <li><Link to="https://www.animals.or.kr/support/intro"><img src="../images/nav_icon_donate.png" alt="info"/>
                    </Link>
                    소식
                </li>
                <li><Link to="https://kipfri.com/index.php/campaign"><img src="../images/nav_icon_campaign.png" alt="info"/>
                    </Link>
                    캠페인
                </li>
                <li><Link to="https://likalika.com/"><img src="../images/nav_icon_store.png" alt="info"/>
                    </Link>
                    애견샵
                </li>
                
            </ol>
        </nav>
    </div>
  )
}

export default Title