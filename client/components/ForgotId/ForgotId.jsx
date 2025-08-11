import React from 'react';
import styles from './ForgotId.module.css';
import { Link } from 'react-router-dom';

const ForgotId = () => {
  return (
    <div className={styles["forgot-id-container"]}>
      <div className={styles["forgot-id-box"]}>
        <div className={styles["forgot-id-title"]}>
          <h2>아이디 찾기</h2>
          <form>
            <div className={styles["input-group"]}>
              <label htmlFor="name">이름</label>
              <input type="text" id="name" name="name" placeholder='이름을 입력해주세요' />
            </div>
            <div className={styles["input-group"]}>
              <label htmlFor="phone">연락처</label>
              <input type="tel" id="phone" name="phone" placeholder='- 없이 입력하세요'
                onInput={(e) => {
                  e.target.value = e.target.value.replace(/[^0-9]/g, '');
                }} />
            </div>
            <button type="submit" className={styles["find-id-button"]}>아이디 찾기</button>
            <div className={styles['login-links']}>
              <Link to="/forgot-password" className={styles["forgot-password-link"]}>비밀번호 찾기</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

<<<<<<< HEAD
export default ForgotId;
=======
export default ForgotId;
>>>>>>> 620054dd370e7ff633e2cb8a0a0a18cb26ed211d
