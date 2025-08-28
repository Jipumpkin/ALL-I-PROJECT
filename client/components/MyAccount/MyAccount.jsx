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
    gender: '',
    selectedImage: null // 임시로 선택된 이미지 저장
  });
  const [userImages, setUserImages] = useState([]);

  useEffect(() => {
    if (user) {
      setEditedUser({
        nickname: user.nickname || '',
        phone_number: user.phone_number || '',
        gender: user.gender || '',
        selectedImage: null
      });
      fetchUserImages();
    }
  }, [user]);

  // 사용자 이미지 불러오기
  const fetchUserImages = useCallback(async () => {
    const userId = user?.id || user?.user_id;
    if (userId) {
      try {
        const response = await axios.get(`/users/${userId}/images`);
        if (response.data.success) {
          setUserImages(response.data.data);
        }
      } catch (err) {
        console.error('사용자 이미지 조회 실패:', err);
      }
    }
  }, [user?.id, user?.user_id]);

  // 프로필 이미지 업데이트 (통합 함수)
  const updateProfileImage = async (imageData) => {
    const userId = user?.id || user?.user_id;
    if (!userId) return false;

    try {
      let requestData;
      
      if (typeof imageData === 'string') {
        // URL 형태의 이미지
        requestData = {
          image_url: imageData,
          storage_type: 'url'
        };
      } else {
        // Base64 형태의 이미지
        requestData = imageData;
      }

      await axios.put(`/users/${userId}/images/profile`, requestData);
      fetchUserImages(); // 이미지 목록 새로고침
      return true;
    } catch (err) {
      console.error('이미지 업데이트 오류:', err);
      const errorMessage = err.response?.data?.message || '이미지 변경 중 오류가 발생했습니다.';
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
      return false;
    }
  };

  // 파일 업로드 핸들러 (수정 모드에서만)
  const handleFileUpload = (e) => {
    if (!isEditing) {
      setError('수정 모드에서만 이미지를 변경할 수 있습니다.');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    const file = e.target.files[0];
    if (file) {
      // 파일 크기 검증 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        setError('이미지 파일은 5MB 이하만 업로드 가능합니다.');
        setTimeout(() => setError(''), 5000);
        return;
      }

      // 파일 타입 검증
      if (!file.type.startsWith('image/')) {
        setError('이미지 파일만 업로드 가능합니다.');
        setTimeout(() => setError(''), 5000);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        // editedUser.selectedImage에 임시 저장
        const imageData = {
          image_data: event.target.result,
          preview_data: event.target.result,
          filename: file.name,
          mime_type: file.type,
          file_size: file.size,
          storage_type: 'base64'
        };
        
        setEditedUser(prev => ({ ...prev, selectedImage: imageData }));
        console.log('이미지 임시 선택됨:', file.name);
      };
      reader.onerror = () => {
        setError('이미지 읽기에 실패했습니다.');
        setTimeout(() => setError(''), 5000);
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

      // 1. 프로필 정보 업데이트
      const profileData = {
        nickname: editedUser.nickname,
        phone_number: editedUser.phone_number,
        gender: editedUser.gender
      };
      
      const response = await axios.put('/users/profile', profileData);
      
      if (response.data.success) {
        // 2. 이미지가 선택된 경우 이미지 업데이트
        if (editedUser.selectedImage) {
          const imageUpdateSuccess = await updateProfileImage(editedUser.selectedImage);
          if (!imageUpdateSuccess) {
            return; // 이미지 업데이트가 실패한 경우 전체 프로세스 중단
          }
        }
        
        setSuccess('프로필이 성공적으로 수정되었습니다.');
        // AuthContext의 user 정보 업데이트
        updateUser(response.data.data.profile);
        setIsEditing(false);
        
        // selectedImage 초기화
        setEditedUser(prev => ({ ...prev, selectedImage: null }));
        
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
      gender: user?.gender || '',
      selectedImage: null
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

      const response = await axios.delete('/users/account', {
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
              <strong>가입일:</strong> <span>
                {user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '정보 없음'}
              </span>
            </div>
          </div>

          {/* 수정 가능한 정보 */}
          <div className={styles.editableSection}>
            <div className={styles.editableSectionHeader}>
              <h4>수정 가능한 정보</h4>
              {!isEditing && (
                <button onClick={handleEditClick} className={styles.editIcon}>
                  ✏️
                </button>
              )}
            </div>
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
                    <option value="unknown">선택하지 않음</option>
                    <option value="male">남성</option>
                    <option value="female">여성</option>
                  </select>
                </div>
                <div className={styles.infoItem}>
                  <label><strong>프로필 사진:</strong></label>
                  <div className={styles.photoSection}>
                    {/* 현재 이미지 또는 선택된 이미지 표시 */}
                    {editedUser.selectedImage ? (
                      <div className={styles.selectedPhotoPreview}>
                        <img 
                          src={editedUser.selectedImage.preview_data || editedUser.selectedImage.image_url || editedUser.selectedImage}
                          alt="선택된 이미지" 
                          className={styles.profileImage}
                        />
                        <span className={styles.selectedLabel}>✓ 새 이미지 선택됨</span>
                      </div>
                    ) : userImages.length > 0 ? (
                      <div className={styles.currentPhoto}>
                        <img 
                          src={userImages[0].storage_type === 'base64' && userImages[0].image_data 
                            ? userImages[0].image_data 
                            : userImages[0].image_url} 
                          alt="현재 사진" 
                          className={styles.profileImage}
                        />
                        <span className={styles.currentLabel}>현재 이미지</span>
                      </div>
                    ) : (
                      <div className={styles.noPhoto}>
                        <span>등록된 사진이 없습니다</span>
                      </div>
                    )}
                    
                    <div className={styles.imageEditButtons}>
                      <label className={styles.fileUploadLabel}>
                        📷 새 이미지 업로드
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleFileUpload}
                          style={{ display: 'none' }}
                          disabled={loading}
                        />
                      </label>
                      
                      <button 
                        onClick={() => setEditedUser(prev => ({ ...prev, selectedImage: 'https://placehold.co/400x400/33A3FF/FFFFFF?text=Default+Image' }))}
                        className={styles.defaultImageButton}
                        disabled={loading}
                      >
                        🖼️ 기본 이미지 선택
                      </button>
                      
                      {editedUser.selectedImage && (
                        <button 
                          onClick={() => setEditedUser(prev => ({ ...prev, selectedImage: null }))}
                          className={styles.clearImageButton}
                          disabled={loading}
                        >
                          ❌ 선택 취소
                        </button>
                      )}
                    </div>
                  </div>
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
                  <strong>닉네임:</strong> 
                  <span>{user.nickname || '설정되지 않음'}</span>
                  
                </div>
                <div className={styles.infoItem}>
                  <strong>연락처:</strong> 
                  <span>{user.phone_number || '설정되지 않음'}</span>
                  
                </div>
                <div className={styles.infoItem}>
                  <strong>성별:</strong> 
                  <span>
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
                          src={userImages[0].storage_type === 'base64' && userImages[0].image_data 
                            ? userImages[0].image_data 
                            : userImages[0].image_url} 
                          alt="사용자 등록 사진" 
                          className={styles.profileImage}
                        />
                        <span className={styles.imageDescription}>현재 등록된 사진</span>
                      </div>
                    ) : (
                      <div className={styles.noPhoto}>
                        <span>등록된 사진이 없습니다</span>
                        <small style={{ color: '#666', fontSize: '0.9em' }}>
                          사진 수정 아이콘을 눌러 사진을 추가하세요
                        </small>
                      </div>
                    )}
                  </div>
                  
                </div>
              </>
            )}
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
    </div>
  );
};

export default MyAccount;