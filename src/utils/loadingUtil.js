import { ElLoading } from 'element-plus'

export function openLoading(text = 'Loading') {
    ElLoading.service({
        lock: false,
        text,
        background: 'rgba(0, 0, 0, 0.7)',
    })
}

export function closeLoading(){
    ElLoading.service().close();
}