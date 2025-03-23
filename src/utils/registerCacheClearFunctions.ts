/**
 * 这个文件负责将缓存清理函数注册到window全局对象
 * 此文件与window.d.ts中的类型定义保持一致，返回void
 */

import { clearAllCache as originalClearAll, clearSessionData as originalClearSession } from './clearCache';

/**
 * 清理所有缓存数据，包装原始函数并返回void
 */
export async function clearAllCache(): Promise<void> {
    try {
        await originalClearAll();
    } catch (e) {
        console.error('Error in clearAllCache wrapper:', e);
    }
}

/**
 * 只清理会话数据，包装原始函数并返回void
 */
export async function clearSessionData(): Promise<void> {
    try {
        await originalClearSession();
    } catch (e) {
        console.error('Error in clearSessionData wrapper:', e);
    }
}

/**
 * 将缓存清理函数注册到window对象
 */
export function registerClearCacheFunctions(): void {
    if (typeof window !== 'undefined') {
        window.__clearAllCache = clearAllCache;
        window.__clearSessionData = clearSessionData;
        console.log('Cache clearing functions registered to window object');
    }
}

// 自动注册函数
registerClearCacheFunctions(); 