import React from 'react'
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Title.css'
import '../public/font/font.css'
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
      }, [images.length, isPaused]);
    const nextImage = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
     };

  const goToImage = (index) => {
        setCurrentImageIndex(index);
    };
    return (
    <div className="headline">
        <div
            className="title-section"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <img src={images[currentImageIndex]} alt="Carousel" className="carousel-image" />
            <div className="carousel-dots">
                {images.map((_, index) => (
                    <div
                        key={index}
                        className={`carousel-dot ${index === currentImageIndex ? 'active' : ''}`}
                        onClick={() => goToImage(index)}
                    ></div>
                ))}
            </div>
        </div>
        <nav>
            <ol>
                <li><img src="../public/images/nav_icon_info.png" alt="info"/>
                </li>
                <li><Link to="https://www.animals.or.kr/support/intro"><img src="../public/images/nav_icon_donate.png" alt="info"/>
                    </Link></li>
                <li><Link to="https://kipfri.com/index.php/campaign"><img src="../public/images/nav_icon_campaign.png" alt="info"/>
                    </Link></li>
                <li><Link to="https://likalika.com/"><img src="../public/images/nav_icon_store.png" alt="info"/>
                    </Link></li>
                
            </ol>
        </nav>
    </div>
  )
}

export default Title