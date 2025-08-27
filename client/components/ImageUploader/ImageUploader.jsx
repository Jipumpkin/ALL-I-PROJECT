import React, { useState, useRef } from 'react';
import styles from './ImageUploader.module.css'; // 아래 CSS 파일을 import
import api from '../../axios';

const ImageUploader = ({ onImagesChange }) => {
  // HEAD + dev 통합: 업로드 상태, 선택 상태 모두 유지
  const [images, setImages] = useState([]); // { id, src, file, uploaded, serverUrl?, filename? }
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const dropRef = useRef(null);

  const handleFiles = async (files) => {
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    );
    if (imageFiles.length === 0) return;

    // 로컬 미리보기용 이미지 추가
    const newImages = imageFiles.map((file) => {
      const id = URL.createObjectURL(file);
      return { id, src: id, file, uploaded: false };
    });

    const prevLen = images.length;
    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);

    // 서버 업로드 (새로 추가된 것들만 매핑하기 위해 prevLen 전달)
    await uploadImages(imageFiles, updatedImages, prevLen);
  };

  // 업로드: 서버가 돌려준 파일 배열을 새로 추가된 이미지 순서대로 매핑
  const uploadImages = async (files, currentImages, prevLen) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });

      const response = await api.post('/api/images/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data?.success) {
        const uploadedFiles = response.data.data.files || [];

        // 새로 추가된 이미지 구간에 업로드 결과를 순서대로 매핑
        const mapped = currentImages.map((img, idx) => {
          if (idx >= prevLen && idx < prevLen + uploadedFiles.length) {
            const u = uploadedFiles[idx - prevLen];
            return {
              ...img,
              uploaded: true,
              serverUrl: u.url,
              filename: u.filename,
            };
          }
          return img;
        });

        setImages(mapped);

        // 부모에게 업로드된 파일 정보 전달(필요 시 형태 맞춰 사용)
        onImagesChange && onImagesChange(uploadedFiles);

        console.log('✅ 이미지 업로드 성공:', uploadedFiles);
      }
    } catch (error) {
      console.error('❌ 이미지 업로드 실패:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
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
      onImagesChange && onImagesChange(updatedImages);
      return updatedImages;
    });
    if (selectedImage?.id === id) setSelectedImage(null);
    URL.revokeObjectURL(id);
  };

  const handleImageSelect = (image) => {
    setSelectedImage(image);
  };

  const handleApply = () => {
    if (selectedImage && onImagesChange) {
      onImagesChange([selectedImage]);
    }
    setSelectedImage(null);
  };

  const handleClose = () => {
    setSelectedImage(null);
  };

  const dropZoneClass = [
    styles['drop-zone'],
    isUploading ? styles['uploading'] : '',
    images.length > 0 ? styles['has-images'] : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles['image-uploader']}>
      <h4>맞춤형 배경 이미지 등록하기</h4>

      <div
        ref={dropRef}
        className={dropZoneClass}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          disabled={isUploading}
          style={{
            pointerEvents: images.length > 0 || isUploading ? 'none' : 'auto',
          }}
        />
        {images.length === 0 ? (
          <p>{isUploading ? '업로드 중...' : '여기에 이미지를 드래그 앤 드롭하거나 클릭하여 업로드하세요.'}</p>
        ) : (
          <div className={styles['preview-container']}>
            {images.map((img) => (
              <div
                key={img.id}
                className={`${styles['preview-item']} ${
                  selectedImage?.id === img.id ? styles['selected'] : ''
                }`}
                onClick={() => handleImageSelect(img)}
              >
                <img src={img.src} alt="업로드 이미지" />
                <div className={styles['image-status']}>
                  {img.uploaded ? '✅' : '⏳'}
                </div>
                <button
                  className={styles['remove-btn']}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(img.id);
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            <div
              className={styles['add-more-btn']}
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
        <div className={styles['image-actions']}>
          <button
            type="button"
            onClick={handleApply}
            className={styles['apply-button']}
          >
            적용하기
          </button>
          <button
            type="button"
            onClick={handleClose}
            className={styles['cancel-button']}
          >
            닫기
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
