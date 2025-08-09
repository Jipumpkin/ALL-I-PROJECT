import React, { useState } from "react";
import styles from "./Register.module.css";
import ImageUploader from "../ImageUploader/ImageUploader";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const nav = useNavigate();

  const registerHandler = (e) => {
    e.preventDefault();
    // nav("/");
  };

  return (
    <div className={styles["register-container"]}>
      <h2>회원가입</h2>
      <h4 style={{ color: "skyblue", textAlign: "center" }}>
        우리가족이 되어주세요!
      </h4>

      <form onSubmit={registerHandler}>
        <div className={styles["form-group"]}>
          <label htmlFor="username">아이디</label>
          <input type="text" id="username" name="username" />
        </div>
        <div className={styles["form-group"]}>
          <label htmlFor="password">비밀번호</label>
          <input type="password" id="password" name="password" />
        </div>
        <div className={styles["form-group"]}>
          <label htmlFor="confirm-password">비밀번호 재확인</label>
          <input
            type="password"
            id="confirm-password"
            name="confirm-password"
          />
        </div>
        <div className={styles["form-group"]}>
          <label htmlFor="name">이름</label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="이름을(를) 입력해주세요"
          />
        </div>
        <div className={styles["form-group"]}>
          <label htmlFor="phone">연락처</label>
          <input
            type="text"
            id="phone"
            name="phone"
            placeholder="연락쳐를 입력해주세요"
          />
        </div>
        <div className={styles["form-group"]}>
          <label htmlFor="birthdate">생년월일</label>
          <div className={styles["birthdate-select"]}>
            <select id="birth-year" name="birth-year">
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
            <select id="birth-month" name="birth-month">
              <option value="">월</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
            <select id="birth-day" name="birth-day">
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
        <button type="submit">가입하기</button>
      </form>
    </div>
  );
};

export default Register;
