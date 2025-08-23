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
  };

  // 아이디 중복체크 함수
  const checkUsernameDuplicate = async () => {
    if (!formData.username) {
      setUsernameCheckMessage('아이디를 입력해주세요.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3003/api/users/auth/check-username', {
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

      const response = await axios.post('http://localhost:3003/api/users/auth/register', requestData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data.success) {
        // 회원가입 성공 시 실제 업로드된 이미지 데이터 추가
        const userId = response.data.data.user.id;
        if (uploadedImages.length > 0) {
          try {
            // 첫 번째 업로드된 이미지 사용
            await axios.post(`http://localhost:3003/api/users/${userId}/images`, {
              image_url: uploadedImages[0].src
            });
          } catch (imageError) {
            console.error('사용자 이미지 추가 실패:', imageError);
          }
        } else {
          // 이미지가 없으면 기본 이미지 사용
          try {
            await axios.post(`http://localhost:3003/api/users/${userId}/images`, {
              image_url: 'https://placehold.co/400x400/FF5733/FFFFFF?text=User+House+Image'
            });
          } catch (imageError) {
            console.error('사용자 이미지 추가 실패:', imageError);
          }
        }
        
        // 자동 로그인
        login(response.data.data.user, response.data.data.tokens);
        navigate('/');
      } else {
        setError(response.data.message || '회원가입에 실패했습니다.');
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        if (errors.username) {
          setError(errors.username);
        } else if (errors.email) {
          setError(errors.email);
        } else {
          setError(error.response.data.message || '회원가입에 실패했습니다.');
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
        </div>

        {/* 사용자 집 이미지 (이미지합성용) */}
        <div className={styles["form-group"]}>
          <label>사용자 집 이미지 (이미지합성용)</label>
          <ImageUploader onImagesChange={setUploadedImages} />
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
