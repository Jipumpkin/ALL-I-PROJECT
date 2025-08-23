import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 로컬 백엔드 서버를 위한 프록시 설정
      '/api': {
        target: 'http://localhost:3003', // 로컬 백엔드 서버 주소
        changeOrigin: true,
        rewrite: (path) => path, // 경로를 그대로 전달
      },
      '/cdn': {
        target: 'https://cdn.jsdelivr.net/', // 실제 CDN 도메인
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cdn/, ''),
        secure: true,  // https 검증 여부
        // 필요시 ws: true 추가 (웹소켓)
      },
      
  }
    
  }
})
