import React from 'react';
import styles from './Content.module.css';
import Title from '../Title/Title.jsx';
import ShelterMap from '../ShelterMap/ShelterMap.jsx';

const Content = ({ children }) => {
  return (
    <div className={styles["content-container"]}>
      <Title />
      {children}
      <ShelterMap />
    </div>
  );
};

export default Content;