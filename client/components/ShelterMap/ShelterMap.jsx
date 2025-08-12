
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
    const ps = new window.kakao.maps.services.Places();
    const searchOptions = {
      location: new window.kakao.maps.LatLng(lat, lng),
      radius: 10000, // 10km 반경
      sort: window.kakao.maps.services.SortBy.DISTANCE
    };

    // 여러 키워드로 검색
    const keywords = ['동물보호소', '유기동물보호소', '동물병원', '펫샵'];
    let foundShelters = [];

    keywords.forEach((keyword, index) => {
      setTimeout(() => {
        ps.keywordSearch(keyword, (data, status) => {
          if (status === window.kakao.maps.services.Status.OK) {
            const filteredData = data.filter(place => 
              place.category_name.includes('동물') || 
              place.place_name.includes('보호소') ||
              place.place_name.includes('동물병원')
            );
            
            filteredData.forEach(place => {
              // 중복 제거
              if (!foundShelters.find(shelter => shelter.id === place.id)) {
                foundShelters.push(place);
                addShelterMarker(map, place);
              }
            });

            setShelters(prev => [...prev, ...filteredData]);
          }
        }, searchOptions);
      }, index * 500); // API 호출 간격 조절
    });
  };

  // 보호소 마커 추가 함수
  const addShelterMarker = (map, place) => {
    const markerPosition = new window.kakao.maps.LatLng(place.y, place.x);
    const marker = new window.kakao.maps.Marker({
      position: markerPosition,
      title: place.place_name
    });
    marker.setMap(map);

    // 정보창 추가
    const infoContent = `
      <div style="padding:8px;font-size:12px;width:200px;">
        <strong>${place.place_name}</strong><br/>
        <span style="color:#666;">${place.category_name}</span><br/>
        <span style="color:#888;">${place.address_name}</span><br/>
        ${place.phone ? `<span style="color:#0066cc;">📞 ${place.phone}</span>` : ''}
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

      // 사용자 위치 마커 (빨간색)
      if (userLocation || (lat && lng)) {
        const userMarkerPosition = new window.kakao.maps.LatLng(lat, lng);
        const userMarker = new window.kakao.maps.Marker({
          position: userMarkerPosition,
          title: '현재 위치'
        });
        userMarker.setMap(newMap);
      }

      // 카카오 장소 검색 서비스 사용
      searchNearbyShelters(newMap, lat, lng);

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
        <p className={styles['shelter-count']}>
          📍 {shelters.length}개의 관련 시설을 찾았습니다.
        </p>
      )}
    </div>
  );
};

export default ShelterMap;
