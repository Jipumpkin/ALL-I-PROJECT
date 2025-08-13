-- 사용자 테이블
CREATE TABLE users (
    user_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(50),
    gender ENUM('male', 'female', 'other', 'unknown') DEFAULT 'unknown',
    phone_number VARCHAR(20),
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at DATETIME
);

-- 사용자 이미지 테이블
CREATE TABLE user_images (
    image_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    image_url TEXT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 보호소 테이블
CREATE TABLE shelters (
    shelter_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    shelter_name VARCHAR(100),
    email VARCHAR(100),
    contact_number VARCHAR(20),
    address VARCHAR(255),
    region VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 유기동물 테이블
CREATE TABLE animals (
    animal_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    species VARCHAR(50),
    gender ENUM('male', 'female', 'unknown') DEFAULT 'unknown',
    age VARCHAR(20),
    image_url TEXT,
    shelter_id BIGINT UNSIGNED,
    status ENUM('available', 'adopted', 'pending') DEFAULT 'available',
    region VARCHAR(100),
    rescued_at DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shelter_id) REFERENCES shelters(shelter_id) ON DELETE SET NULL
);

-- 프롬프트 테이블
CREATE TABLE prompts (
    prompt_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    original_prompt TEXT,
    final_prompt TEXT,
    image_id BIGINT UNSIGNED,
    animal_id BIGINT UNSIGNED,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (image_id) REFERENCES user_images(image_id) ON DELETE SET NULL,
    FOREIGN KEY (animal_id) REFERENCES animals(animal_id) ON DELETE SET NULL
);

-- 생성된 이미지 테이블
CREATE TABLE generated_images (
    generated_image_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    prompt_id BIGINT UNSIGNED NOT NULL,
    image_url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (prompt_id) REFERENCES prompts(prompt_id) ON DELETE CASCADE
);

-- LLM 로그 테이블
CREATE TABLE llm_logs (
    log_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    request_type ENUM('gpt', 'dalle') NOT NULL,
    cost DECIMAL(10,5),
    result_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    -- 필요 시 result_type 컬럼 추가 가능
);
