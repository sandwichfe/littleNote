import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import path from 'path';

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
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
})
