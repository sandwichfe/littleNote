import axios from 'axios'
import { ElMessage} from 'element-plus';
import Cookies from 'js-cookie'
import router from '../router';


// 从环境变量读取各模块 Base URL
const LITTLE_NOTE_BASE_URL = import.meta.env.VITE_API_URL; // /api/little-note
const USER_CENTER_BASE_URL = import.meta.env.VITE_USER_CENTER_API_BASE_URL; // /api/user-center
const SYS_BASE_URL = import.meta.env.VITE_SYS_API_URL; // /api/sys
const OSS_BASE_URL = import.meta.env.VITE_UPLOAD_BASE_URL; // /api/oss

// 根据传入的 url 前缀，解析出对应的 baseURL，并返回去掉模块前缀后的相对路径
function resolveBaseAndUrl(url) {
  let baseURL = ''
  let relativeUrl = url || ''
  const mappings = [
    { prefix: '/api/little-note', base: LITTLE_NOTE_BASE_URL },
    { prefix: '/api/user-center', base: USER_CENTER_BASE_URL },
    { prefix: '/api/sys', base: SYS_BASE_URL },
    { prefix: '/api/oss', base: OSS_BASE_URL },
  ]

  for (const m of mappings) {
    if (relativeUrl && relativeUrl.startsWith(m.prefix)) {
      baseURL = m.base || ''
      relativeUrl = relativeUrl.slice(m.prefix.length) || '/'
      if (!relativeUrl.startsWith('/')) relativeUrl = '/' + relativeUrl
      break
    }
  }

  return { baseURL, relativeUrl }
}

// 环境
export function request(config) {
    const { baseURL, relativeUrl } = resolveBaseAndUrl(config.url)
    const instance = axios.create({                       //创建移 动axios的实例
        baseURL: baseURL || '',  
        timeout: 60000,
    });

    // 将处理后的相对路径写回 config，避免 baseURL 与完整路径重复拼接
    if (relativeUrl) config.url = relativeUrl


    //请求拦截器
    instance.interceptors.request.use(config => {
        // console.log(config);
        //请求头
        // let accessToken = store.getters.currentToken;
        let accessToken = Cookies.get("loginToken")
        if(accessToken){
            config.headers["Authorization"] = accessToken;
        }
         return config;
     }, err => {
         console.log(err);
     });
 
 
     // 响应式拦截
     instance.interceptors.response.use(res => {
        if(401==res?.data?.code) {
            console.log(res.data.msg);
            Cookies.remove('loginToken');
            router.push("/login")
         }
         return res.data;
     }, err => {
         if(401===(err?.response?.data?.code)) {
             console.log(err?.response?.data?.msg);
             router.push("/login")
          }
        console.log(err);
        return Promise.reject(err);
     });  
 

    return instance(config);
}


export function LoginRequest(config) {
    const { baseURL, relativeUrl } = resolveBaseAndUrl(config.url)
    const instance = axios.create({                       //创建移 动axios的实例
        baseURL: baseURL || '',  
        timeout: 5000,
    });

    // 将处理后的相对路径写回 config
    if (relativeUrl) config.url = relativeUrl


    //请求拦截器
    instance.interceptors.request.use(config => {
        // console.log(config);
        //请求头
        let accessToken = Cookies.get("loginToken")
        if(accessToken){
            config.headers["Authorization"] = accessToken;
        }
         return config;
     }, err => {
         console.log(err);
     });
 
 
     // 响应式拦截
     instance.interceptors.response.use(res => {
        if(401==res?.data?.code) {
            console.log(res.data.msg);
           Cookies.remove('loginToken');
           router.push("/login")
        }
        return res.data;
    }, err => {
        if(401===(err?.response?.data?.code)) {
            console.log(err?.response?.data?.code);
            router.push("/login")
         }
       console.log(err);
       return Promise.reject(err);
    });  


    return instance(config);
}

// 便捷方法：传入相对路径，自动补齐模块前缀，避免手写重复前缀
function ensureLeadingSlash(p) { return (p && p.startsWith('/')) ? p : `/${p || ''}` }
function withModulePrefix(prefix, config) {
  return LoginRequest({
    ...config,
    url: `${prefix}${ensureLeadingSlash(config.url || '/')}`
  })
}

export function LittleNoteRequest(config) {
  return withModulePrefix('/api/little-note', config)
}
export function UserCenterRequest(config) {
  return withModulePrefix('/api/user-center', config)
}
export function SysRequest(config) {
  return withModulePrefix('/api/sys', config)
}
export function OssRequest(config) {
  return withModulePrefix('/api/oss', config)
}


