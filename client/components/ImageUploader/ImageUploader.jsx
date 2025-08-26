import React, { useState, useRef } from 'react';
import styles from './ImageUploader.module.css'; // 아래 CSS 파일을 import

const ImageUploader = ({ onImagesChange }) => {
  const [images, setImages] = useState([]); // { id, src }
  const [selectedImage, setSelectedImage] = useState(null);
  const dropRef = useRef(null);

  const handleFiles = (files) => {
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    );

    const newImages = imageFiles.map((file) => {
      const id = URL.createObjectURL(file);
      return { id, src: id };
    });

    setImages((prev) => {
      const updatedImages = [...prev, ...newImages];
      // 부모 컴포넌트에 이미지 변경 알림
      if (onImagesChange) {
        onImagesChange(updatedImages);
      }
      return updatedImages;
    });
  };

  const handleFileChange = (e) => {
    handleFiles(e.target.files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    handleFiles(e.dataTransfer.files);

    dropRef.current.classList.remove('drag-over');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropRef.current.classList.add('drag-over');
  };

  const handleDragLeave = () => {
    dropRef.current.classList.remove('drag-over');
  };

  const handleRemove = (id) => {
    setImages((prev) => {
      const updatedImages = prev.filter((img) => img.id !== id);
      // 부모 컴포넌트에 이미지 변경 알림
      if (onImagesChange) {
        onImagesChange(updatedImages);
      }
      return updatedImages;
    });
    // 선택된 이미지가 삭제된 경우 선택 해제
    if (selectedImage?.id === id) {
      setSelectedImage(null);
    }
    URL.revokeObjectURL(id);
  };

  const handleImageSelect = (image) => {
    setSelectedImage(image);
  };

  const handleApply = () => {
    if (selectedImage && onImagesChange) {
      // 선택된 이미지를 부모 컴포넌트에 전달
      onImagesChange([selectedImage]);
    }
    setSelectedImage(null);
  };

  const handleClose = () => {
    setSelectedImage(null);
  };

  return (
    <div className={styles["image-uploader"]}>
      <h4>맞춤형 배경 이미지 등록하기</h4>

      <div
        ref={dropRef}
        className={`${styles["drop-zone"]} ${images.length > 0 ? styles["has-images"] : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input 
          type="file" 
          accept="image/*" 
          multiple 
          onChange={handleFileChange}
          style={{ pointerEvents: images.length > 0 ? 'none' : 'auto' }}
        />
        {images.length === 0 ? (
          <p>여기에 이미지를 드래그 앤 드롭하거나 
            클릭하여 업로드하세요.</p>
        ) : (
          <div className={styles["preview-container"]}>
            {images.map((img) => (
              <div 
                key={img.id} 
                className={`${styles["preview-item"]} ${selectedImage?.id === img.id ? styles["selected"] : ""}`}
                onClick={() => handleImageSelect(img)}
              >
                <img src={img.src} alt="업로드 이미지" />
                <button className={styles["remove-btn"]} onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(img.id);
                }}>×</button>
              </div>
            ))}
            <div 
              className={styles["add-more-btn"]}
              onClick={(e) => {
                e.stopPropagation();
                const input = dropRef.current.querySelector('input[type="file"]');
                input.style.pointerEvents = 'auto';
                input.click();
                setTimeout(() => {
                  input.style.pointerEvents = 'none';
                }, 100);
              }}
            >
              <span>+</span>
              <p>추가</p>
            </div>
          </div>
        )}
      </div>

      {selectedImage && (
        <div className={styles["image-actions"]}>
          <button
            type="button"
            onClick={handleApply}
            className={styles["apply-button"]}
          >
            적용하기
          </button>
          <button
            type="button"
            onClick={handleClose}
            className={styles["cancel-button"]}
          >
            닫기
          </button>
        </div>
      )}
    </div>
)};

export default ImageUploader;
