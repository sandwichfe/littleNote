import { ElLoading } from 'element-plus'

export function openLoading(){
    ElLoading.service({
        lock: false,
        text: 'Loading',
        background: 'rgba(0, 0, 0, 0.7)',
        })
}

export function closeLoading(){
    ElLoading.service().close();
}