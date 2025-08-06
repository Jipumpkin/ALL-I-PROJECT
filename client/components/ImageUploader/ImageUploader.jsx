import React, { useState, useRef } from 'react';
import './ImageUploader.css'; // 아래 CSS 파일을 import

const ImageUploader = () => {
  const [images, setImages] = useState([]); // { id, src }
  const dropRef = useRef(null);

  const handleFiles = (files) => {
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    );

    const newImages = imageFiles.map((file) => {
      const id = URL.createObjectURL(file);
      return { id, src: id };
    });

    setImages((prev) => [...prev, ...newImages]);
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
    <div className="image-uploader">
      <h4>맞춤형 배경 이미지 등록하기</h4>

      <div
        ref={dropRef}
        className="drop-zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input type="file" accept="image/*" multiple onChange={handleFileChange} />
        <p>여기에 이미지를 드래그 앤 드롭하거나 
          클릭하여 업로드하세요.</p>
      </div>

      <div className="preview-container">
        {images.map((img) => (
          <div key={img.id} className="preview-item">
            <img src={img.src} alt="업로드 이미지" />
            <button className="remove-btn" onClick={() => handleRemove(img.id)}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageUploader;
