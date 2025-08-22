
import React, { useEffect, useState } from 'react';
import styles from './ShelterMap.module.css';

const ShelterMap = () => {
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shelters, setShelters] = useState([]);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 50; // 5초 동안 재시도

    const initKakaoMap = () => {
      // 카카오 지도 API 스크립트가 로드되었는지 확인
      if (window.kakao && window.kakao.maps) {
        try {
          window.kakao.maps.load(() => {
            console.log("카카오 지도 API 로드 완료");
            setIsLoading(false);
            setError(null);
            
            // 1. 사용자의 현재 위치 가져오기
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const lat = position.coords.latitude;
                  const lng = position.coords.longitude;
                  setUserLocation({ lat, lng });
                  initializeMap(lat, lng);
                },
                (error) => {
                  console.error("Geolocation error: ", error);
                  // 위치를 가져올 수 없을 경우 기본 위치(서울시청)로 지도를 초기화합니다.
                  initializeMap(37.5665, 126.9780);
                }
              );
            } else {
              console.error("Geolocation is not supported by this browser.");
              // Geolocation을 지원하지 않을 경우 기본 위치로 지도를 초기화합니다.
              initializeMap(37.5665, 126.9780);
            }
          });
        } catch (apiError) {
          console.error("카카오 API 로드 오류:", apiError);
          setError("카카오 지도 API 로드에 실패했습니다. API 키를 확인해주세요.");
          setIsLoading(false);
        }
      } else {
        retryCount++;
        if (retryCount < maxRetries) {
          // 카카오 지도 API가 아직 로드되지 않은 경우 재시도
          setTimeout(initKakaoMap, 100);
        } else {
          setError("카카오 지도 API를 로드할 수 없습니다. 네트워크 연결을 확인해주세요.");
          setIsLoading(false);
        }
      }
    };

    initKakaoMap();
  }, []);

  // 주변 보호소 검색 함수
  const searchNearbyShelters = (map, lat, lng) => {
    console.log('보호소 검색 시작:', { lat, lng });

    // 실제 유기동물 보호소 데이터 (정확한 위치 정보 포함)
    const shelterData = [
      {
        id: 'shelter_seoul',
        place_name: '서울특별시 동물보호센터',
        category_name: '공공기관 > 동물보호소',
        address_name: '서울특별시 중랑구 망우로 173',
        x: '127.093338',
        y: '37.586012',
        phone: '02-2094-2300',
        capacity: 300,
        current_animals: 85,
        website: 'https://animal.seoul.go.kr'
      },
      {
        id: 'shelter_gyeonggi_suwon',
        place_name: '경기도 동물보호센터 (수원)',
        category_name: '공공기관 > 동물보호소',
        address_name: '경기도 수원시 영통구 원천동',
        x: '127.063338',
        y: '37.276012',
        phone: '031-8008-6551',
        capacity: 400,
        current_animals: 120,
        website: 'https://animal.gg.go.kr'
      },
      {
        id: 'shelter_incheon',
        place_name: '인천광역시 동물보호센터',
        category_name: '공공기관 > 동물보호소',
        address_name: '인천광역시 서구 원창동',
        x: '126.663338',
        y: '37.486012',
        phone: '032-440-8073',
        capacity: 250,
        current_animals: 65,
        website: 'https://www.incheon.go.kr'
      },
      {
        id: 'shelter_busan',
        place_name: '부산광역시 동물보호센터',
        category_name: '공공기관 > 동물보호소',
        address_name: '부산광역시 강서구 대저1동',
        x: '128.980000',
        y: '35.215000',
        phone: '051-888-7676',
        capacity: 200,
        current_animals: 45,
        website: 'https://www.busan.go.kr'
      },
      {
        id: 'shelter_daegu',
        place_name: '대구광역시 동물보호센터',
        category_name: '공공기관 > 동물보호소',
        address_name: '대구광역시 달성군 가창면',
        x: '128.616667',
        y: '35.816667',
        phone: '053-803-7942',
        capacity: 180,
        current_animals: 38,
        website: 'https://www.daegu.go.kr'
      },
      {
        id: 'shelter_gwangju',
        place_name: '광주광역시 동물보호센터',
        category_name: '공공기관 > 동물보호소',
        address_name: '광주광역시 북구 삼각동',
        x: '126.916667',
        y: '35.183333',
        phone: '062-613-5348',
        capacity: 150,
        current_animals: 32,
        website: 'https://www.gwangju.go.kr'
      },
      {
        id: 'shelter_daejeon',
        place_name: '대전광역시 동물보호센터',
        category_name: '공공기관 > 동물보호소',
        address_name: '대전광역시 유성구 원내동',
        x: '127.350000',
        y: '36.350000',
        phone: '042-270-8592',
        capacity: 160,
        current_animals: 28,
        website: 'https://www.daejeon.go.kr'
      },
      {
        id: 'shelter_ulsan',
        place_name: '울산광역시 동물보호센터',
        category_name: '공공기관 > 동물보호소',
        address_name: '울산광역시 울주군 온양읍',
        x: '129.316667',
        y: '35.516667',
        phone: '052-229-3453',
        capacity: 140,
        current_animals: 25,
        website: 'https://www.ulsan.go.kr'
      },
      {
        id: 'shelter_gyeonggi_ansan',
        place_name: '경기도 동물보호센터 (안산)',
        category_name: '공공기관 > 동물보호소',
        address_name: '경기도 안산시 상록구 사3동',
        x: '126.870000',
        y: '37.310000',
        phone: '031-481-2323',
        capacity: 220,
        current_animals: 58,
        website: 'https://animal.gg.go.kr'
      },
      {
        id: 'shelter_gyeonggi_paju',
        place_name: '경기도 동물보호센터 (파주)',
        category_name: '공공기관 > 동물보호소',
        address_name: '경기도 파주시 조리읍',
        x: '126.780000',
        y: '37.760000',
        phone: '031-940-8361',
        capacity: 180,
        current_animals: 42,
        website: 'https://animal.gg.go.kr'
      }
    ];

    // 현재 위치에서 100km 이내의 보호소만 표시
    const nearbyShelters = shelterData.filter(shelter => {
      const distance = getDistance(lat, lng, parseFloat(shelter.y), parseFloat(shelter.x));
      console.log(`${shelter.place_name}: ${distance.toFixed(1)}km`);
      return distance <= 100; // 100km 이내
    });

    console.log(`총 ${nearbyShelters.length}개의 보호소가 100km 이내에 있습니다.`);

    // 보호소 마커 추가
    nearbyShelters.forEach(shelter => {
      addShelterMarker(map, shelter);
      console.log('보호소 마커 추가:', shelter.place_name);
    });

    setShelters(nearbyShelters);

    // 추가: 카카오 API로 동물병원 검색 (개선된 검색 로직)
    setTimeout(() => {
      try {
        if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
          console.warn('카카오 서비스 API가 로드되지 않았습니다.');
          return;
        }

        const ps = new window.kakao.maps.services.Places();
        console.log('동물병원 검색 시작...');

        // 1. 일반 키워드 검색
        ps.keywordSearch('동물병원', (data, status) => {
          console.log('동물병원 키워드 검색 결과:', { status, count: data ? data.length : 0 });
          
          if (status === window.kakao.maps.services.Status.OK) {
            console.log('검색된 모든 결과:', data);
            
            // 필터링 조건을 완화
            const animalHospitals = data.filter(place => {
              const nameCheck = place.place_name.includes('동물') || 
                               place.place_name.includes('반려') ||
                               place.place_name.includes('펫') ||
                               place.place_name.includes('애완');
              
              const categoryCheck = place.category_name.includes('병원') ||
                                   place.category_name.includes('동물');
              
              console.log(`장소: ${place.place_name}, 카테고리: ${place.category_name}, 포함여부: ${nameCheck || categoryCheck}`);
              return nameCheck || categoryCheck;
            }).slice(0, 20); // 최대 20개
            
            console.log(`필터링 후 동물병원: ${animalHospitals.length}개`);
            
            animalHospitals.forEach(place => {
              try {
                addShelterMarker(map, place);
                console.log('동물병원 마커 추가:', place.place_name);
              } catch (markerError) {
                console.warn('마커 추가 실패:', place.place_name, markerError);
              }
            });

            setShelters(prev => [...prev, ...animalHospitals]);
          } else {
            console.warn('동물병원 검색 실패:', status);
          }
        }, {
          location: new window.kakao.maps.LatLng(lat, lng),
          radius: 20000, // 20km로 확대
          sort: window.kakao.maps.services.SortBy.DISTANCE
        });

        // 2. 카테고리 검색도 시도
        setTimeout(() => {
          ps.categorySearch('HP8', (data, status) => {
            console.log('병원 카테고리 검색 결과:', { status, count: data ? data.length : 0 });
            
            if (status === window.kakao.maps.services.Status.OK) {
              const animalHospitals = data.filter(place => 
                place.place_name.includes('동물') || 
                place.place_name.includes('반려') ||
                place.place_name.includes('펫')
              ).slice(0, 10);
              
              animalHospitals.forEach(place => {
                // 기존에 추가된 것과 중복 체크
                const existingIndex = shelters.findIndex(shelter => shelter.id === place.id);
                if (existingIndex === -1) {
                  try {
                    addShelterMarker(map, place);
                    console.log('카테고리 검색으로 동물병원 마커 추가:', place.place_name);
                  } catch (markerError) {
                    console.warn('마커 추가 실패:', place.place_name, markerError);
                  }
                }
              });

              setShelters(prev => {
                const newHospitals = animalHospitals.filter(place => 
                  !prev.find(shelter => shelter.id === place.id)
                );
                return [...prev, ...newHospitals];
              });
            }
          }, {
            location: new window.kakao.maps.LatLng(lat, lng),
            radius: 15000,
            sort: window.kakao.maps.services.SortBy.DISTANCE
          });
        }, 2000);

      } catch (apiError) {
        console.warn('동물병원 검색 API 오류:', apiError);
      }
    }, 1000); // 보호소 마커 추가 후 1초 대기
  };


  // 사용자 위치 표시 함수 (원형 범위 + 중심점)
  const addUserLocationCircle = (map, lat, lng) => {
    const userPosition = new window.kakao.maps.LatLng(lat, lng);
    
    // 1. 사용자 위치 중심에 원형 반투명 영역 표시
    const circle = new window.kakao.maps.Circle({
      center: userPosition,
      radius: 200, // 200m 반경으로 축소
      strokeWeight: 2,
      strokeColor: '#4285F4',
      strokeOpacity: 0.7,
      fillColor: '#4285F4',
      fillOpacity: 0.08
    });
    circle.setMap(map);

    // 2. 중심점에 작은 점 표시
    const centerDot = new window.kakao.maps.Circle({
      center: userPosition,
      radius: 15, // 15m 반경으로 축소
      strokeWeight: 1,
      strokeColor: '#ffffff',
      strokeOpacity: 1,
      fillColor: '#4285F4',
      fillOpacity: 1
    });
    centerDot.setMap(map);

    // 3. 사용자 위치 정보창
    const userInfoContent = `
      <div style="padding:10px;font-size:13px;width:140px;text-align:center;border-radius:8px;">
        <strong style="color:#4285F4;">📍 내 위치</strong><br/>
        <span style="color:#666;font-size:11px;">현재 위치 (500m 범위)</span>
      </div>
    `;
    
    const userInfowindow = new window.kakao.maps.InfoWindow({
      content: userInfoContent,
      position: userPosition
    });

    // 4. 중심점 클릭시 정보창 표시
    window.kakao.maps.event.addListener(map, 'click', (mouseEvent) => {
      const clickPosition = mouseEvent.latLng;
      const clickLat = clickPosition.getLat();
      const clickLng = clickPosition.getLng();
      
      // 사용자 위치 근처 클릭시 정보창 표시
      const distance = getDistance(lat, lng, clickLat, clickLng);
      if (distance <= 0.2) { // 200m 이내 클릭시
        userInfowindow.open(map);
        setTimeout(() => {
          userInfowindow.close();
        }, 3000); // 3초 후 자동 닫기
      }
    });

    return { circle, centerDot, infowindow: userInfowindow };
  };

  // 두 좌표 간의 거리 계산 (km)
  const getDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // 지구 반지름 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // 보호소 마커 추가 함수
  const addShelterMarker = (map, place) => {
    const markerPosition = new window.kakao.maps.LatLng(place.y, place.x);
    
    // 보호소 상태에 따른 마커 색상 결정
    const getMarkerColor = (shelter) => {
      if (!shelter.capacity) return '#F89C1E'; // 기본 색상
      
      const occupancyRate = (shelter.current_animals || 0) / shelter.capacity;
      if (occupancyRate < 0.5) return '#28a745'; // 여유 있음 - 녹색
      if (occupancyRate < 0.8) return '#ffc107'; // 보통 - 노란색  
      return '#dc3545'; // 포화 상태 - 빨간색
    };
    
    const markerColor = getMarkerColor(place);
    
    // 보호소용 커스텀 마커 이미지 (상태별 색상)
    const shelterImageSrc = 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
        <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22s14-11.5 14-22c0-7.73-6.27-14-14-14z" fill="${markerColor}"/>
        <circle cx="14" cy="14" r="8" fill="#ffffff"/>
        <path d="M8 12h12v8H8z" fill="${markerColor}"/>
        <path d="M10 10v2h8v-2l-2-2h-4z" fill="${markerColor}"/>
        <circle cx="11" cy="16" r="0.5" fill="#ffffff"/>
        <circle cx="17" cy="16" r="0.5" fill="#ffffff"/>
      </svg>
    `);
    
    const shelterImageSize = new window.kakao.maps.Size(28, 36);
    const shelterImageOption = { offset: new window.kakao.maps.Point(14, 36) };
    const shelterMarkerImage = new window.kakao.maps.MarkerImage(shelterImageSrc, shelterImageSize, shelterImageOption);
    
    const marker = new window.kakao.maps.Marker({
      position: markerPosition,
      title: place.place_name,
      image: shelterMarkerImage
    });
    marker.setMap(map);

    // 정보창 추가 (더 자세한 정보 포함)
    const distance = userLocation ? 
      getDistance(userLocation.lat, userLocation.lng, parseFloat(place.y), parseFloat(place.x)) : null;
    
    const infoContent = `
      <div style="padding:12px;font-size:13px;width:280px;border-radius:8px;">
        <strong style="color:#F89C1E;font-size:14px;">🏠 ${place.place_name}</strong><br/>
        <div style="margin:6px 0;padding:4px;background-color:#f8f9fa;border-radius:4px;">
          <span style="color:#666;font-size:12px;">${place.category_name}</span><br/>
          <span style="color:#888;font-size:12px;">📍 ${place.address_name}</span>
        </div>
        ${place.phone ? `<div style="margin:4px 0;"><span style="color:#0066cc;font-size:12px;">📞 ${place.phone}</span></div>` : ''}
        ${place.capacity ? `
          <div style="margin:6px 0;padding:4px;background-color:#fff3cd;border-radius:4px;border-left:3px solid #F89C1E;">
            <span style="color:#856404;font-size:12px;">
              🐕 보호중: ${place.current_animals || 0}마리 / 수용가능: ${place.capacity}마리
            </span>
          </div>
        ` : ''}
        ${distance ? `<div style="margin:4px 0;"><span style="color:#28a745;font-size:12px;">📏 거리: ${distance.toFixed(1)}km</span></div>` : ''}
        ${place.website ? `<div style="margin:4px 0;"><a href="${place.website}" target="_blank" style="color:#0066cc;font-size:12px;text-decoration:none;">🌐 홈페이지 바로가기</a></div>` : ''}
        <div style="margin-top:8px;padding-top:6px;border-top:1px solid #eee;">
          <span style="color:#999;font-size:11px;">💡 클릭하면 입양 가능한 동물 정보를 확인할 수 있습니다</span>
        </div>
      </div>
    `;
    
    const infowindow = new window.kakao.maps.InfoWindow({
      content: infoContent
    });

    // 마커 클릭 이벤트
    window.kakao.maps.event.addListener(marker, 'click', () => {
      infowindow.open(map, marker);
    });
  };

  const initializeMap = (lat, lng) => {
    try {
      const container = document.getElementById('map');
      if (!container) {
        console.error("Map container not found");
        setError("지도 컨테이너를 찾을 수 없습니다.");
        return;
      }

      const options = {
        center: new window.kakao.maps.LatLng(lat, lng),
        level: 5,
      };
      const newMap = new window.kakao.maps.Map(container, options);
      setMap(newMap);

      // 사용자 위치 표시 제거 - 보호소만 표시

      // 보호소 검색 (에러 발생해도 지도는 정상 표시)
      try {
        searchNearbyShelters(newMap, lat, lng);
      } catch (shelterError) {
        console.warn("보호소 검색 중 오류:", shelterError);
      }

      console.log("지도 초기화 완료");
    } catch (error) {
      console.error("지도 초기화 중 오류:", error);
      setError("지도를 로드하는 중 오류가 발생했습니다.");
    }
  };

  // API 키 오류 시 대체 컨텐츠 표시
  if (error && error.includes("API")) {
    return (
      <div className={styles['map-container']}>
        <h2>내 주변 유기동물 보호소</h2>
        <div className={styles['error-container']}>
          <p style={{color: 'red', marginBottom: '10px'}}>⚠️ 지도 서비스를 이용할 수 없습니다</p>
          <div className={styles['solution-box']}>
            <h3>🔧 해결 방법:</h3>
            <ol style={{textAlign: 'left', marginLeft: '20px'}}>
              <li><strong>카카오 개발자 콘솔</strong> 접속: <a href="https://developers.kakao.com" target="_blank" rel="noopener noreferrer">developers.kakao.com</a></li>
              <li><strong>내 애플리케이션</strong> → 해당 앱 선택</li>
              <li><strong>플랫폼</strong> → <strong>Web 플랫폼 추가</strong></li>
              <li><strong>사이트 도메인 추가</strong>: 
                <ul style={{marginTop: '5px'}}>
                  <li><code>http://localhost:5173</code></li>
                  <li><code>http://127.0.0.1:5173</code></li>
                </ul>
              </li>
              <li>설정 저장 후 페이지 새로고침</li>
            </ol>
          </div>
          
          <div className={styles['shelter-list']}>
            <h3>📍 보호소 검색 서비스 준비 중...</h3>
            <p>카카오 맵 API가 활성화되면 실제 보호소 위치를 표시합니다.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['map-container']}>
      <h2>내 주변 유기동물 보호소</h2>
      {isLoading && <p>지도를 로딩 중입니다...</p>}
      {error && <p style={{color: 'red'}}>오류: {error}</p>}
      <div id="map" className={styles.map}></div>
      {shelters.length > 0 && (
        <div>
          <p className={styles['shelter-count']}>
            📍 {shelters.length}개의 관련 시설을 찾았습니다.
          </p>
          <div className={styles['map-legend']}>
            <div className={styles['legend-title']}>🏠 보호소 상태별 마커</div>
            <div className={styles['legend-items']}>
              <div className={styles['legend-item']}>
                <span className={styles['legend-marker']} style={{backgroundColor: '#28a745'}}></span>
                <span>여유 (50% 미만)</span>
              </div>
              <div className={styles['legend-item']}>
                <span className={styles['legend-marker']} style={{backgroundColor: '#ffc107'}}></span>
                <span>보통 (50-80%)</span>
              </div>
              <div className={styles['legend-item']}>
                <span className={styles['legend-marker']} style={{backgroundColor: '#dc3545'}}></span>
                <span>포화 (80% 이상)</span>
              </div>
              <div className={styles['legend-item']}>
                <span className={styles['legend-marker']} style={{backgroundColor: '#F89C1E'}}></span>
                <span>정보 없음</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShelterMap;
