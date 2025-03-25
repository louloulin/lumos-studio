/**
 * 环境检测工具
 * 用于检测当前应用运行的环境（Tauri、Web等）
 */

type Environment = 'tauri' | 'web' | 'unknown';

/**
 * 检测当前运行环境
 * @returns 当前环境类型
 */
export function detectEnvironment(): Environment {
  // 检查是否在Tauri环境中运行
  if (window.__TAURI__ !== undefined) {
    return 'tauri';
  }
  
  // 检查是否在Web环境中运行
  if (typeof window !== 'undefined' && window.location) {
    return 'web';
  }
  
  return 'unknown';
}

/**
 * 检查是否在开发环境中运行
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * 检查是否在生产环境中运行
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
} 