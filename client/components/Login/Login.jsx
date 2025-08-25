import React, { useState } from 'react';
import styles from './Login.module.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../src/context/AuthContext';
import axios from '../../axios';
import ScrollAnimation from '../ScrollAnimation/ScrollAnimation';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
      const response = await axios.post('http://localhost:3003/api/users/auth/login', formData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data.success) {
        login(response.data.data.user, response.data.data.tokens);
        // 보호된 페이지에서 온 경우 원래 페이지로, 아니면 메인으로
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
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
          {/* 🎭 로그인 제목: fadeInUp 애니메이션 */}
          <ScrollAnimation animation="fadeInUp">
            <h2>로그인</h2>
          </ScrollAnimation>
          
          <ScrollAnimation animation="fadeInUp" delay={200}>
            <form onSubmit={handleSubmit}>
              {/* ❌ 에러 메시지: bounceIn 애니메이션 */}
              {error && (
                <ScrollAnimation animation="bounceIn">
                  <div className={styles["error-message"]}>{error}</div>
                </ScrollAnimation>
              )}
              
              {/* 📧 이메일 입력: fadeInLeft 애니메이션 */}
              <ScrollAnimation animation="fadeInLeft" delay={300}>
                <div className={styles["input-group"]}>
                  <label htmlFor="email">이메일</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </ScrollAnimation>
              
              {/* 🔒 비밀번호 입력: fadeInRight 애니메이션 */}
              <ScrollAnimation animation="fadeInRight" delay={400}>
                <div className={styles["input-group"]}>
                  <label htmlFor="password">비밀번호</label>
                  <input 
                    type="password" 
                    id="password" 
                    name="password" 
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="비밀번호를 입력하세요"
                    required
                  />
                </div>
              </ScrollAnimation>
              
              {/* 🚀 로그인 버튼: scaleIn 애니메이션 */}
              <ScrollAnimation animation="scaleIn" delay={500}>
                <button 
                  type="submit" 
                  className={styles["login-button"]}
                  disabled={isLoading}
                >
                  {isLoading ? '로그인 중...' : '로그인'}
                </button>
              </ScrollAnimation>
            </form>
          </ScrollAnimation>
          
          {/* 🔗 링크들: fadeInUp 애니메이션 */}
          <ScrollAnimation animation="fadeInUp" delay={600}>
            <div className={styles["login-links"]}>
              <div><Link to="/register">회원가입</Link></div>
              <div><Link to="/forgot-id">아이디찾기</Link></div>
              <div><Link to="/forgot-password">비밀번호찾기</Link></div>
            </div>
          </ScrollAnimation>
        </div>
      </div>
    </div>
  );
};

export default Login;