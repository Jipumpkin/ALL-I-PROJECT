import React, { useState } from "react";
import styles from "./Register.module.css";
import ImageUploader from "../ImageUploader/ImageUploader";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../src/context/AuthContext";
import api from "../../axios";

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    nickname: '',
    gender: '',
    phone: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isUsernameChecked, setIsUsernameChecked] = useState(false);
  const [usernameCheckMessage, setUsernameCheckMessage] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasLetter: false,
    hasNumber: false,
    hasSpecialChar: false
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // username이 변경되면 중복체크 초기화
    if (name === 'username') {
      setIsUsernameChecked(false);
      setUsernameCheckMessage('');
    }
    
    // 실시간 비밀번호 유효성 검사
    if (name === 'password') {
      validatePasswordRealTime(value);
    }
    
    // 입력시 해당 필드의 유효성 오류 제거
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // 실시간 비밀번호 유효성 검사
  const validatePasswordRealTime = (password) => {
    setPasswordValidation({
      minLength: password.length >= 8,
      hasLetter: /[a-zA-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[@$!%*?&]/.test(password)
    });
  };

  // 아이디 중복체크 함수
  const checkUsernameDuplicate = async () => {
    if (!formData.username) {
      setUsernameCheckMessage('아이디를 입력해주세요.');
      return;
    }

    try {
      const response = await api.post('/api/users/auth/check-username', {
        username: formData.username
      });
      
      if (response.data.success && response.data.available) {
        setIsUsernameChecked(true);
        setUsernameCheckMessage('사용 가능한 아이디입니다.');
      } else {
        setIsUsernameChecked(false);
        setUsernameCheckMessage('이미 사용 중인 아이디입니다.');
      }
    } catch (error) {
      if (error.response?.status === 409) {
        setIsUsernameChecked(false);
        setUsernameCheckMessage('이미 사용 중인 아이디입니다.');
      } else {
        setUsernameCheckMessage('중복체크 중 오류가 발생했습니다.');
      }
    }
  };

  // 이미지 업로드 완료 시 호출되는 함수
  const handleImagesUpload = (images) => {
    setUploadedImages(images);
    console.log('회원가입에서 받은 이미지 정보:', images);
  };

  const registerHandler = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // 아이디 중복체크 확인
    if (!isUsernameChecked) {
      setError('아이디 중복체크를 완료해주세요.');
      setIsLoading(false);
      return;
    }

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setIsLoading(false);
      return;
    }

    // 필수 필드 검증
    if (!formData.username || !formData.password || !formData.email || !formData.nickname) {
      setError('아이디, 비밀번호, 이메일, 닉네임은 필수 입력 항목입니다.');
      setIsLoading(false);
      return;
    }


    try {
      // API 요청 데이터 구성
      const requestData = {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        nickname: formData.nickname,
        gender: formData.gender || null,
        phone_number: formData.phone || null
      };

      const response = await api.post('/api/users/auth/register', requestData);

      if (response.data.success) {
        // 회원가입 성공 시 자동 로그인
        login(response.data.user, response.data.tokens);
        navigate('/');
      } else {
        setError(response.data.message || '회원가입에 실패했습니다.');
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        setValidationErrors(errors);
        
        // 전체적인 오류 메시지도 표시
        if (errors.password) {
          setError('비밀번호 요구사항을 확인해주세요.');
        } else if (errors.username) {
          setError('사용자명을 확인해주세요.');
        } else if (errors.email) {
          setError('이메일을 확인해주세요.');
        } else {
          setError(error.response.data.message || '입력 정보를 확인해주세요.');
        }
      } else if (error.response) {
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
      <h4 style={{ color: "var(--color-text-secondary)", textAlign: "center" }}>
        우리가족이 되어주세요!
      </h4>

      <form onSubmit={registerHandler}>
        {error && <div className={styles["error-message"]}>{error}</div>}
        
        {/* 아이디 */}
        <div className={styles["form-group"]}>
          <label htmlFor="username">아이디 *</label>
          <div className={styles["input-with-button"]}>
            <input 
              type="text" 
              id="username" 
              name="username" 
              value={formData.username}
              onChange={handleChange}
              placeholder="아이디를 입력해주세요"
              required
            />
            <button 
              type="button" 
              onClick={checkUsernameDuplicate}
              className={styles["check-button"]}
              disabled={!formData.username}
            >
              중복체크
            </button>
          </div>
          {usernameCheckMessage && (
            <div className={`${styles["check-message"]} ${isUsernameChecked ? styles["success"] : styles["error"]}`}>
              {usernameCheckMessage}
            </div>
          )}
        </div>

        {/* 비밀번호 */}
        <div className={styles["form-group"]}>
          <label htmlFor="password">비밀번호 *</label>
          <input 
            type="password" 
            id="password" 
            name="password" 
            value={formData.password}
            onChange={handleChange}
            placeholder="비밀번호를 입력해주세요"
            required
          />
          {validationErrors.password && (
            <div className={styles["validation-error"]}>
              {validationErrors.password}
            </div>
          )}
          
          {/* 실시간 비밀번호 검증 표시 */}
          {formData.password && (
            <div className={styles["password-requirements"]}>
              <div className={styles["requirement-title"]}>비밀번호 요구사항:</div>
              <div className={`${styles["requirement-item"]} ${passwordValidation.minLength ? styles["valid"] : styles["invalid"]}`}>
                {passwordValidation.minLength ? '✓' : '✗'} 8자 이상
              </div>
              <div className={`${styles["requirement-item"]} ${passwordValidation.hasLetter ? styles["valid"] : styles["invalid"]}`}>
                {passwordValidation.hasLetter ? '✓' : '✗'} 영문자 포함
              </div>
              <div className={`${styles["requirement-item"]} ${passwordValidation.hasNumber ? styles["valid"] : styles["invalid"]}`}>
                {passwordValidation.hasNumber ? '✓' : '✗'} 숫자 포함
              </div>
              <div className={`${styles["requirement-item"]} ${passwordValidation.hasSpecialChar ? styles["valid"] : styles["invalid"]}`}>
                {passwordValidation.hasSpecialChar ? '✓' : '✗'} 특수문자 포함 (@$!%*?&)
              </div>
            </div>
          )}
        </div>

        {/* 비밀번호 확인 */}
        <div className={styles["form-group"]}>
          <label htmlFor="confirmPassword">비밀번호 확인 *</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="비밀번호를 다시 입력해주세요"
            required
          />
        </div>

        {/* 이메일 */}
        <div className={styles["form-group"]}>
          <label htmlFor="email">이메일 *</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            value={formData.email}
            onChange={handleChange}
            placeholder="이메일을 입력해주세요"
            required
          />
          {validationErrors.email && (
            <div className={styles["validation-error"]}>
              {validationErrors.email}
            </div>
          )}
        </div>

        {/* 닉네임 */}
        <div className={styles["form-group"]}>
          <label htmlFor="nickname">닉네임 *</label>
          <input
            type="text"
            id="nickname"
            name="nickname"
            value={formData.nickname}
            onChange={handleChange}
            placeholder="닉네임을 입력해주세요"
            required
          />
          {validationErrors.nickname && (
            <div className={styles["validation-error"]}>
              {validationErrors.nickname}
            </div>
          )}
        </div>

        {/* 성별 */}
        <div className={styles["form-group"]}>
          <label htmlFor="gender">성별</label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
          >
            <option value="">선택해주세요</option>
            <option value="male">남성</option>
            <option value="female">여성</option>
          </select>
        </div>

        {/* 연락처 */}
        <div className={styles["form-group"]}>
          <label htmlFor="phone">연락처</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="연락처를 입력해주세요 (예: 010-1234-5678)"
          />
          {validationErrors.phone_number && (
            <div className={styles["validation-error"]}>
              {validationErrors.phone_number}
            </div>
          )}
        </div>

        {/* 사용자 집 이미지 (이미지합성용) */}
        <div className={styles["form-group"]}>
          <label>사용자 집 이미지 (이미지합성용)</label>
          <ImageUploader onImagesChange={handleImagesUpload} />
          {uploadedImages.length > 0 && (
            <div className={styles["upload-status"]}>
              ✅ {uploadedImages.length}개 이미지 업로드 완료
            </div>
          )}
        </div>

        <button 
          type="submit" 
          disabled={isLoading || !isUsernameChecked}
          className={styles["submit-button"]}
        >
          {isLoading ? '가입 중...' : '가입하기'}
        </button>
      </form>
    </div>
  );
};

export default Register;
