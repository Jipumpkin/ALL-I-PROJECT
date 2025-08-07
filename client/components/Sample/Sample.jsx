import React from 'react'
import './Sample.css'
const Sample = () => {
  return (
    <div className="container">
        <div className="image-container">
            <img src="image1.jpg" alt="첫 번째 이미지" className="img-left" />
            <img src="image2.jpg" alt="두 번째 이미지" className="img-right" />
        </div>
        <div className="button-container">
            <button className="btn login-btn">로그인</button>
            <button className="btn signup-btn">회원가입</button>
            <button className="btn add-photo-btn">사진 추가</button>
        </div>
    </div>
  )
}

export default Sample