// 引入vue
import Vue from 'vue';
// 引入svgIcon组件
import SvgIcon from '@/components/SvgIcon.vue';
// 注册为全局组件
Vue.component('svg-icon', SvgIcon);
// 引入当前svg目录下的文件、不遍历子目录、匹配以'.svg'为结尾的文件
const req = require.context('./svg', false, /\.svg$/);
// 相当于 req.keys().forEach(key => req(key)), req.keys()是匹配到的svg文件的路径数组
const requireAll = (requireContext) => requireContext.keys().map(requireContext);
// 得到一个完整解析的module数组
requireAll(req);
