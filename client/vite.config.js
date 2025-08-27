import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    proxy: {
      "/api": {
        target: "http://localhost:3003", // 서버 실제 포트와 일치
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
