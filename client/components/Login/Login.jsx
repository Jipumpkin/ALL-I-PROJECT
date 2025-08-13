import React, { useState } from 'react';
import styles from './Login.module.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../src/context/AuthContext';
import axios from 'axios';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:3003/api/login', formData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data.success) {
        login(response.data.user);
        navigate('/');
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      if (error.response) {
        setError(error.response.data.message || '로그인에 실패했습니다.');
      } else {
        setError('서버와 연결할 수 없습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles["login-container"]}>
      <div className={styles["login-box"]}>
        <div className={styles["login-form"]}>
          <h2>로그인</h2>
          <form onSubmit={handleSubmit}>
            {error && <div className={styles["error-message"]}>{error}</div>}
            <div className={styles["input-group"]}>
              <label htmlFor="username">아이디</label>
              <input 
                type="text" 
                id="username" 
                name="username" 
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles["input-group"]}>
              <label htmlFor="password">비밀번호</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <button 
              type="submit" 
              className={styles["login-button"]}
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>
          <div className={styles["login-links"]}>
            <div><Link to="/register">회원가입</Link></div>
            <div><Link to="/forgot-id">아이디찾기</Link></div>
            <div><Link to="/forgot-password">비밀번호찾기</Link></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
