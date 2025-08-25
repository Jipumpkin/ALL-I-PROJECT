import React from 'react';
import styles from './Loading.module.css';

const Loading = ({ message = '로딩 중...' }) => {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner}></div>
      <p className={styles.message}>{message}</p>
    </div>
  );
};

export default Loading;