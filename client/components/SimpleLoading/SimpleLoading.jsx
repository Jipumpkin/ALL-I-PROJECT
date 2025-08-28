import React from 'react';
import styles from './SimpleLoading.module.css';

const SimpleLoading = ({ message = '페이지 로딩중' }) => {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner}></div>
      <div className={styles.message}>{message}</div>
    </div>
  );
};

export default SimpleLoading;