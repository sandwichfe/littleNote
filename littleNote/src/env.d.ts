// src/env.d.ts

/// <reference types="vite/client" /> // <-- 重点：添加这一行！

declare module '*.jpg' {
    const content: string;
    export default content;
  }
  
  declare module '*.png' {
    const content: string;
    export default content;
  }
  
  declare module '*.jpeg' {
    const content: string;
    export default content;
  }
  
  declare module '*.gif' {
    const content: string;
    export default content;
  }
  
  declare module '*.svg' {
    const content: string;
    export default content;
    // 如果你确实希望 SVG 作为 Vue 组件导入，并且配置了相关插件，请取消注释以下行：
    // import { DefineComponent } from 'vue';
    // const component: DefineComponent<{}, {}, any>;
    // export default component;
  }
  
  // 添加其他你可能用到的图片格式，如 .webp, .ico 等