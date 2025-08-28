import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../axios';
import styles from './Maker.module.css';
import Loading from '../Loading/Loading.jsx';

const Maker = () => {
  const [userImageUrl, setUserImageUrl] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [progressStage, setProgressStage] = useState(0); // 진행 단계 (0-4)
  const [loadingMessage, setLoadingMessage] = useState('');
  const [currentAction, setCurrentAction] = useState('');
  const [buttonStyle, setButtonStyle] = useState({});
  const [userRegistrationImage, setUserRegistrationImage] = useState(null);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const imageContainerRef = useRef(null);
  const timerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // 사용자 등록 이미지 가져오기
  const fetchUserRegistrationImage = useCallback(async () => {
    // user.id 또는 user.user_id 확인
    const userId = user?.id || user?.user_id;
    if (userId) {
      try {
        console.log('🔍 사용자 이미지 가져오기 시작 - userId:', userId);
        const response = await api.get(`/users/${userId}/images`);
        console.log('📷 사용자 이미지 API 응답:', response.data);
        
        if (response.data.success && response.data.data && response.data.data.length > 0) {
          // 가장 최근에 업로드한 이미지 사용
          const imageUrl = response.data.data[0].storage_type === 'base64' && response.data.data[0].image_data 
            ? response.data.data[0].image_data 
            : response.data.data[0].image_url;
          
          console.log('✅ 사용자 등록 이미지 설정:', imageUrl ? imageUrl.substring(0, 50) + '...' : 'null');
          setUserRegistrationImage(imageUrl);
        } else {
          console.log('❌ 사용자 등록 이미지 없음');
          setUserRegistrationImage(null);
        }
      } catch (error) {
        console.error('사용자 이미지 가져오기 실패:', error);
        setUserRegistrationImage(null);
      }
    }
  }, [user]);

  // 성별 매핑 함수
  const getGenderText = (gender) => {
    const genderMap = { 
      male: '수컷', 
      female: '암컷', 
      unknown: '불명' 
    };
    return genderMap[gender] || gender;
  };

  // 날짜 포맷 함수
  const formatDate = (dateString) => {
    if (!dateString) return '정보 없음';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { height } = entry.contentRect;
        setButtonStyle({
          height: `${height / 5}px`,
          padding: '0.25rem'
        });
      }
    });

    const currentImageContainer = imageContainerRef.current;
    if (currentImageContainer) {
      observer.observe(currentImageContainer);
    }

    // 컴포넌트 마운트 시 사용자 등록 이미지 가져오기
    fetchUserRegistrationImage();

    // URL 파라미터에서 선택된 동물 ID 확인 또는 location.state에서 animal 정보 확인
    const searchParams = new URLSearchParams(location.search);
    const animalId = searchParams.get('animalId');
    const animalFromState = location.state?.animal;
    
    if (animalFromState) {
      // location.state로 전달된 동물 정보 사용 (더 빠름)
      setSelectedAnimal(animalFromState);
    } else if (animalId) {
      // 특정 동물 정보 가져오기
      const fetchSelectedAnimal = async () => {
        try {
          const response = await api.get(`/animals/${animalId}`);
          if (response.data) {
            setSelectedAnimal(response.data);
          }
        } catch (error) {
          console.error('선택된 동물 정보 가져오기 실패:', error);
        }
      };
      fetchSelectedAnimal();
    }

    return () => {
      if (currentImageContainer) {
        observer.unobserve(currentImageContainer);
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [user, location, fetchUserRegistrationImage]);

  // Function to handle image change
  const handleImageChange = (url) => {
    setUserImageUrl(url);
    setShowModal(false);
  };

  // Function to handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        handleImageChange(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // AI 케어 합성 함수
  const performAICareSynthesis = async (action) => {
    try {
      // 사용자 이미지 (공간 이미지로 사용)
      const currentUserImage = userImageUrl || userRegistrationImage;
      if (!currentUserImage) {
        alert('사용자 이미지를 먼저 설정해주세요!');
        return null;
      }

      console.log('🎨 AI 케어 합성 시작:', action);
      console.log('🐕 동물 이미지:', selectedAnimal.image_url);
      console.log('🏠 공간 이미지:', currentUserImage.substring(0, 50) + '...');

      // 케어 활동 매핑
      const activityMap = {
        'food': '밥주기',
        'shower': '씻기기', 
        'grooming': '미용하기'
      };
      const careActivity = activityMap[action] || action;

      // FormData로 파일 업로드 준비
      const formData = new FormData();
      
      // 동물 ID 전송 (백엔드에서 이미지 다운로드 처리)
      formData.append('animal_id', selectedAnimal.animal_id);
      formData.append('animal_image_url', selectedAnimal.image_url);
      
      // 공간 이미지를 Blob으로 변환하여 추가
      const spaceImageBlob = await fetch(currentUserImage).then(res => res.blob());
      formData.append('space_image', spaceImageBlob, 'space.jpg');
      
      // 케어 활동 추가
      formData.append('care_activity', careActivity);
      
      // 케어 합성 API 요청 (타임아웃 3분, multipart/form-data)
      const response = await api.post('/ai/care/synthesize', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 180000 // 3분 (180초)
      });

      if (response.data.success) {
        console.log('✅ 케어 이미지 합성 완료!');
        return {
          resultImage: response.data.image_url,
          breedInfo: {
            species: response.data.animal_info?.species,
            gender: response.data.animal_info?.gender,
            age: response.data.animal_info?.age
          },
          prompt: `${careActivity} 케어 활동`,
          processingTime: '1-2분'
        };
      } else {
        console.error('케어 합성 실패:', response.data.error);
        alert(`케어 이미지 합성에 실패했습니다: ${response.data.error}`);
        return null;
      }

    } catch (error) {
      console.error('케어 이미지 합성 중 오류:', error);
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        const userChoice = confirm(
          '⏰ AI 이미지 생성에 시간이 걸리고 있습니다.\n\n' +
          '🔄 "확인" - 다시 시도하기\n' +
          '🏠 "취소" - 동물 목록으로 돌아가기'
        );
        
        if (!userChoice) {
          navigate('/animals');
        }
      } else if (error.response?.status === 408) {
        const userChoice = confirm(
          '⏰ 서버 처리 시간이 초과되었습니다.\n\n' +
          '🔄 "확인" - 다시 시도하기\n' +
          '🏠 "취소" - 동물 목록으로 돌아가기'
        );
        
        if (!userChoice) {
          navigate('/animals');
        }
      } else if (error.response?.status === 402) {
        const userChoice = confirm(
          '💳 AI 서비스 할당량이 부족합니다.\n\n' +
          '🔄 "확인" - 다시 시도하기\n' +
          '🏠 "취소" - 동물 목록으로 돌아가기'
        );
        
        if (!userChoice) {
          navigate('/animals');
        }
      } else if (error.response?.data?.error) {
        const userChoice = confirm(
          `❌ 케어 이미지 합성 실패: ${error.response.data.error}\n\n` +
          '🔄 "확인" - 다시 시도하기\n' +
          '🏠 "취소" - 동물 목록으로 돌아가기'
        );
        
        if (!userChoice) {
          navigate('/animals');
        }
      } else {
        const userChoice = confirm(
          '❌ 케어 이미지 합성 중 오류가 발생했습니다.\n\n' +
          '🔄 "확인" - 다시 시도하기\n' +
          '🏠 "취소" - 동물 목록으로 돌아가기'
        );
        
        if (!userChoice) {
          navigate('/animals');
        }
      }
      return null;
    }
  };

  // 아이콘 클릭 핸들러 (AI 합성 연동)
  const handleIconClick = async (action) => {
    if (!selectedAnimal) {
      alert('유기동물 목록에서 동물을 선택하고 오세요!');
      return;
    }

    const petName = selectedAnimal.species || '동물';
    let message = '';
    switch (action) {
      case 'food':
        message = `🍽️ ${petName}의 케어 이미지를 생성하고 있습니다...\n⏱️ 잠시만 기다려주세요!`;
        break;
      case 'shower':
        message = `🛁 ${petName}의 케어 이미지를 생성하고 있습니다...\n⏱️ 잠시만 기다려주세요!`;
        break;
      case 'grooming':
        message = `✂️ ${petName}의 케어 이미지를 생성하고 있습니다...\n⏱️ 잠시만 기다려주세요!`;
        break;
      default:
        message = '🎨 AI가 특별한 이미지를 생성하고 있습니다...\n⏱️ 잠시만 기다려주세요!';
    }
    
    setLoadingMessage(message);
    setCurrentAction(action);
    setProgressStage(0); // 진행 단계 초기화
    setShowLoadingModal(true);
    
    try {
      // 실제 AI 합성 실행
      const aiResult = await performAICareSynthesis(action);
      
      setShowLoadingModal(false);
      setProgressStage(0);
      
      if (aiResult) {
        // AI 합성 성공 - 결과와 함께 결과 페이지로 이동
        const params = new URLSearchParams({
          action: action,
          petName: petName,
          resultImage: aiResult.resultImage, // AI가 생성한 이미지
          breedInfo: aiResult.breedInfo || '',
          aiPrompt: aiResult.prompt || '',
          processingTime: aiResult.processingTime || 0,
          // 동물 정보 추가
          species: selectedAnimal.species || '',
          gender: selectedAnimal.gender || '',
          age: selectedAnimal.age || '',
          colorCd: selectedAnimal.colorCd || '',
          specialMark: selectedAnimal.specialMark || '',
          region: selectedAnimal.region || '',
          rescued_at: selectedAnimal.rescued_at || '',
          shelter_name: selectedAnimal.shelter_name || '',
          shelter_address: selectedAnimal.shelter_address || '',
          shelter_contact_number: selectedAnimal.shelter_contact_number || ''
        });
        navigate(`/maker/result?${params.toString()}`);
      } else {
        // AI 합성 실패 - 원본 이미지로 대체
        const params = new URLSearchParams({
          action: action,
          petName: petName,
          resultImage: selectedAnimal.image_url || "https://placehold.co/600x600/f97316/FFFFFF?text=AI+Synthesis+Failed",
          error: 'AI 합성에 실패하여 원본 이미지를 표시합니다.',
          // 동물 정보 추가
          species: selectedAnimal.species || '',
          gender: selectedAnimal.gender || '',
          age: selectedAnimal.age || '',
          colorCd: selectedAnimal.colorCd || '',
          specialMark: selectedAnimal.specialMark || '',
          region: selectedAnimal.region || '',
          rescued_at: selectedAnimal.rescued_at || '',
          shelter_name: selectedAnimal.shelter_name || '',
          shelter_address: selectedAnimal.shelter_address || '',
          shelter_contact_number: selectedAnimal.shelter_contact_number || ''
        });
        navigate(`/maker/result?${params.toString()}`);
      }
    } catch (error) {
      console.error('처리 중 오류:', error);
      setShowLoadingModal(false);
      setProgressStage(0);
      alert('처리 중 오류가 발생했습니다.');
    }
  };

  const handleCancelLoading = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setShowLoadingModal(false);
  };

  return (
    <div className={styles.mainContainer}>

      {/* 케어 이미지 합성 컨텐츠 */}
      <div className={styles.careSynthesisContent}>
          {/* 선택한 유기동물 이미지 영역 */}
          <div className={styles.petImagePlaceholder}>
        {selectedAnimal ? (
          <img 
            src={selectedAnimal.image_url} 
            alt={selectedAnimal.species}
            className={styles.petImage}
            onError={(e) => { e.target.src = '/images/unknown_animal.png'; }}
          />
        ) : (
          <div 
            className={styles.placeholderText}
            onClick={() => navigate('/animals')}
            style={{ cursor: 'pointer' }}
          >
            유기동물을 선택하여 케어하기를 시작하세요
            <br />
            <small style={{ color: '#666', fontSize: '0.9em' }}>클릭하여 유기동물 목록으로 이동</small>
          </div>
        )}
      </div>


      {/* 케어 활동 선택 버튼들 */}
      <div className={styles.iconButtonsContainer}>
        <button className={styles.iconButton} style={buttonStyle} onClick={() => handleIconClick('food')}>
          <img src="/images/Bob.png" alt="밥주기" style={{ width: '95%', height: '95%', objectFit: 'contain' }} />
          <span className={styles.buttonLabel}>밥주기</span>
        </button>
        <button className={styles.iconButton} style={buttonStyle} onClick={() => handleIconClick('shower')}>
          <img src="/images/Wash.png" alt="씻기기" style={{ width: '95%', height: '95%', objectFit: 'contain' }} />
          <span className={styles.buttonLabel}>씻기기</span>
        </button>
        <button className={styles.iconButton} style={buttonStyle} onClick={() => handleIconClick('grooming')}>
          <img src="/images/Beauty.png" alt="미용하기" style={{ width: '95%', height: '95%', objectFit: 'contain' }} />
          <span className={styles.buttonLabel}>미용하기</span>
        </button>
      </div>

      {/* 사용자 공간 이미지 영역 */}
      <div className={styles.spaceImageSection}>
        <h3 className={styles.sectionTitle}>당신의 공간</h3>
        <div
          ref={imageContainerRef}
          className={styles.userImageContainer}
          onClick={() => setShowModal(true)}
        >
          {(() => {
            console.log('🖼️ 사용자 이미지 렌더링 상태:', {
              userImageUrl: userImageUrl ? userImageUrl.substring(0, 50) + '...' : 'null',
              userRegistrationImage: userRegistrationImage ? userRegistrationImage.substring(0, 50) + '...' : 'null'
            });
            
            if (userImageUrl) {
              return <img src={userImageUrl} alt="사용자 공간" className={styles.userImage} />;
            } else if (userRegistrationImage) {
              return <img src={userRegistrationImage} alt="사용자 등록 공간" className={styles.userImage} />;
            } else {
              return (
                <div className={styles.uploadPrompt}>
                  <p>공간 이미지를 업로드하세요</p>
                  <span className={styles.userImageText}>클릭하여 이미지 선택</span>
                </div>
              );
            }
          })()}
        </div>
      </div>

      {/* 이미지 변경 옵션 모달 */}
      {showModal && (
        <div className={styles.imageModalOverlay}>
          <div className={styles.imageModal}>
            <h3 className={styles.modalTitle}>프로필 이미지 변경</h3>
            <button
              className={`${styles.modalOptionButton} ${styles.primary}`}
              onClick={() => {
                if (userRegistrationImage) {
                  handleImageChange(userRegistrationImage);
                } else {
                  alert('회원가입 시 등록한 이미지가 없습니다.');
                }
              }}
              disabled={!userRegistrationImage}
            >
              회원가입 시 넣은 이미지
              {!userRegistrationImage && ' (없음)'}
            </button>
            <label className={`${styles.modalOptionButton} ${styles.secondary}`}>
              새로운 이미지 넣기
              <input type="file" accept="image/*" style={{display: 'none'}} onChange={handleFileUpload} />
            </label>
            <button
              className={`${styles.modalOptionButton} ${styles.tertiary}`}
              onClick={() => handleImageChange("https://placehold.co/400x400/33A3FF/FFFFFF?text=Default+Image")}
            >
              기본 이미지 넣기
            </button>
            <button className={styles.modalCloseButton} onClick={() => setShowModal(false)}>
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 로딩 모달 */}
      {showLoadingModal && (
        <div className={styles.loadingModalOverlay}>
          <div className={styles.loadingModal}>
            <button 
              className={styles.loadingCloseButton} 
              onClick={handleCancelLoading}
            >
              ×
            </button>
                        <Loading message={loadingMessage} animationType={currentAction} />
          </div>
        </div>
      )}

      {/* 선택된 동물 정보 */}
      {selectedAnimal && (
        <div className={styles.animalInfoSection}>
          <h3 className={styles.sectionTitle}>선택된 동물</h3>
          <div className={styles.animalInfoCard}>
            <div className={styles.animalInfoRow}>
              <span className={styles.infoLabel}>종류:</span>
              <span className={styles.infoValue}>{selectedAnimal.species || '정보 없음'}</span>
            </div>
            <div className={styles.animalInfoRow}>
              <span className={styles.infoLabel}>성별:</span>
              <span className={styles.infoValue}>
                {selectedAnimal.gender === 'male' ? '수컷' : selectedAnimal.gender === 'female' ? '암컷' : '정보 없음'}
              </span>
            </div>
            <div className={styles.animalInfoRow}>
              <span className={styles.infoLabel}>나이:</span>
              <span className={styles.infoValue}>{selectedAnimal.age || '정보 없음'}</span>
            </div>
            <div className={styles.animalInfoRow}>
              <span className={styles.infoLabel}>지역:</span>
              <span className={styles.infoValue}>{selectedAnimal.region || '정보 없음'}</span>
            </div>
            <div className={styles.animalInfoRow}>
              <span className={styles.infoLabel}>보호소:</span>
              <span className={styles.infoValue}>
                {selectedAnimal.shelter?.shelter_name || '정보 없음'}
                {selectedAnimal.shelter?.contact_number && (
                  <a 
                    href={`tel:${selectedAnimal.shelter.contact_number}`}
                    style={{ marginLeft: '10px', color: '#007bff', textDecoration: 'none' }}
                  >
                    📞 {selectedAnimal.shelter.contact_number}
                  </a>
                )}
              </span>
            </div>
          </div>
        </div>
      )}
        </div>
    </div>
  );
};

export default Maker;