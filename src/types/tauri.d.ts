/**
 * 为Tauri API和相关功能创建类型声明
 */

declare module '@tauri-apps/api/tauri' {
  /**
   * 调用Tauri后端函数
   * @param cmd 要调用的命令名称
   * @param args 传递给命令的参数
   * @returns 命令的执行结果
   */
  export function invoke<T = any>(cmd: string, args?: Record<string, unknown>): Promise<T>;
}

interface Window {
  __TAURI__?: any;
  tauriAPI?: any;
  __clearAllCache?: () => Promise<void>;
  __clearSessionData?: () => Promise<void>;
} 