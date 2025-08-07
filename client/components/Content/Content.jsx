import React, { useState, useEffect, useRef } from 'react';
import './Content.css';
<<<<<<< HEAD:client/components/Content.jsx
import Title from './Title';
import TopSix from './TopSix';
=======
import ImageCompareSlider from '../ImageCompareSlider/ImageCompareSlider';

>>>>>>> 7d4d4f94c24e711c364a7ae1ee91fab7629456d4:client/components/Content/Content.jsx
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
