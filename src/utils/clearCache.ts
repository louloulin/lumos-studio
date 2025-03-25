import platform from '@/packages/platform'

/**
 * 清理所有缓存数据，包括会话数据和Tauri存储
 * 此函数适用于所有平台（Web和Tauri）
 */
export async function clearAllCache(): Promise<boolean> {
    try {
        // 1. 清理localStorage中的会话相关数据
        Object.keys(localStorage).forEach(key => {
            if (
                key.includes('session') || 
                key.includes('atom') || 
                key === 'chat-sessions' ||
                key === '_currentSessionIdCachedAtom'
            ) {
                localStorage.removeItem(key)
            }
        })

        // 2. 尝试使用Tauri API清理Store数据
        try {
            // 删除特定的值
            await platform.delStoreValue('chat-sessions')
            await platform.delStoreValue('_currentSessionIdCachedAtom')
            
            // 也可以尝试清理其他可能的store值
            await platform.delStoreValue('settings')
            console.log('Successfully cleared Tauri store data')
        } catch (e) {
            console.warn('Failed to clear Tauri store data:', e)
            // 即使无法清理Tauri Store数据，也继续执行
        }

        // 3. 设置一个标志，下次刷新页面时使用默认数据
        localStorage.setItem('_force_use_defaults', 'true')
        
        console.log('Successfully cleared all cache data')
        return true
    } catch (e) {
        console.error('Failed to clear cache:', e)
        return false
    }
}

/**
 * 只清理会话数据，但保留设置和其他配置
 */
export async function clearSessionData(): Promise<boolean> {
    try {
        // 清理localStorage中的会话数据
        localStorage.removeItem('chat-sessions')
        localStorage.removeItem('_currentSessionIdCachedAtom')
        
        // 尝试使用Tauri API清理会话数据
        try {
            await platform.delStoreValue('chat-sessions')
            await platform.delStoreValue('_currentSessionIdCachedAtom')
            console.log('Successfully cleared Tauri session data')
        } catch (e) {
            console.warn('Failed to clear Tauri session data:', e)
        }
        
        console.log('Successfully cleared session data')
        return true
    } catch (e) {
        console.error('Failed to clear session data:', e)
        return false
    }
} 