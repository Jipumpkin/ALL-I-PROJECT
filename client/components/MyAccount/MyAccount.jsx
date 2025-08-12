import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../src/context/AuthContext';
import styles from './MyAccount.module.css';

const MyAccount = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    name: user?.name || user?.username || '',
    email: user?.email || '',
    username: user?.username || ''
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveClick = () => {
    // 여기에 API 호출로 사용자 정보 업데이트 로직 추가
    console.log('사용자 정보 업데이트:', editedUser);
    setIsEditing(false);
  };

  const handleCancelClick = () => {
    setEditedUser({
      name: user?.name || user?.username || '',
      email: user?.email || '',
      username: user?.username || ''
    });
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditedUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAdoptionHistory = () => {
    navigate('/adoption-history');
  };

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.loginRequired}>
          <h2>로그인이 필요합니다</h2>
          <p>마이메뉴를 이용하려면 로그인해주세요.</p>
          <button onClick={() => navigate('/login')} className={styles.button}>
            로그인하러 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.profile}>
        <h2>마이메뉴</h2>
        
        <div className={styles.userInfo}>
          <h3>사용자 정보</h3>
          {isEditing ? (
            <>
              <div className={styles.infoItem}>
                <strong>이름:</strong>
                <input
                  type="text"
                  value={editedUser.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={styles.editInput}
                />
              </div>
              <div className={styles.infoItem}>
                <strong>이메일:</strong>
                <input
                  type="email"
                  value={editedUser.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={styles.editInput}
                />
              </div>
              <div className={styles.infoItem}>
                <strong>아이디:</strong>
                <input
                  type="text"
                  value={editedUser.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className={styles.editInput}
                />
              </div>
              <div className={styles.editButtons}>
                <button onClick={handleSaveClick} className={styles.saveButton}>저장</button>
                <button onClick={handleCancelClick} className={styles.cancelButton}>취소</button>
              </div>
            </>
          ) : (
            <>
              <div className={styles.infoItem}>
                <strong>이름:</strong> {user.name || user.username}
              </div>
              <div className={styles.infoItem}>
                <strong>이메일:</strong> {user.email}
              </div>
              <div className={styles.infoItem}>
                <strong>아이디:</strong> {user.username}
              </div>
            </>
          )}
        </div>

        <div className={styles.menuSection}>
          <h3>메뉴</h3>
          <div className={styles.menuButtons}>
            <button className={styles.menuButton} onClick={handleEditClick}>내 정보 수정</button>
            <button className={styles.menuButton} onClick={handleAdoptionHistory}>입양 신청 내역</button>
          </div>
        </div>

        <div className={styles.actions}>
          <button onClick={handleLogout} className={styles.logoutButton}>
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyAccount;