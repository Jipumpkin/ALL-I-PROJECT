import React from 'react';
import styles from './ErrorMessage.module.css';

const ErrorMessage = ({ 
  message, 
  type = 'error', 
  onRetry = null,
  showIcon = true 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'success': return '✅';
      default: return '❌';
    }
  };

  return (
    <div className={`${styles.errorContainer} ${styles[type]}`}>
      {showIcon && <span className={styles.icon}>{getIcon()}</span>}
      <div className={styles.content}>
        <p className={styles.message}>{message}</p>
        {onRetry && (
          <button className={styles.retryButton} onClick={onRetry}>
            다시 시도
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;