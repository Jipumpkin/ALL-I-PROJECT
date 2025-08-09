import React from 'react';
import styles from './Content.module.css';
import Title from '../Title/Title.jsx';
import TopSix from '../TopSix/TopSix.jsx';
import Upload from '../Upload.jsx'; // Upload 컴포넌트 import

const Content = () => {
  return (
    <div className={styles["content-container"]}>
      <Title />
      <TopSix />
      <Upload /> {/* Upload 컴포넌트 사용 */}
    </div>
  );
};

export default Content;