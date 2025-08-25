import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './AdoptionApply.module.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const AdoptionApply = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const animal = location.state?.animal;
  const pdfRef = useRef();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    experience: '',
    reason: '',
    animalType: '',
    otherAnimalType: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (animal) {
      let animalType = '';
      if (animal.species.includes('개')) {
        animalType = 'dog';
      } else if (animal.species.includes('고양이')) {
        animalType = 'cat';
      } else {
        animalType = 'other';
      }
      setFormData(prev => ({
        ...prev,
        animalType: animalType
      }));
    }
  }, [animal]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = '이름을 입력해주세요.';
    if (!formData.phone.trim()) newErrors.phone = '연락처를 입력해주세요.';
    if (!formData.email.includes('@')) newErrors.email = '유효한 이메일을 입력해주세요.';
    if (!formData.address.trim()) newErrors.address = '주소를 입력해주세요.';
    if (!formData.reason.trim()) newErrors.reason = '입양 사유를 입력해주세요.';
    if (!formData.animalType) newErrors.animalType = '입양 희망 동물을 선택해주세요.';
    if (formData.animalType === 'other' && !formData.otherAnimalType.trim()) {
        newErrors.otherAnimalType = '기타 동물 종류를 입력해주세요.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      console.log('입양 신청 데이터:', formData);
      alert('입양 신청이 완료되었습니다.');
      navigate('/');
    }
  };

  const handleGeneratePdf = () => {
    const input = pdfRef.current;
    const buttons = input.querySelectorAll('.no-print');
    buttons.forEach(btn => btn.style.display = 'none');

    html2canvas(input, { scale: 2, useCORS: true }).then((canvas) => {
      buttons.forEach(btn => btn.style.display = 'flex');

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;

      let newWidth = pdfWidth;
      let newHeight = newWidth / ratio;

      if (newHeight > pdfHeight) {
          newHeight = pdfHeight;
          newWidth = newHeight * ratio;
      }

      const x = (pdfWidth - newWidth) / 2;
      const y = (pdfHeight - newHeight) / 2;

      pdf.addImage(imgData, 'PNG', x, y, newWidth, newHeight);
      pdf.save('adoption_application.pdf');
    });
  };

  const genderMap = { male: '수컷', female: '암컷', unknown: '불명' };

  return (
    <div className={styles["adoption-container"]} ref={pdfRef}>
      <div className={styles["header"]}>
        <h2 className={styles["adoption-title"]}>입양 신청하기</h2>
      </div>

      {animal && (
        <div className={styles["animal-info-section"]}>
          <h3 className={styles["section-title"]}>입양 신청 동물 정보</h3>
          <div className={styles["animal-details"]}>
              <img 
                src={`/api/animals/image-proxy?url=${encodeURIComponent(animal.image_url)}`} 
                alt={animal.species} 
                className={styles["animal-image"]} 
                onError={(e) => { e.target.src = '/images/unknown_animal.png'; }} 
              />
              <div>
                  <p><strong>품종:</strong> {animal.species}</p>
                  <p><strong>출생년도:</strong> {animal.age}</p>
                  <p><strong>성별:</strong> {genderMap[animal.gender] || '정보 없음'}</p>
                  <p><strong>구조지역:</strong> {animal.region}</p>
              </div>
          </div>
        </div>
      )}

      <div className={styles["adoption-info"]}>
        <p className={styles["info-title"]}>입양 신청 전 안내사항</p>
        <ul className={styles["info-list"]}>
          <li>🐾 입양은 생명을 책임지는 일입니다. 신중히 결정해주세요.</li>
          <li>🐾 입양 후 최소 15년 이상 함께할 준비가 되어있어야 합니다.</li>
          <li>🐾 의료비, 사료비 등 지속적인 비용이 발생합니다.</li>
          <li>🐾 입양 신청 후 면접 및 가정 방문이 있을 수 있습니다.</li>
        </ul>
      </div>

      <form className={styles["adoption-form"]} onSubmit={handleSubmit}>
        <div className={styles["input-group"]}>
          <label htmlFor="name">이름 *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
          />
          {errors.name && <p className={styles["error"]}>{errors.name}</p>}
        </div>

        <div className={styles["input-group"]}>
          <label htmlFor="phone">연락처 *</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
          />
          {errors.phone && <p className={styles["error"]}>{errors.phone}</p>}
        </div>

        <div className={styles["input-group"]}>
          <label htmlFor="email">이메일 *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
          />
          {errors.email && <p className={styles["error"]}>{errors.email}</p>}
        </div>

        <div className={styles["input-group"]}>
          <label htmlFor="address">주소 *</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
          />
          {errors.address && <p className={styles["error"]}>{errors.address}</p>}
        </div>

        <div className={styles["input-group"]}>
          <label htmlFor="animalType">입양 희망 동물 *</label>
          <select
            id="animalType"
            name="animalType"
            value={formData.animalType}
            onChange={handleInputChange}
          >
            <option value="">선택해주세요</option>
            <option value="dog">강아지</option>
            <option value="cat">고양이</option>
            <option value="other">기타</option>
          </select>
          {errors.animalType && <p className={styles["error"]}>{errors.animalType}</p>}
        </div>

        {formData.animalType === 'other' && (
            <div className={styles["input-group"]}>
                <label htmlFor="otherAnimalType">기타 동물 종류 *</label>
                <input
                    type="text"
                    id="otherAnimalType"
                    name="otherAnimalType"
                    value={formData.otherAnimalType}
                    onChange={handleInputChange}
                    placeholder="정확한 동물 종류를 입력해주세요."
                />
                {errors.otherAnimalType && <p className={styles["error"]}>{errors.otherAnimalType}</p>}
            </div>
        )}

        <div className={styles["input-group"]}>
          <label htmlFor="experience">반려동물 경험</label>
          <textarea
            id="experience"
            name="experience"
            rows="3"
            value={formData.experience}
            onChange={handleInputChange}
            placeholder="반려동물을 키워본 경험이 있다면 간단히 설명해주세요."
          />
        </div>

        <div className={styles["input-group"]}>
          <label htmlFor="reason">입양 사유 *</label>
          <textarea
            id="reason"
            name="reason"
            rows="4"
            value={formData.reason}
            onChange={handleInputChange}
            placeholder="입양을 원하는 이유를 자세히 설명해주세요."
          />
          {errors.reason && <p className={styles["error"]}>{errors.reason}</p>}
        </div>

        <div className={`${styles["button-actions"]} no-print`}>
          <button type="button" onClick={() => navigate('/')} className={styles["cancel-btn"]}>
            취소
          </button>
          <button type="submit" className={styles["submit-btn"]}>
            신청하기
          </button>
          <button type="button" onClick={handleGeneratePdf} className={styles["pdf-btn"]}>
            pdf만들기
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdoptionApply;