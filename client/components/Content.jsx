import React, { useState, useEffect, useRef } from 'react';
import './Content.css';
import ImageCompareSlider from './ImageCompareSlider';

const Content = ({children}) => {
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
  const fileInputRef1 = useRef(null);
  const fileInputRef2 = useRef(null);
  const [uploadedImage1, setUploadedImage1] = useState(null);
  const [uploadedImage2, setUploadedImage2] = useState(null);

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

  const handleFileButtonClick = (ref) => {
    ref.current.click();
  };

  const handleFileChange = (event, setImage) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (event, setImage) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const clearImage = (setImage) => {
    setImage(null);
  };

  return (
    <div className="content-container">
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


      <div className="upload-section">
        <div
          className="upload-box upload-file-box"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, setUploadedImage1)}
        >
          {uploadedImage1 ? (
            <>
              <img src={uploadedImage1} alt="Uploaded" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button className="clear-image-button" onClick={() => clearImage(setUploadedImage1)}>X</button>
            </>
          ) : (
            <>
              <p>(드래그하여 넣기)</p>
              <img src="/images/upload.png" alt="업로드 아이콘" />
              <p>또는</p>
              <button onClick={() => handleFileButtonClick(fileInputRef1)}> 파일열기</button>
            </>
          )}
          <input type="file" ref={fileInputRef1} style={{display:'none'}} onChange={(e) => handleFileChange(e, setUploadedImage1)} />
        </div>
        <div
          className="upload-box upload-file-box"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, setUploadedImage2)}
        >
          {uploadedImage2 ? (
            <>
              <img src={uploadedImage2} alt="Uploaded" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button className="clear-image-button" onClick={() => clearImage(setUploadedImage2)}>X</button>
            </>
          ) : (
            <>
              <p>(드래그하여 넣기)</p>
              <img src="/images/upload.png" alt="업로드 아이콘" />
              <p>또는</p>
              <button onClick={() => handleFileButtonClick(fileInputRef2)}> 파일열기</button>
            </>
          )}
          <input type="file" ref={fileInputRef2} style={{display:'none'}} onChange={(e) => handleFileChange(e, setUploadedImage2)} />
        </div>
      </div>
      
      <div className="info-list-section">
        <h3>유기동물 정보 리스트</h3>
        <div className="info-list">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="info-item">
              <img src="/images/bone.png" alt={`정보 ${index + 1}`} />
            </div>
          ))}
        </div>
      </div>
      <ImageCompareSlider></ImageCompareSlider>
      
    </div>
  );
};

export default Content;
