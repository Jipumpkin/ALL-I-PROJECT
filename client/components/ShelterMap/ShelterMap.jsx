
import React, { useEffect, useState } from 'react';
import styles from './ShelterMap.module.css';

const ShelterMap = () => {
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // --- 임시 데이터: 실제로는 API를 통해 가져와야 합니다. ---
  const dummyShelters = [
    { name: '행복보호소', lat: 37.5665, lng: 126.9780 },
    { name: '희망보호소', lat: 37.5700, lng: 126.9850 },
    { name: '사랑보호소', lat: 37.5630, lng: 126.9750 },
  ];
  // ---------------------------------------------------------

  useEffect(() => {
    // 카카오 지도 API 스크립트가 로드되었는지 확인
    if (window.kakao && window.kakao.maps) {
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
    }
  }, []);

  const initializeMap = (lat, lng) => {
    const container = document.getElementById('map');
    const options = {
      center: new window.kakao.maps.LatLng(lat, lng),
      level: 5,
    };
    const newMap = new window.kakao.maps.Map(container, options);
    setMap(newMap);

    // 지도에 보호소 마커 표시
    dummyShelters.forEach(shelter => {
      const markerPosition = new window.kakao.maps.LatLng(shelter.lat, shelter.lng);
      const marker = new window.kakao.maps.Marker({
        position: markerPosition,
        title: shelter.name
      });
      marker.setMap(newMap);
    });
  };

  return (
    <div className={styles['map-container']}>
      <h2>내 주변 유기동물 보호소</h2>
      <div id="map" className={styles.map}></div>
      <p className={styles['api-notice']}>
        * 실제 유기동물 보호소 정보는 공공데이터 API 연동 후 제공될 예정입니다.
      </p>
    </div>
  );
};

export default ShelterMap;
