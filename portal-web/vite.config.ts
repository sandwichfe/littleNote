import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

const getApiBaseUrl = (mode: string) => {
  const env = loadEnv(mode, process.cwd())
  return env.VITE_API_BASE_URL
}

export default defineConfig(({ mode }) => {
  const apiBaseUrl = getApiBaseUrl(mode)
  console.log(apiBaseUrl)

  return {
    plugins: [vue()],
    server: {
      port: 9000,
      open: false,
      proxy: {
        '/api/portal': {
          target: `${apiBaseUrl}:9088`,
          changeOrigin: true
        },
        // 头像等文件上传
        '/api/oss': {
          target: `${apiBaseUrl}:8000`,
          changeOrigin: true
        },
        // OSS 静态资源访问
        '/assets/oss': {
          target: 'https://yiruserene.top:58888',
          changeOrigin: true
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    }
  }
})
