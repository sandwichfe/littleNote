import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import path from 'path';
import fs from 'fs';

import { createSvgIconsPlugin } from 'vite-plugin-svg-icons';


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    //  svg-icon
    createSvgIconsPlugin({
      // 指定需要缓存的图标文件夹
      iconDirs: [path.resolve(process.cwd(), 'src/icons/svg')],
      // 指定symbolId格式
      symbolId: 'icon-[name]',
    }),
  ],
  server: {
    port: 3000,
    open: false,
    // https: {
    //   key: fs.readFileSync('D:\\certs\\localhost\\server.key'),
    //   cert: fs.readFileSync('D:\\certs\\localhost\\server.crt')
    // },
    proxy: {
      '/api/little-note': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/api/portal': {
        target: 'http://localhost:9088',
        changeOrigin: true
      },
      '/api/oss': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/assets/oss': {
        target: 'https://yiruserene.top:58888',
        changeOrigin: true
      },
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
