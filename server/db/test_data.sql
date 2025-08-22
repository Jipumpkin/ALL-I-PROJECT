-- ALL-I-PROJECT 테스트 데이터 삽입 스크립트
-- 실행 전제: setup.sql이 이미 실행되어 테이블이 생성된 상태

USE all_i_project;

-- 테스트 사용자 데이터 (Mock API와 동일한 사용자들)
-- 비밀번호: Test123!@#, Admin123!@#, Demo123!@# (실제 bcrypt 해시값)
INSERT INTO users (username, email, password_hash, nickname, gender, phone_number) VALUES
('testuser', 'test@example.com', '$2b$12$NGU9YUwB6qIuMIuD6.Ye5.6rcYnVBW2SjReFMpos.TWctknK7MPmu', '테스트유저', 'male', '010-1234-5678'),
('admin', 'admin@allipet.com', '$2b$12$1MUWCt395ghyMvVJDtkttOOIEGRlckZzSY9x7vak8JtHX6WXnwOKW', '관리자', 'female', '010-9999-0000'),
('demo', 'demo@allipet.com', '$2b$12$bQGPtE1sB8cdQ1pFlW9f/eI0uD9IJUhDwQ.XBDgojFzJ1IVs6xarW', '데모유저', 'other', '010-5555-1234');

-- 샘플 보호소 데이터
INSERT INTO shelters (shelter_name, email, contact_number, address, region) VALUES
('서울동물보호센터', 'seoul@shelter.kr', '02-1234-5678', '서울시 강남구 테헤란로 123', '서울'),
('부산동물사랑센터', 'busan@shelter.kr', '051-9876-5432', '부산시 해운대구 해변로 456', '부산'),
('대구펫보호소', 'daegu@shelter.kr', '053-5555-7777', '대구시 중구 동성로 789', '대구');

-- 샘플 유기동물 데이터
INSERT INTO animals (species, gender, age, image_url, shelter_id, status, region, rescued_at) VALUES
('개', 'male', '2세', '/images/sample_dog1.jpg', 1, 'available', '서울', '2025-01-15'),
('고양이', 'female', '1세', '/images/sample_cat1.jpg', 1, 'available', '서울', '2025-01-20'),
('개', 'unknown', '3세', '/images/sample_dog2.jpg', 2, 'available', '부산', '2025-02-01'),
('고양이', 'male', '4세', '/images/sample_cat2.jpg', 2, 'pending', '부산', '2025-02-05'),
('개', 'female', '1세', '/images/sample_dog3.jpg', 3, 'available', '대구', '2025-02-10');

-- 삽입된 데이터 확인
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Shelters', COUNT(*) FROM shelters  
UNION ALL
SELECT 'Animals', COUNT(*) FROM animals;

-- 사용자 정보 확인 (비밀번호 제외)
SELECT user_id, username, email, nickname, gender, phone_number, created_at 
FROM users;

-- 동물 정보 확인
SELECT a.animal_id, a.species, a.gender, a.age, a.status, a.region, s.shelter_name
FROM animals a
LEFT JOIN shelters s ON a.shelter_id = s.shelter_id;