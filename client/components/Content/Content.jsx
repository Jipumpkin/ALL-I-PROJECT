import React from 'react';
import styles from './Content.module.css';
import Title from '../Title/Title.jsx';
import TopSix from '../TopSix/TopSix.jsx';
import ShelterMap from '../ShelterMap/ShelterMap.jsx'; // ShelterMap 컴포넌트 import

const Content = () => {
  return (
    <div className={styles["content-container"]}>
      <Title />
      <TopSix />
      <ShelterMap /> {/* ShelterMap 컴포넌트 사용 */}
    </div>
  );
};

export default Content;