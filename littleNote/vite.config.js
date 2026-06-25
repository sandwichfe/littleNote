import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

import path from 'path';
import fs from 'fs';

import { createSvgIconsPlugin } from 'vite-plugin-svg-icons';

const getApiBaseUrl = (mode) => {
  const env = loadEnv(mode, process.cwd());
  // 后端服务地址前缀从 .env 读取，避免多个 proxy target 重复书写。
  return env.VITE_API_BASE_URL;
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const apiBaseUrl = getApiBaseUrl(mode);

  return {
    plugins: [
      vue(),
      // svg-icon
      createSvgIconsPlugin({
        // 指定需要缓存的图标文件夹
        iconDirs: [path.resolve(process.cwd(), 'src/icons/svg')],
        // 指定 symbolId 格式
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
        '/api/portal': {
          target: `${apiBaseUrl}:9088`,
          changeOrigin: true
        },
        '/api/little-note': {
          target: `${apiBaseUrl}:8000`,
          changeOrigin: true
        },
        '/api/oss': {
          target: `${apiBaseUrl}:8000`,
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
  }
})
