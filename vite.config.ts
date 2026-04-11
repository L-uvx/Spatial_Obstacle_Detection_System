import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cesium from 'vite-plugin-cesium'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), cesium()],
  server: {
    proxy: {
      '/polygon-obstacle': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
