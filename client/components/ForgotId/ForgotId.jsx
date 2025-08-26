import React, { useState } from 'react';
import styles from './ForgotId.module.css';
import { Link } from 'react-router-dom';
import axios from '../../axios';

const ForgotId = () => {
  const [searchType, setSearchType] = useState('nickname');
  const [formData, setFormData] = useState({
    searchValue: '',
    name: '',
    phone: ''
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      setFormData({
        ...formData,
        [name]: value.replace(/[^0-9]/g, '')
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const response = await axios.post('/api/users/auth/find-id', {
        searchType,
        searchValue: formData.searchValue,
        name: formData.name,
        phone: formData.phone
      });

      if (response.data.success) {
        setResult(response.data.data);
      } else {
        setError(response.data.message || '아이디를 찾을 수 없습니다.');
      }
    } catch (err) {
      console.error('아이디 찾기 오류:', err);
      setError(err.response?.data?.message || '아이디 찾기 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      searchValue: '',
      name: '',
      phone: ''
    });
    setResult(null);
    setError('');
  };

  return (
    <div className={styles["forgot-id-container"]}>
      <div className={styles["forgot-id-box"]}>
        <div className={styles["forgot-id-title"]}>
          <h2>아이디 찾기</h2>
          
          {/* 검색 방법 토글 버튼 */}
          <div className={styles["toggle-container"]}>
            <button
              type="button"
              className={`${styles["toggle-button"]} ${searchType === 'nickname' ? styles["active"] : ''}`}
              onClick={() => {
                setSearchType('nickname');
                handleReset();
              }}
            >
              닉네임으로 찾기
            </button>
            <button
              type="button"
              className={`${styles["toggle-button"]} ${searchType === 'email' ? styles["active"] : ''}`}
              onClick={() => {
                setSearchType('email');
                handleReset();
              }}
            >
              이메일로 찾기
            </button>
          </div>

          {!result ? (
            <form onSubmit={handleSubmit}>
              <div className={styles["input-group"]}>
                <label htmlFor="searchValue">
                  {searchType === 'nickname' ? '닉네임' : '이메일'}
                </label>
                <input
                  type={searchType === 'email' ? 'email' : 'text'}
                  id="searchValue"
                  name="searchValue"
                  value={formData.searchValue}
                  onChange={handleInputChange}
                  placeholder={searchType === 'nickname' ? '닉네임을 입력해주세요' : '이메일을 입력해주세요'}
                  required
                />
              </div>
              
              
              <div className={styles["input-group"]}>
                <label htmlFor="phone">연락처</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder='- 없이 입력하세요'
                  required
                />
              </div>
              
              {error && (
                <div className={styles["error-message"]}>
                  {error}
                </div>
              )}
              
              <button
                type="submit"
                className={styles["find-id-button"]}
                disabled={loading}
              >
                {loading ? '찾는 중...' : '아이디 찾기'}
              </button>
              <div className={styles['login-links']}>
                <Link to="/forgot-password" className={styles["forgot-password-link"]}>비밀번호 찾기</Link>
              </div>
            </form>
          ) : (
            <div className={styles["result-container"]}>
              <div className={styles["result-box"]}>
                <h3>아이디 찾기 결과</h3>
                <p className={styles["result-username"]}>아이디: <strong>{result.username}</strong></p>
                <p className={styles["result-email"]}>이메일: {result.email}</p>
              </div>
              <div className={styles["button-group"]}>
                <button
                  type="button"
                  onClick={handleReset}
                  className={styles["reset-button"]}
                >
                  다시 찾기
                </button>
                <Link to="/login" className={styles["login-button"]}>
                  로그인하기
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotId;
