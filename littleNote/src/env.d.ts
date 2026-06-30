// src/env.d.ts

/// <reference types="vite/client" /> // <-- 重点：添加这一行！

// 环境变量类型声明
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_OSS_LOAD_BASE_URL: string
  readonly VITE_QRCODE_BASE_URL: string
  readonly VITE_PORTAL_LOGIN_URL: string
  readonly VITE_CLIENT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

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