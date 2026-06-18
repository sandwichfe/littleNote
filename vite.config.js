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
      '/assets/oss': {
        target: 'https://littlenote.yun.yiruserene.top',
        changeOrigin: true,
        secure: false,
        // 添加日志查看请求详情
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('代理请求:', req.url, '->', options.target + req.url)
          })
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('代理响应状态:', proxyRes.statusCode)
          })
          proxy.on('error', (err, req, res) => {
            console.error('代理错误:', err.message)
          })
        }
      },
      '/api/oss': {
        target: 'https://littlenote.yun.yiruserene.top',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
