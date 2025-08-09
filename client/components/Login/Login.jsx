import React from 'react';
import styles from './Login.module.css';
import { Link } from 'react-router-dom';

const Login = () => {
  return (
    <div className={styles["login-container"]}>
      <div className={styles["login-box"]}>
        <div className={styles["login-form"]}>
          <h2>로그인</h2>
          <form>
            <div className={styles["input-group"]}>
              <label htmlFor="username">아이디</label>
              <input type="text" id="username" name="username" />
            </div>
            <div className={styles["input-group"]}>
              <label htmlFor="password">비밀번호</label>
              <input type="password" id="password" name="password" />
            </div>
            <button type="submit" className={styles["login-button"]}>로그인</button>
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
