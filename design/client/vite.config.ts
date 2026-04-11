import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3014,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3013',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three') || id.includes('@react-three')) {
            return 'three';
          }
          if (id.includes('node_modules/antd') || id.includes('@ant-design/icons')) {
            return 'antd';
          }
        },
      },
    },
  },
})
