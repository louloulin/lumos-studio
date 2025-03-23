import { TauriAPI } from './shared/tauri-types';
import { DesktopPlatform } from './packages/platform';

declare global {
  interface Window {
    /**
     * Tauri API 的桥接对象
     */
    tauriAPI?: any;
    
    /**
     * 平台对象
     */
    __platformInstance?: any;
    
    /**
     * 清理所有缓存数据
     */
    __clearAllCache: () => Promise<boolean>;
    
    /**
     * 只清理会话数据
     */
    __clearSessionData: () => Promise<boolean>;
  }
}

export {}; 