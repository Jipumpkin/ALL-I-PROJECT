import React, { useState } from "react";
import styles from "./Register.module.css";
import ImageUploader from "../ImageUploader/ImageUploader";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../src/context/AuthContext";
import axios from "axios";

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    birthYear: '',
    birthMonth: '',
    birthDay: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const registerHandler = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setIsLoading(false);
      return;
    }

    // 필수 필드 검증
    if (!formData.username || !formData.email || !formData.password || !formData.name) {
      setError('아이디, 이메일, 비밀번호, 이름은 필수 입력 항목입니다.');
      setIsLoading(false);
      return;
    }

    try {
      // API 요청 데이터 구성
      const requestData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        nickname: formData.name, // name을 nickname으로 매핑
        phone_number: formData.phone || null,
        // 생년월일 조합 (선택사항)
        birthdate: formData.birthYear && formData.birthMonth && formData.birthDay 
          ? `${formData.birthYear}-${formData.birthMonth.padStart(2, '0')}-${formData.birthDay.padStart(2, '0')}`
          : null
      };

      const response = await axios.post('http://localhost:3003/api/register', requestData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data.success) {
        // 회원가입 성공 시 자동 로그인
        login(response.data.data.user, response.data.data.tokens);
        navigate('/');
      } else {
        setError(response.data.message || '회원가입에 실패했습니다.');
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      if (error.response) {
        setError(error.response.data.message || '회원가입에 실패했습니다.');
      } else {
        setError('서버와 연결할 수 없습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles["register-container"]}>
      <h2>회원가입</h2>
      <h4 style={{ color: "skyblue", textAlign: "center" }}>
        우리가족이 되어주세요!
      </h4>

      <form onSubmit={registerHandler}>
        {error && <div className={styles["error-message"]}>{error}</div>}
        
        <div className={styles["form-group"]}>
          <label htmlFor="username">아이디</label>
          <input 
            type="text" 
            id="username" 
            name="username" 
            value={formData.username}
            onChange={handleChange}
            placeholder="아이디를 입력해주세요"
            required
          />
        </div>
        <div className={styles["form-group"]}>
          <label htmlFor="email">이메일</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            value={formData.email}
            onChange={handleChange}
            placeholder="이메일을 입력해주세요"
            required
          />
        </div>
        <div className={styles["form-group"]}>
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
        <div className={styles["form-group"]}>
          <label htmlFor="confirmPassword">비밀번호 재확인</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
        <div className={styles["form-group"]}>
          <label htmlFor="name">이름</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="이름을(를) 입력해주세요"
            required
          />
        </div>
        <div className={styles["form-group"]}>
          <label htmlFor="phone">연락처</label>
          <input
            type="text"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="연락처를 입력해주세요"
          />
        </div>
        <div className={styles["form-group"]}>
          <label htmlFor="birthdate">생년월일</label>
          <div className={styles["birthdate-select"]}>
            <select 
              id="birthYear" 
              name="birthYear"
              value={formData.birthYear}
              onChange={handleChange}
            >
              <option value="">년</option>
              {Array.from(
                { length: 100 },
                (_, i) => new Date().getFullYear() - i
              ).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select 
              id="birthMonth" 
              name="birthMonth"
              value={formData.birthMonth}
              onChange={handleChange}
            >
              <option value="">월</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
            <select 
              id="birthDay" 
              name="birthDay"
              value={formData.birthDay}
              onChange={handleChange}
            >
              <option value="">일</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* 이미지 업로더 삽입 */}
        <ImageUploader />
        <button 
          type="submit" 
          disabled={isLoading}
        >
          {isLoading ? '가입 중...' : '가입하기'}
        </button>
      </form>
    </div>
  );
};

export default Register;
