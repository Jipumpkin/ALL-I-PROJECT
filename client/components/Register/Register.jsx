import React, { useState, useRef, useEffect } from "react";
import styles from "./Register.module.css";
import ImageUploader from "../ImageUploader/ImageUploader";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../src/context/AuthContext";
import api from "../../axios";

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const formRef = useRef(null);
  const errorRef = useRef(null);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    nickname: "",
    gender: "",
    phone: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // 에러 발생 시 상단으로 스크롤
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [error]);

  const [isUsernameChecked, setIsUsernameChecked] = useState(false);
  const [usernameCheckMessage, setUsernameCheckMessage] = useState("");

  // 이메일 체크/제안 관련
  const [emailCheckMessage, setEmailCheckMessage] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [emailCheckTimer, setEmailCheckTimer] = useState(null);

  // 닉네임/전화번호 에러
  const [nicknameError, setNicknameError] = useState("");

  // 업로드된 이미지
  const [uploadedImages, setUploadedImages] = useState([]);

  // 서버 검증 에러(필드별)
  const [validationErrors, setValidationErrors] = useState({});

  // 비밀번호 실시간 검증
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasLetter: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  useEffect(() => {
    // 언마운트 시 디바운스 타이머 클리어
    return () => {
      if (emailCheckTimer) clearTimeout(emailCheckTimer);
    };
  }, [emailCheckTimer]);

  // 자주 사용되는 이메일 도메인
  const emailDomains = [
    "naver.com",
    "gmail.com",
    "daum.net",
    "hanmail.net",
    "kakao.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
  ];

  const validatePasswordRealTime = (password) => {
    setPasswordValidation({
      minLength: password.length >= 8,
      hasLetter: /[a-zA-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[@$!%*?&]/.test(password),
    });
  };

  const validateNickname = (nickname) => {
    if (!nickname) return false;
    const nicknameRegex = /^[가-힣a-zA-Z]+$/; // 한글/영문만
    if (nickname.length < 2 || nickname.length > 20) return false;
    return nicknameRegex.test(nickname);
  };

  const validatePhoneNumber = (phone) => {
    if (!phone) return false;
    // 한국 휴대폰 패턴
    const phoneRegex = new RegExp("^01[0-9]-?\\d{3,4}-?\\d{4}$");
    const digitsOnly = phone.replace(new RegExp("[^0-9]", "g"), "");
    if (digitsOnly.length !== 11) return false;
    if (
      !digitsOnly.startsWith("010") &&
      !digitsOnly.startsWith("011") &&
      !digitsOnly.startsWith("016") &&
      !digitsOnly.startsWith("017") &&
      !digitsOnly.startsWith("018") &&
      !digitsOnly.startsWith("019")
    )
      return false;
    return phoneRegex.test(phone);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // 연락처: 숫자와 하이픈만
    if (name === "phone") {
      processedValue = value.replace(new RegExp("[^0-9-]", "g"), "");
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }));

    // username 변경 시 중복체크 초기화
    if (name === "username") {
      setIsUsernameChecked(false);
      setUsernameCheckMessage("");
    }

    // 비밀번호 실시간 검증
    if (name === "password") {
      validatePasswordRealTime(processedValue);
    }

    // 필드별 서버검증 에러 클리어
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // 닉네임 유효성 검사
    if (name === "nickname") {
      if (processedValue === "") {
        setNicknameError("");
      } else if (!validateNickname(processedValue)) {
        if (processedValue.length < 2) {
          setNicknameError("닉네임은 2자 이상이어야 합니다.");
        } else if (processedValue.length > 20) {
          setNicknameError("닉네임은 20자 이하여야 합니다.");
        } else {
          setNicknameError("닉네임은 한글과 영어만 사용할 수 있습니다.");
        }
      } else {
        setNicknameError("");
      }
    }

    // 이메일 제안/중복 체크
    if (name === "email") {
      if (processedValue.includes("@") && !processedValue.includes(".")) {
        setShowEmailSuggestions(true);
        setSelectedSuggestionIndex(0);
      } else {
        setShowEmailSuggestions(false);
        setSelectedSuggestionIndex(0);
      }

      // 디바운싱
      if (emailCheckTimer) clearTimeout(emailCheckTimer);
      setEmailCheckMessage("");

      if (processedValue.includes("@") && processedValue.includes(".")) {
        const timer = setTimeout(() => {
          checkEmailAvailability(processedValue);
        }, 500);
        setEmailCheckTimer(timer);
      } else {
        setIsEmailValid(true);
      }
    }
  };

  const handleEmailDomainSelect = (domain) => {
    const atIndex = formData.email.indexOf("@");
    if (atIndex !== -1) {
      const localPart = formData.email.substring(0, atIndex + 1);
      const newEmail = localPart + domain;
      setFormData((prev) => ({ ...prev, email: newEmail }));
      checkEmailAvailability(newEmail);
    }
    setShowEmailSuggestions(false);
    setSelectedSuggestionIndex(0);
  };

  const handleEmailBlur = () => {
    setTimeout(() => {
      setShowEmailSuggestions(false);
      setSelectedSuggestionIndex(0);
    }, 200);
  };

  const handleEmailKeyDown = (e) => {
    if (!showEmailSuggestions) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < emailDomains.length - 1 ? prev + 1 : 0
        );
        break;
      case "Tab":
        e.preventDefault();
        if (e.shiftKey) {
          setSelectedSuggestionIndex((prev) =>
            prev > 0 ? prev - 1 : emailDomains.length - 1
          );
        } else {
          setSelectedSuggestionIndex((prev) =>
            prev < emailDomains.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : emailDomains.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (
          selectedSuggestionIndex >= 0 &&
          selectedSuggestionIndex < emailDomains.length
        ) {
          handleEmailDomainSelect(emailDomains[selectedSuggestionIndex]);
        }
        break;
      case "Escape":
        setShowEmailSuggestions(false);
        setSelectedSuggestionIndex(0);
        break;
      default:
        break;
    }
  };

  const checkEmailAvailability = async (email) => {
    if (!email || !email.includes("@") || !email.includes(".")) return;
    try {
      const response = await api.post("/api/users/auth/check-email", { email });
      if (response.data.success && response.data.available) {
        setIsEmailValid(true);
        setEmailCheckMessage("사용 가능한 이메일입니다.");
      } else {
        setIsEmailValid(false);
        setEmailCheckMessage(
          "이미 등록된 이메일입니다. 다른 이메일을 사용해주세요."
        );
      }
    } catch {
      setEmailCheckMessage("");
    }
  };

  const checkUsernameDuplicate = async () => {
    if (!formData.username) {
      setUsernameCheckMessage("아이디를 입력해주세요.");
      return;
    }
    setError("");
    try {
      const response = await api.post("/api/users/auth/check-username", {
        username: formData.username,
      });
      if (response.data.success && response.data.available) {
        setIsUsernameChecked(true);
        setUsernameCheckMessage("사용 가능한 아이디입니다.");
      } else {
        setIsUsernameChecked(false);
        setUsernameCheckMessage("이미 사용 중인 아이디입니다.");
      }
    } catch (error) {
      if (error.response?.status === 409) {
        setIsUsernameChecked(false);
        setUsernameCheckMessage("이미 사용 중인 아이디입니다.");
      } else {
        setUsernameCheckMessage("중복체크 중 오류가 발생했습니다.");
      }
    }
  };

  // 이미지 업로드 완료 콜백
  const handleImagesUpload = (images) => {
    setUploadedImages(images || []);
    console.log("회원가입에서 받은 이미지 정보:", images);
  };

  const registerHandler = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // 아이디 중복체크 확인
    if (!isUsernameChecked) {
      setError("아이디 중복체크를 완료해주세요.");
      setIsLoading(false);
      return;
    }

    // 이메일 중복 확인
    if (!isEmailValid && emailCheckMessage) {
      setError("이미 등록된 이메일입니다. 다른 이메일을 사용해주세요.");
      setIsLoading(false);
      return;
    }

    // 비밀번호 일치
    if (formData.password !== formData.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      setIsLoading(false);
      return;
    }

    // 필수 필드
    if (
      !formData.username ||
      !formData.password ||
      !formData.email ||
      !formData.nickname ||
      !formData.phone
    ) {
      setError(
        "아이디, 비밀번호, 이메일, 닉네임, 연락처는 필수 입력 항목입니다."
      );
      setIsLoading(false);
      return;
    }

    // 닉네임
    if (!validateNickname(formData.nickname)) {
      if (formData.nickname.length < 2) {
        setError("닉네임은 2자 이상이어야 합니다.");
      } else if (formData.nickname.length > 20) {
        setError("닉네임은 20자 이하여야 합니다.");
      } else {
        setError("닉네임은 한글과 영어만 사용할 수 있습니다.");
      }
      setIsLoading(false);
      return;
    }

    // 연락처
    if (!validatePhoneNumber(formData.phone)) {
      setError(
        "올바른 연락처 형식을 입력해주세요 (예: 010-1234-5678 또는 01012345678)"
      );
      setIsLoading(false);
      return;
    }

    try {
      const requestData = {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        nickname: formData.nickname,
        gender: formData.gender || null,
        phone_number: formData.phone || null,
      };

      const response = await api.post("/api/users/auth/register", requestData, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.data.success) {
        // 회원 생성 후 이미지 저장(가능하면)
        const user = response.data.user || response.data.data?.user;
        const tokens = response.data.tokens || response.data.data?.tokens;
        const userId = user?.id;

        if (userId) {
          // uploadedImages의 구조가 (serverUrl | url | src) 중 하나를 가질 수 있음에 대비
          const primaryUrl =
            uploadedImages?.[0]?.serverUrl ||
            uploadedImages?.[0]?.url ||
            uploadedImages?.[0]?.src;

          try {
            await api.post(`/api/users/${userId}/images`, {
              image_url:
                primaryUrl ||
                "https://placehold.co/400x400/FF5733/FFFFFF?text=User+House+Image",
              storage_type: "url",
            });
          } catch (imageError) {
            console.error("사용자 이미지 추가 실패:", imageError);
          }
        }

        // 자동 로그인
        login(user, tokens);
        navigate("/");
      } else {
        setError(response.data.message || "회원가입에 실패했습니다.");
      }
    } catch (error) {
      console.error("회원가입 오류:", error);
      console.error("에러 응답 데이터:", error.response?.data);

      if (error.response?.status === 409) {
        const errorData = error.response.data;
        if (errorData.field === "username") {
          setError("이미 사용 중인 아이디입니다. 다른 아이디를 선택해주세요.");
          setIsUsernameChecked(false);
        } else if (errorData.field === "email") {
          setError("이미 등록된 이메일입니다. 다른 이메일을 사용해주세요.");
        } else if (errorData.message) {
          setError(errorData.message);
        } else {
          setError("이미 존재하는 정보입니다. 다른 정보를 입력해주세요.");
        }
      } else if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        setValidationErrors(errors);
        if (errors.password) {
          setError("비밀번호 요구사항을 확인해주세요.");
        } else if (errors.username) {
          setError("사용자명을 확인해주세요.");
        } else if (errors.email) {
          setError("이메일을 확인해주세요.");
        } else {
          setError(error.response.data.message || "입력 정보를 확인해주세요.");
        }
      } else if (error.response) {
        setError(error.response.data.message || "회원가입에 실패했습니다.");
      } else {
        setError("서버와 연결할 수 없습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles["register-container"]} ref={formRef}>
      <h2>회원가입</h2>
      <h4 style={{ color: "var(--color-text-secondary)", textAlign: "center" }}>
        우리가족이 되어주세요!
      </h4>

      <form onSubmit={registerHandler}>
        {error && (
          <div ref={errorRef} className={styles["error-message"]}>
            {error}
          </div>
        )}

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
              autoComplete="username"
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
            <div
              className={`${styles["check-message"]} ${
                isUsernameChecked ? styles["success"] : styles["error"]
              }`}
            >
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
            autoComplete="new-password"
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
              <div
                className={`${styles["requirement-item"]} ${
                  passwordValidation.minLength ? styles["valid"] : styles["invalid"]
                }`}
              >
                {passwordValidation.minLength ? "✓" : "✗"} 8자 이상
              </div>
              <div
                className={`${styles["requirement-item"]} ${
                  passwordValidation.hasLetter ? styles["valid"] : styles["invalid"]
                }`}
              >
                {passwordValidation.hasLetter ? "✓" : "✗"} 영문자 포함
              </div>
              <div
                className={`${styles["requirement-item"]} ${
                  passwordValidation.hasNumber ? styles["valid"] : styles["invalid"]
                }`}
              >
                {passwordValidation.hasNumber ? "✓" : "✗"} 숫자 포함
              </div>
              <div
                className={`${styles["requirement-item"]} ${
                  passwordValidation.hasSpecialChar
                    ? styles["valid"]
                    : styles["invalid"]
                }`}
              >
                {passwordValidation.hasSpecialChar ? "✓" : "✗"} 특수문자 포함 (@$!%*?&)
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
            autoComplete="new-password"
          />
        </div>

        {/* 이메일 */}
        <div className={styles["form-group"]}>
          <label htmlFor="email">이메일 *</label>
          <div className={styles["email-container"]}>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleEmailBlur}
              onKeyDown={handleEmailKeyDown}
              placeholder="예: user@naver.com"
              required
              autoComplete="email"
            />
            {showEmailSuggestions && (
              <div className={styles["email-suggestions"]}>
                {emailDomains.map((domain, index) => {
                  const atIndex = formData.email.indexOf("@");
                  const localPart =
                    atIndex !== -1
                      ? formData.email.substring(0, atIndex + 1)
                      : formData.email + "@";
                  const isSelected = index === selectedSuggestionIndex;
                  const suggestionClass = isSelected
                    ? styles["suggestion-item"] + " " + styles["selected"]
                    : styles["suggestion-item"];

                  return (
                    <div
                      key={domain}
                      className={suggestionClass}
                      onClick={() => handleEmailDomainSelect(domain)}
                      onMouseEnter={() => setSelectedSuggestionIndex(index)}
                    >
                      {localPart}
                      {domain}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {emailCheckMessage && (
            <div
              className={`${styles["email-check-message"]} ${
                isEmailValid ? styles["success"] : styles["error"]
              }`}
            >
              {emailCheckMessage}
            </div>
          )}
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
            placeholder="닉네임을 입력해주세요 (한글, 영어 2-20자)"
            required
            autoComplete="nickname"
          />
          {nicknameError && (
            <div className={`${styles["email-check-message"]} ${styles["error"]}`}>
              {nicknameError}
            </div>
          )}
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
          <label htmlFor="phone">연락처 *</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="연락처를 입력해주세요 (예: 010-1234-5678)"
            required
            autoComplete="tel"
          />
          {validationErrors.phone_number && (
            <div className={styles["validation-error"]}>
              {validationErrors.phone_number}
            </div>
          )}
        </div>

        {/* 사용자 집 이미지 */}
        <div className={styles["form-group"]}>
          <label>사용자 집 이미지 (프로필 이미지로도 사용됩니다)</label>
          <ImageUploader onImagesChange={handleImagesUpload} />
          {uploadedImages?.length > 0 && (
            <div className={styles["upload-status"]}>
              ✅ {uploadedImages.length}개 이미지 선택/업로드
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !isUsernameChecked}
          className={styles["submit-button"]}
        >
          {isLoading ? "가입 중..." : "가입하기"}
        </button>
      </form>
    </div>
  );
};

export default Register;
