import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cesium from 'vite-plugin-cesium'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), cesium()],
  server: {
    proxy: {
      '/polygon-obstacle': {
        target: 'http://172.25.74.165:8000',
        changeOrigin: true,
      },
      '/point-obstacle': {
        target: 'http://172.25.74.165:8000',
        changeOrigin: true,
      },
      '/data-management': {
        target: 'http://172.25.74.165:8000',
        changeOrigin: true,
      },
    },
  },
})
