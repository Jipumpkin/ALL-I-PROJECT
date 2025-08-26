import React, { useState } from 'react';
import styles from './Login.module.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../axios';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await api.post('/api/login', {
        username: formData.username,
        password: formData.password,
      });

      if (res.data?.success) {
        const { user, tokens } = res.data.data || {};
        login(user, tokens);

        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else {
        setError(res.data?.message || '로그인에 실패했습니다.');
      }
    } catch (err) {
      console.error('로그인 오류:', err);
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        '서버와 연결할 수 없습니다.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles['login-container']}>
      <div className={styles['login-box']}>
        <div className={styles['login-form']}>
          <h2>로그인</h2>
          <form onSubmit={handleSubmit}>
            {error && <div className={styles['error-message']}>{error}</div>}

            <div className={styles['input-group']}>
              <label htmlFor="username">아이디</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                autoComplete="username"
                required
              />
            </div>

            <div className={styles['input-group']}>
              <label htmlFor="password">비밀번호</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              className={styles['login-button']}
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className={styles['login-links']}>
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
