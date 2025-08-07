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
      // 클라이언트에서 "/xeicon"으로 시작하는 요청을 XEIcon CDN으로 전달
      '/xeicon': {
        target: 'https://cdn.jsdelivr.net/npm/xeicon@2.3.3',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/xeicon/, ''),
        secure: true,  // https 인증서 검증 필요에 따라 변경
    },
  }
    
  }
})
