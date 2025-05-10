import * as originalFunctions from './clearCache';

/**
 * 清理所有缓存数据，包装原始函数并返回void
 */
export async function clearAllCache(): Promise<void> {
    try {
        await originalFunctions.clearAllCache();
    } catch (e) {
        console.error('Error in clearAllCache wrapper:', e);
    }
}

/**
 * 只清理会话数据，包装原始函数并返回void
 */
export async function clearSessionData(): Promise<void> {
    try {
        await originalFunctions.clearSessionData();
    } catch (e) {
        console.error('Error in clearSessionData wrapper:', e);
    }
}

// 将包装后的清理函数挂载到全局对象
if (typeof window !== 'undefined') {
    window.__clearAllCache = clearAllCache;
    window.__clearSessionData = clearSessionData;
} 