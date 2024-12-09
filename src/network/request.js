import axios from 'axios'
import { ElMessage} from 'element-plus';
import Cookies from 'js-cookie'
import router from '../router';

export function request(config) {
    const instance = axios.create({                       //创建移 动axios的实例
        // baseURL: "http://49.235.149.110:8000",      //一定要写成ip 不要localhost 不然别的机器访问不到
        baseURL: "http://127.0.0.1:8080",  
        timeout: 5000,
    });


    //请求拦截器
    instance.interceptors.request.use(config => {
        // console.log(config);
        //请求头
        // let accessToken = store.getters.currentToken;
        let accessToken = Cookies.get("loginToken")
        if(accessToken){
            // window.location.href="/login"
            // Message("登录已失效请重新登录！");
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

// 响应式拦截
instance.interceptors.response.use(
    // res => res.data,
    res => res,
    err => handleError(err)
);

// 统一处理错误
function handleError(err) {
    if (err.response) {
        // 客户端收到服务器的错误响应
        const { status, data } = err.response;
        if (status === 401) {
            ElMessage.error(data?.msg || "登录失效，请重新登录！");
            router.push("/login");
        } else {
            ElMessage.error("发生了一点小错误，正在紧急修复中~");
        }

        return Promise.reject(err); // 返回拒绝的Promise以阻止进一步的处理
    } else if (err.request) {
        // 请求已发出但没有收到响应
        ElMessage.error("请求发送失败，请检查网络连接。");
        return Promise.reject(err);
    } else {
        // 其他错误
        ElMessage.error("发生了未知错误，请稍后再试。");
        return Promise.reject(err);
    }
}
    return instance(config);
}



export function LoginRequest(config) {
    const instance = axios.create({                       //创建移 动axios的实例
        // baseURL: "http://49.235.149.110:8000",      //一定要写成ip 不要localhost 不然别的机器访问不到
        baseURL: "http://127.0.0.1:9000",  
        timeout: 5000,
    });


    //请求拦截器
    instance.interceptors.request.use(config => {
        // console.log(config);
        //请求头
        // let accessToken = store.getters.currentToken;
        let accessToken = Cookies.get("loginToken")
        if(accessToken){
            // window.location.href="/login"
            // Message("登录已失效请重新登录！");
            config.headers["accessToken"] = accessToken;
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
        ElMessage.error("发生了一点小错误，正在紧急修复中~");
     });  

    return instance(config);
}


