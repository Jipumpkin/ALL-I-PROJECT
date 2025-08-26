import React, { useState, useRef } from 'react';
import styles from './ImageUploader.module.css'; // 아래 CSS 파일을 import
import api from '../../axios';

const ImageUploader = ({ onImagesChange }) => {
  const [images, setImages] = useState([]); // { id, src, file, uploaded }
  const [isUploading, setIsUploading] = useState(false);
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

    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);

    // 서버에 업로드
    await uploadImages(imageFiles, updatedImages);
  };

  const uploadImages = async (files, currentImages) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });

      const response = await api.post('/api/images/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        // 업로드된 파일 정보로 상태 업데이트
        const uploadedFiles = response.data.data.files;
        
        const updatedImages = currentImages.map((img, index) => {
          const uploadedFile = uploadedFiles.find((_, i) => 
            files.findIndex(f => URL.createObjectURL(f) === img.id) !== -1
          );
          
          if (uploadedFile && !img.uploaded) {
            return {
              ...img,
              uploaded: true,
              serverUrl: uploadedFile.url,
              filename: uploadedFile.filename
            };
          }
          return img;
        });

        setImages(updatedImages);
        
        // 부모 컴포넌트에 업로드된 이미지 정보 전달
        if (onImagesChange) {
          onImagesChange(uploadedFiles);
        }
        
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
    setImages((prev) => prev.filter((img) => img.id !== id));
    URL.revokeObjectURL(id);
  };

  return (
    <div className={styles["image-uploader"]}>
      <h4>맞춤형 배경 이미지 등록하기</h4>

      <div
        ref={dropRef}
        className={`${styles["drop-zone"]} ${isUploading ? styles["uploading"] : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input type="file" accept="image/*" multiple onChange={handleFileChange} disabled={isUploading} />
        <p>
          {isUploading ? '업로드 중...' : '여기에 이미지를 드래그 앤 드롭하거나 클릭하여 업로드하세요.'}
        </p>
      </div>

      <div className={styles["preview-container"]}>
        {images.map((img) => (
          <div key={img.id} className={styles["preview-item"]}>
            <img src={img.src} alt="업로드 이미지" />
            <div className={styles["image-status"]}>
              {img.uploaded ? '✅' : '⏳'}
            </div>
            <button className={styles["remove-btn"]} onClick={() => handleRemove(img.id)}>×</button>
          </div>
        ))}
      </div>
    </div>
)};

export default ImageUploader;
