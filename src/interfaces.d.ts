import { TauriAPI } from './shared/tauri-types';

// 重新声明Window接口添加我们的全局属性
declare global {
  interface Window {
    /**
     * Tauri API 的桥接对象
     */
    tauriAPI?: TauriAPI;
    
    /**
     * 平台对象
     */
    __platformInstance?: any;
    
    /**
     * 清理所有缓存数据
     */
    __clearAllCache: () => Promise<void>;
    
    /**
     * 只清理会话数据
     */
    __clearSessionData: () => Promise<void>;
  }
}

export {}; 