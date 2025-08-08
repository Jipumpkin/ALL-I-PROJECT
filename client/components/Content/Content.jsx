import React, { useState, useEffect, useRef } from 'react';
import './Content.css';
import Title from '../Title/Title.jsx';
import TopSix from '../TopSix/TopSix.jsx'
const Content = ({children}) => {

  const fileInputRef1 = useRef(null);
  const fileInputRef2 = useRef(null);
  const [uploadedImage1, setUploadedImage1] = useState(null);
  const [uploadedImage2, setUploadedImage2] = useState(null);



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
      <Title></Title>
      <TopSix></TopSix>
      </div>
  );
};

export default Content;
