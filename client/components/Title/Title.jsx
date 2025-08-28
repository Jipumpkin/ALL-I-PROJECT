import React from 'react'
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Title.module.css'
import '../../src/assets/font.css'
const Title = () => {
    const images = [
        '/images/poster1.png',
        '/images/poster2.png',
        '/images/poster3.png',
        '/images/poster4.png',
        '/images/poster5.png',
        '/images/poster6.png',

    ];
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    useEffect(() => {
        if (isPaused) return;
    
        const interval = setInterval(() => {
          setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 3000); // Change image every 3 seconds
    
        return () => clearInterval(interval);
      }, [isPaused, images.length]);
    // const nextImage = () => {
    //     setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    //  };

  const goToImage = (index) => {
        setCurrentImageIndex(index);
    };

    const prevImage = () => {
        setCurrentImageIndex((prevIndex) => 
            prevIndex === 0 ? images.length - 1 : prevIndex - 1
        );
    };

    const nextImage = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    };
    return (
    <div className={styles['headline']}>
        <div className={styles["title-section"]} onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
            <img src={images[currentImageIndex]} alt="Carousel" className={styles["carousel-image"]} />
            <button className={`${styles["carousel-arrow"]} ${styles["left"]}`} onClick={prevImage}>
                &#8249;
            </button>
            <button className={`${styles["carousel-arrow"]} ${styles["right"]}`} onClick={nextImage}>
                &#8250;
            </button>
        </div>
        <nav className={styles["nav"]}>
            <ol>
                <li>
                    <Link to="/intro" onClick={() => window.scrollTo(0, 0)}><img src="..\images\query.png" alt="info"/></Link>
                    소개
                </li>
                <li><Link to="https://www.animals.or.kr/support/intro"><img src="..\images\high_priority.png" alt="info"/>
                    </Link>
                    소식
                </li>
                <li><Link to="https://kipfri.com/index.php/campaign"><img src="..\images\web_advertising.png" alt="info"/>
                    </Link>
                    캠페인
                </li>
                <li><Link to="https://likalika.com/"><img src="..\images\shopping_basket.png" alt="info"/>
                    </Link>
                    반려동물용품샵
                </li>
                
            </ol>
        </nav>
    </div>
  )
}

export default Title