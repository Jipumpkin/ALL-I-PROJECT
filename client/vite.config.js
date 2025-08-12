import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://apis.data.go.kr',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
        // secure: false,  // HTTPS 무시할 때만
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
