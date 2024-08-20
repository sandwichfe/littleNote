import axios from 'axios'

export function request(config) {
    const instance = axios.create({                       //创建移 动axios的实例
        baseURL: "http://49.235.149.110:8000",      //一定要写成ip 不要localhost 不然别的机器访问不到
        // baseURL: "http://192.168.8.68:8000",  
        timeout: 5000,
    });


    // 响应拦截
    instance.interceptors.response.use(res => {
        return res.data;
    }, err => {
        console.log(err);
    });

    return instance(config);
}
