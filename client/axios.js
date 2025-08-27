import axios from "axios";

// 개발(DEV)에서는 '/api'로 보내서 vite 프록시를 타게 하고,
// 운영(PROD)에서는 환경변수에 설정한 절대주소를 사용합니다.
const API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : (import.meta.env.VITE_API_BASE_URL || "/api");

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30초로 증가
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // 쿠키/세션 쓰면 켜두세요 (서버 CORS 옵션과 짝)
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;