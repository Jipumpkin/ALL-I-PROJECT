/**
 * 안전한 localStorage 사용을 위한 유틸리티 함수들
 */

// 간단한 암호화/복호화 (실제 운영에서는 더 강력한 암호화 필요)
const STORAGE_KEY = 'pawpaw_secure';

const encrypt = (data) => {
  try {
    // 실제로는 crypto-js 같은 라이브러리 사용 권장
    return btoa(JSON.stringify(data));
  } catch (error) {
    console.error('Encryption failed:', error);
    return null;
  }
};

const decrypt = (encryptedData) => {
  try {
    return JSON.parse(atob(encryptedData));
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
};

// 안전한 데이터 저장
export const secureStorage = {
  set: (key, value) => {
    try {
      const encrypted = encrypt(value);
      if (encrypted) {
        localStorage.setItem(`${STORAGE_KEY}_${key}`, encrypted);
        return true;
      }
    } catch (error) {
      console.error('Storage set failed:', error);
    }
    return false;
  },

  get: (key) => {
    try {
      const encrypted = localStorage.getItem(`${STORAGE_KEY}_${key}`);
      if (encrypted) {
        return decrypt(encrypted);
      }
    } catch (error) {
      console.error('Storage get failed:', error);
    }
    return null;
  },

  remove: (key) => {
    try {
      localStorage.removeItem(`${STORAGE_KEY}_${key}`);
      return true;
    } catch (error) {
      console.error('Storage remove failed:', error);
      return false;
    }
  },

  clear: () => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(STORAGE_KEY)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Storage clear failed:', error);
      return false;
    }
  }
};

// 민감한 데이터 검증
export const isSensitiveData = (key) => {
  const sensitiveKeys = ['token', 'password', 'auth', 'user'];
  return sensitiveKeys.some(sensitiveKey => 
    key.toLowerCase().includes(sensitiveKey)
  );
};