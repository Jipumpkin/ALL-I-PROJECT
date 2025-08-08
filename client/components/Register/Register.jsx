import React, { useState } from "react";
import "./Register.css";
import ImageUploader from "../ImageUploader/ImageUploader";
import { useNavigate } from "react-router-dom";
import api from '../../axios.js'

const Register = () => {
  const nav = useNavigate();
  // Front -> Back

const registerHandler = (e) => {
    e.preventDefault();
    
    
    console.log(e.target);

    e.target.map();
    // nav("/");
  }

const [id, setId] = useState("");
const [pw, setPw] = useState("");
const [contact, setContact] = useState("");
const [birth, setBirth] = useState("");
const [name, setName] = useState("");

const sendData = async (event) => {
        event.preventDefault();
        try {
            const res = await api.post("/login", {
                id : id,
                pw : pw
            });
            console.log(res);
            if(res.data.result === "success") {
                setName(res.data.name);
                window.alert(name+ "님 환영합니다");
            } else {
                window.alert("잘못된 아이디 혹은 비밀번호입니다.");
            }
        } catch (err) {
            console.error("/getData axios error", err);
        }
    }
  return (
    <div className="register-container">
      <h2>회원가입</h2>
      <h4 style={{ color: "skyblue", textAlign: "center" }}>
        우리가족이 되어주세요!
      </h4>

      <form>
        <div className="form-group">
          <label htmlFor="username">아이디</label>
          <input type="text" id="username" name="username" />
        </div>
        <div className="form-group">
          <label htmlFor="password">비밀번호</label>
          <input type="password" id="password" name="password" />
        </div>
        <div className="form-group">
          <label htmlFor="confirm-password">비밀번호 재확인</label>
          <input
            type="password"
            id="confirm-password"
            name="confirm-password"
          />
        </div>
        <div className="form-group">
          <label htmlFor="name">이름</label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="이름을(를) 입력해주세요"
          />
        </div>
        <div className="form-group">
          <label htmlFor="phone">연락처</label>
          <input
            type="text"
            id="phone"
            name="phone"
            placeholder="연락쳐를 입력해주세요"
          />
        </div>
        <div className="form-group">
          <label htmlFor="birthdate">생년월일</label>
          <div className="birthdate-select">
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
