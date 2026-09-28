import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 埃拉西亚大陆站点 · Vite 配置
// 关键点：
//   base:'./'      → 构建产物可用任意相对路径托管（含子目录 / CDN）
//   server.host    → 0.0.0.0，保证外部能访问开发服务器
//   strictPort     → 端口被占就报错，不偷偷换端口（避免"改了配置没生效"的错觉）
export default defineConfig({
  plugins: [vue()],
  base: './',
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  server: { host: '0.0.0.0', port: 8000, strictPort: true },
  preview: { host: '0.0.0.0', port: 8000, strictPort: true },
  build: { outDir: 'dist', assetsDir: 'assets' }
})
