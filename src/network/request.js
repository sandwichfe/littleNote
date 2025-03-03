import axios from 'axios'
import { ElMessage} from 'element-plus';
import Cookies from 'js-cookie'
import router from '../router';

const requestIp = "127.0.0.1";
// const requestIp = "49.235.149.110";
// 环境

export function request(config) {
    const instance = axios.create({                       //创建移 动axios的实例
        baseURL: `http://${requestIp}:8000`,  
        timeout: 5000,
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
            ElMessage.success(res.data.msg);
            router.push("/login",()=>{})
         }
         return res.data;
     }, err => {
        // Message("暂时没有数据了");
        console.log(err);
        return Promise.reject(err);
     });  

    return instance(config);
}



export function LoginRequest(config) {
    const instance = axios.create({                       //创建移 动axios的实例
        baseURL: `http://${requestIp}:9088`,  
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
           ElMessage.success(res.data.msg);
           router.push("/login",()=>{})
        }
        return res.data;
    }, err => {
        if(401==err.response.data.code) {
            ElMessage.success(err.response.data.msg);
            router.push("/login",()=>{})
         }
       console.log(err);
       return Promise.reject(err);
    });  


    return instance(config);
}


