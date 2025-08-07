import React from 'react';
import './ForgotPassword.css';

const ForgotPassword = () => {
  return (
    <div className="forgot-password-container">
      <div className="forgot-password-box">
        <div className="forgot-password-form">
          <h2>비밀번호 찾기</h2>
          <form>
            <div className="input-group">
              <label htmlFor="name">이름</label>
              <input type="text" id="name" name="name" placeholder="이름을 입력해주세요" />
            </div>
            <div className="input-group">
              <label htmlFor="id">아이디</label>
              <input type="text" id="id" name="id" placeholder="아이디를 입력해주세요" />
            </div>
            <div className="input-group">
              <label htmlFor="phone">연락처</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                placeholder="- 없이 입력하세요"
                onInput={(e) => {
                  e.target.value = e.target.value.replace(/[^0-9]/g, '');
                }}
              />
            </div>
            <button type="submit" className="find-pw-button">비밀번호 찾기</button>
            <div className='login-links'>
              <a href='/login'>로그인하기</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;