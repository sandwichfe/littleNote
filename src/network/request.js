import axios from 'axios'
import { ElMessage} from 'element-plus';
import Cookies from 'js-cookie'
import router from '../router';


const littleNoteBaseUrl = import.meta.env.VITE_API_URL;
const authBaseUrl = import.meta.env.VITE_AUTH_API_URL;
console.log("32112",authBaseUrl)
// 环境

export function request(config) {
    const instance = axios.create({                       //创建移 动axios的实例
        baseURL: littleNoteBaseUrl,  
        timeout: 60000,
    });


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
        if(401==res.data.code) {
            console.log(res.data.msg);
            Cookies.remove('loginToken');
            router.push("/login",()=>{})
         }
         return res.data;
     }, err => {
         if(401==err.response.data.code) {
             console.log(err.response.data.msg);
             router.push("/login",()=>{})
          }
        console.log(err);
        return Promise.reject(err);
     });  
 

    return instance(config);
}



export function LoginRequest(config) {
    const instance = axios.create({                       //创建移 动axios的实例
        baseURL: authBaseUrl,  
        timeout: 5000,
    });


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
        if(401==res.data.code) {
            console.log(res.data.msg);
           Cookies.remove('loginToken');
           router.push("/login",()=>{})
        }
        return res.data;
    }, err => {
        if(401==err.response.data.code) {
            console.log(err.response.data.code);
            router.push("/login",()=>{})
         }
       console.log(err);
       return Promise.reject(err);
    });  


    return instance(config);
}


