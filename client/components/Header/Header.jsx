import React, { useState } from "react";
import styles from "./Header.module.css";
import LoginModal from "../LoginModal/LoginModal"; // LoginModal 컴포넌트 import

const Header = () => {
  const [isModalOpen, setIsModalOpen] = useState(false); // 모달 상태 관리

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  return (
    <>
      <header className={styles["header"]}>
        <a href="/" className={styles["logo-container"]}>
          <span className={styles["imgFoot"]}>
            <img src="/images/foot.png" alt="로고" width="40" />
          </span>
          <span className={styles["logo-text"]}>PAWPAW</span>
          <span className={styles["imgFoot"]}>
            <img src="/images/foot.png" alt="로고" width="40" />
          </span>
        </a>
        {/* 햄버거 메뉴 클릭 시 모달 토글 */}
        <div
          className={`${styles["hamburger-menu"]} ${
            isModalOpen ? styles["active"] : ""
          }`}
          onClick={toggleModal}
        >
          <div className={styles["bar"]}></div>
          <div className={styles["bar"]}></div>
          <div className={styles["bar"]}></div>
        </div>
      </header>

      {/* isModalOpen이 true일 때 LoginModal 렌더링 */}
      {isModalOpen && <LoginModal setIsOpen={setIsModalOpen} />}
    </>
  );
};

export default Header;
