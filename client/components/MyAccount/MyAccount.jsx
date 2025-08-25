import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../src/context/AuthContext';
import axios from "../../axios";
import styles from './MyAccount.module.css';

const MyAccount = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [editedUser, setEditedUser] = useState({
    nickname: '',
    phone_number: '',
    gender: ''
  });
  const [userImages, setUserImages] = useState([]);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    if (user) {
      setEditedUser({
        nickname: user.nickname || '',
        phone_number: user.phone_number || '',
        gender: user.gender || ''
      });
      fetchUserImages();
    }
  }, [user, fetchUserImages]);

  // 사용자 이미지 불러오기
  const fetchUserImages = useCallback(async () => {
    const userId = user?.id || user?.user_id;
    if (userId) {
      try {
        const response = await axios.get(`/api/users/${userId}/images`);
        if (response.data.success) {
          setUserImages(response.data.data);
        }
      } catch (err) {
        console.error('사용자 이미지 조회 실패:', err);
      }
    }
  }, [user]);

  // 이미지 업데이트
  const handleImageUpdate = async (imageUrl) => {
    const userId = user?.id || user?.user_id;
    if (userId) {
      try {
        await axios.post(`/api/users/${userId}/images`, {
          image_url: imageUrl
        });
        fetchUserImages(); // 이미지 목록 새로고침
        setShowImageModal(false);
        setSuccess('이미지가 성공적으로 업데이트되었습니다.');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('이미지 업데이트 중 오류가 발생했습니다.');
        setTimeout(() => setError(''), 5000);
      }
    }
  };

  // 파일 업로드 핸들러
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        handleImageUpdate(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveClick = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await axios.put('/api/users/profile', editedUser);
      
      if (response.data.success) {
        setSuccess('프로필이 성공적으로 수정되었습니다.');
        // AuthContext의 user 정보 업데이트
        updateUser(response.data.data.profile);
        setIsEditing(false);
        
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || '프로필 수정 중 오류가 발생했습니다.';
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = () => {
    setEditedUser({
      nickname: user?.nickname || '',
      phone_number: user?.phone_number || '',
      gender: user?.gender || ''
    });
    setIsEditing(false);
    setError('');
    setSuccess('');
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

  const handleAccountDelete = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      setError('');

      if (!deletePassword.trim()) {
        setError('현재 비밀번호를 입력해주세요.');
        return;
      }

      const response = await axios.delete('/api/users/account', {
        data: { password: deletePassword }
      });

      if (response.data.success) {
        alert('회원탈퇴가 완료되었습니다.');
        logout();
        navigate('/');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || '회원탈퇴 처리 중 오류가 발생했습니다.';
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeletePassword('');
    setError('');
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
        
        {/* 메시지 표시 */}
        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}
        {success && (
          <div className={styles.successMessage}>
            {success}
          </div>
        )}

        <div className={styles.userInfo}>
          <h3>사용자 정보</h3>
          
          {/* 읽기 전용 정보 */}
          <div className={styles.readonlySection}>
            <div className={styles.infoItem}>
              <strong>아이디:</strong> <span>{user.username}</span>
            </div>
            <div className={styles.infoItem}>
              <strong>이메일:</strong> <span>{user.email}</span>
            </div>
            <div className={styles.infoItem}>
              <strong>가입일:</strong> <span>{new Date(user.created_at).toLocaleDateString('ko-KR')}</span>
            </div>
          </div>

          {/* 수정 가능한 정보 */}
          <div className={styles.editableSection}>
            <h4>수정 가능한 정보</h4>
            {isEditing ? (
              <>
                <div className={styles.infoItem}>
                  <label><strong>닉네임:</strong></label>
                  <input
                    type="text"
                    value={editedUser.nickname}
                    onChange={(e) => handleInputChange('nickname', e.target.value)}
                    className={styles.editInput}
                    placeholder="닉네임을 입력하세요"
                    maxLength="20"
                  />
                </div>
                <div className={styles.infoItem}>
                  <label><strong>연락처:</strong></label>
                  <input
                    type="text"
                    value={editedUser.phone_number}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    className={styles.editInput}
                    placeholder="010-1234-5678"
                    pattern="010-[0-9]{4}-[0-9]{4}"
                  />
                </div>
                <div className={styles.infoItem}>
                  <label><strong>성별:</strong></label>
                  <select
                    value={editedUser.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className={styles.editSelect}
                  >
                    <option value="">선택하지 않음</option>
                    <option value="male">남성</option>
                    <option value="female">여성</option>
                  </select>
                </div>
                <div className={styles.editButtons}>
                  <button 
                    onClick={handleSaveClick} 
                    className={styles.saveButton}
                    disabled={loading}
                  >
                    {loading ? '저장 중...' : '저장'}
                  </button>
                  <button 
                    onClick={handleCancelClick} 
                    className={styles.cancelButton}
                    disabled={loading}
                  >
                    취소
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.infoItem}>
                  <strong>닉네임:</strong> <span>{user.nickname || '설정되지 않음'}</span>
                </div>
                <div className={styles.infoItem}>
                  <strong>연락처:</strong> <span>{user.phone_number || '설정되지 않음'}</span>
                </div>
                <div className={styles.infoItem}>
                  <strong>성별:</strong> <span>
                    {user.gender === 'male' ? '남성' : 
                     user.gender === 'female' ? '여성' : 
                     user.gender === 'other' ? '기타' : '설정되지 않음'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <strong>등록 사진:</strong>
                  <div className={styles.photoSection}>
                    {userImages.length > 0 ? (
                      <div className={styles.currentPhoto}>
                        <img 
                          src={userImages[0].image_url} 
                          alt="사용자 등록 사진" 
                          className={styles.profileImage}
                          onClick={() => setShowImageModal(true)}
                        />
                        <button 
                          onClick={() => setShowImageModal(true)}
                          className={styles.changePhotoButton}
                        >
                          사진 변경
                        </button>
                      </div>
                    ) : (
                      <div className={styles.noPhoto}>
                        <span>등록된 사진이 없습니다</span>
                        <button 
                          onClick={() => setShowImageModal(true)}
                          className={styles.addPhotoButton}
                        >
                          사진 추가
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className={styles.menuSection}>
          <h3>메뉴</h3>
          <div className={styles.menuButtons}>
            <button className={styles.menuButton} onClick={handleEditClick}>
              내 정보 수정
            </button>
            <button className={styles.menuButton} onClick={handleAdoptionHistory}>
              입양 신청 내역
            </button>
          </div>
        </div>

        <div className={styles.actions}>
          <button onClick={handleLogout} className={styles.logoutButton} disabled={loading}>
            로그아웃
          </button>
          <button onClick={handleAccountDelete} className={styles.deleteButton} disabled={loading}>
            회원탈퇴
          </button>
        </div>
      </div>

      {/* 회원탈퇴 확인 모달 */}
      {showDeleteModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>회원탈퇴 확인</h3>
            <p>정말로 탈퇴하시겠습니까?</p>
            <p className={styles.warning}>이 작업은 되돌릴 수 없습니다.</p>
            
            <div className={styles.passwordInput}>
              <label>현재 비밀번호 확인:</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="현재 비밀번호를 입력하세요"
                className={styles.editInput}
              />
            </div>

            <div className={styles.modalButtons}>
              <button 
                onClick={handleDeleteConfirm} 
                className={styles.confirmDeleteButton}
                disabled={loading || !deletePassword.trim()}
              >
                {loading ? '처리 중...' : '탈퇴하기'}
              </button>
              <button 
                onClick={handleDeleteCancel} 
                className={styles.cancelButton}
                disabled={loading}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이미지 수정 모달 */}
      {showImageModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>프로필 사진 변경</h3>
            {userImages.length > 0 && (
              <div className={styles.currentImagePreview}>
                <p>현재 이미지:</p>
                <img 
                  src={userImages[0].image_url} 
                  alt="현재 사진" 
                  className={styles.previewImage}
                />
              </div>
            )}
            
            <div className={styles.imageOptions}>
              <label className={styles.fileUploadLabel}>
                새 이미지 업로드
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
              
              <button 
                onClick={() => handleImageUpdate('https://placehold.co/400x400/33A3FF/FFFFFF?text=Default+Image')}
                className={styles.defaultImageButton}
              >
                기본 이미지로 변경
              </button>
            </div>

            <div className={styles.modalButtons}>
              <button 
                onClick={() => setShowImageModal(false)}
                className={styles.cancelButton}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAccount;