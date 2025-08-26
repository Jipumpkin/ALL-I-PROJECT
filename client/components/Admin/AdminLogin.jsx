import React, { useState } from 'react';
import axios from '../../axios';
import styles from './AdminLogin.module.css';

const AdminLogin = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/admin/login', { password });
      
      if (response.data.success) {
        sessionStorage.setItem('adminToken', response.data.token);
        onLoginSuccess(response.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.message || '관리자 인증에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <div className={styles.logoSection}>
          <h1>🔐</h1>
          <h2>관리자 인증</h2>
          <p>시스템 관리를 위한 인증이 필요합니다</p>
        </div>
        
        <form onSubmit={handleAdminLogin} className={styles.loginForm}>
          <div className={styles.formGroup}>
            <label htmlFor="password">관리자 비밀번호</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="관리자 비밀번호를 입력하세요"
              required
              className={styles.passwordInput}
              autoComplete="current-password"
            />
          </div>
          
          {error && <div className={styles.error}>{error}</div>}
          
          <button 
            type="submit" 
            disabled={loading || !password.trim()}
            className={styles.loginButton}
          >
            {loading ? (
              <>
                <span className={styles.spinner}></span>
                인증 중...
              </>
            ) : (
              '관리자 로그인'
            )}
          </button>
        </form>

        <div className={styles.infoSection}>
          <div className={styles.securityNotice}>
            <p>🛡️ 보안 알림</p>
            <ul>
              <li>관리자 권한으로 시스템에 접근합니다</li>
              <li>모든 관리 활동이 로그로 기록됩니다</li>
              <li>24시간 동안 세션이 유지됩니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;