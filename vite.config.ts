import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2015', // 支持更多浏览器
    cssTarget: 'chrome80', // CSS兼容性
    minify: 'esbuild', // 使用esbuild代替terser，更快且兼容性更好
    rollupOptions: {
      output: {
        manualChunks: undefined, // 禁用代码分割以提高兼容性
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
