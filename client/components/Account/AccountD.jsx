import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AccountD.module.css';

const AccountD = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});

  const handleConfirm = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!name.trim()) newErrors.name = '이름을 입력해주세요.';
    if (!email.includes('@')) newErrors.email = '유효한 이메일을 입력해주세요.';
    if (!password) newErrors.password = '비밀번호를 입력해주세요.';
    if (!reason) newErrors.reason = '탈퇴 사유를 선택해주세요.';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      console.log({ name, email, password, reason });
      alert('본인 확인이 완료되었습니다.');
    }
  };

  return (
    <div className={styles["accountd-container"]}>
      <div className={styles["header"]}>
        <h2 className={styles["accountd-title"]}>회원 탈퇴</h2>
        <button onClick={() => navigate('/my-account')} className={styles["back-button"]}>
          마이메뉴로 돌아가기
        </button>
      </div>

      <div className={styles["accountd-box"]}>
        <p className={styles["notice-title"]}>회원탈퇴 전, 유의사항을 확인해 주시기 바랍니다.</p>

        <div className={styles["notice-list"]}>
          <p>🐾 회원 탈퇴 시 회원전용 웹 서비스 이용이 불가합니다.</p>
          <p>🐾 저장한 이미지와 합성기록은 탈퇴와 함께 삭제됩니다.</p>
          <p>🐾 동일한 이메일로의 재가입은 언제나 가능합니다.</p>
        </div>

        <p className={`${styles["thank-you"]} ${styles["animate-fadein"]}`}>
          그동안 <strong>PAW PAW</strong>와 함께해 주셔서 진심으로 감사드리며, <br />
          언제든 다시 돌아오시길 기다리겠습니다 🐶
        </p>
      </div>

      <div className={styles["verify-info-bold"]}>
        <h3>본인 확인</h3>
        <p>보안을 위해 회원님의 이름과 계정 이메일 및 비밀번호를 확인합니다.</p>
      </div>

      <form className={styles["accountd-form"]} onSubmit={handleConfirm}>
        <div className={styles["input-group"]}>
          <label htmlFor="name">이름</label>
          <input
            type="text"
            id="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {errors.name && <p className={styles["error"]}>{errors.name}</p>}
        </div>

        <div className={styles["input-group"]}>
          <label htmlFor="email">이메일</label>
          <input
            type="email"
            id="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && <p className={styles["error"]}>{errors.email}</p>}
        </div>

        <div className={styles["input-group"]}>
          <label htmlFor="password">비밀번호</label>
          <input
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password && <p className={styles["error"]}>{errors.password}</p>}
        </div>

        <div className={styles["input-group"]}>
          <label htmlFor="reason">탈퇴 사유</label>
          <select
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            <option value="">선택해주세요</option>
            <option value="서비스 불만족">서비스 불만족</option>
            <option value="재가입 예정">재가입 예정</option>
            <option value="사용 빈도 낮음">사용 빈도 낮음</option>
            <option value="기타">기타</option>
          </select>
          {errors.reason && <p className={styles["error"]}>{errors.reason}</p>}
        </div>

        <div className={styles["button-actions"]}>
          <button type="button" onClick={() => navigate('/my-account')} className={styles["cancel-btn"]}>
            취소
          </button>
          <button type="submit" className={styles["confirm-btn"]}>
            탈퇴하기
          </button>
        </div>
      </form>
    </div>
  )
};

export default AccountD;
