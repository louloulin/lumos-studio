/**
 * sessionSync.ts
 * 提供会话同步机制，用于在多个标签页之间同步会话状态
 */

import * as Storage from './storage';

// 同步事件名称
const SESSION_SYNC_EVENT = 'lumos-session-sync';

// 存储键名
const STORAGE_KEYS = {
  SESSIONS: 'lumos-chat-sessions',
  ACTIVE_SESSION: 'lumos-active-session',
};

/**
 * 初始化会话同步机制
 * 在应用启动时调用一次
 */
export const initSessionSync = (): void => {
  // 监听存储事件，以便在其他标签页中更新会话时同步
  window.addEventListener('storage', (event) => {
    // 只处理会话相关的存储更新
    if (event.key === STORAGE_KEYS.SESSIONS || event.key === STORAGE_KEYS.ACTIVE_SESSION) {
      // 派发会话同步事件
      window.dispatchEvent(new CustomEvent(SESSION_SYNC_EVENT, {
        detail: {
          key: event.key,
          newValue: event.newValue,
          oldValue: event.oldValue
        }
      }));
      
      console.log(`[SessionSync] 检测到其他标签页中的会话更新: ${event.key}`);
    }
  });
  
  console.log('[SessionSync] 会话同步机制已初始化');
};

/**
 * 订阅会话同步事件
 * 在需要响应会话变化的组件中使用
 * 
 * @param callback 当会话状态更改时调用的回调函数
 * @returns 一个用于取消订阅的函数
 */
export const subscribeToSessionSync = (
  callback: (detail: { key: string, newValue: string | null, oldValue: string | null }) => void
): () => void => {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent;
    callback(customEvent.detail);
  };
  
  window.addEventListener(SESSION_SYNC_EVENT, handler);
  
  // 返回取消订阅函数
  return () => {
    window.removeEventListener(SESSION_SYNC_EVENT, handler);
  };
};

/**
 * 手动触发会话同步
 * 用于在当前标签页更新会话后，通知其他订阅者
 * 
 * @param key 更新的存储键
 * @param value 更新后的值
 */
export const triggerSessionSync = (key: string, value: any): void => {
  window.dispatchEvent(new CustomEvent(SESSION_SYNC_EVENT, {
    detail: {
      key,
      newValue: typeof value === 'string' ? value : JSON.stringify(value),
      oldValue: null
    }
  }));
  
  console.log(`[SessionSync] 手动触发会话同步: ${key}`);
};

/**
 * 备份当前会话到本地
 * 防止意外情况下的会话丢失
 */
export const backupSessions = (): boolean => {
  try {
    const sessions = Storage.getSessions();
    const activeSessionId = Storage.getActiveSessionId();
    
    // 创建备份数据
    const backupData = {
      timestamp: Date.now(),
      sessions,
      activeSessionId
    };
    
    // 保存到indexedDB或本地存储
    localStorage.setItem('lumos-sessions-backup', JSON.stringify(backupData));
    
    console.log(`[SessionSync] 已备份 ${sessions.length} 个会话`);
    return true;
  } catch (error) {
    console.error('[SessionSync] 备份会话失败:', error);
    return false;
  }
};

/**
 * 从备份中恢复会话
 * 在需要时调用，例如会话加载失败或存储被清除
 * 
 * @returns 是否成功恢复会话
 */
export const restoreSessions = (): boolean => {
  try {
    const backupJson = localStorage.getItem('lumos-sessions-backup');
    if (!backupJson) {
      console.warn('[SessionSync] 未找到会话备份');
      return false;
    }
    
    const backup = JSON.parse(backupJson);
    if (!backup.sessions || !Array.isArray(backup.sessions)) {
      console.warn('[SessionSync] 会话备份数据无效');
      return false;
    }
    
    // 检查备份是否太旧
    const now = Date.now();
    const backupAge = now - (backup.timestamp || 0);
    const MAX_BACKUP_AGE = 7 * 24 * 60 * 60 * 1000; // 7天
    
    if (backupAge > MAX_BACKUP_AGE) {
      console.warn(`[SessionSync] 会话备份太旧 (${Math.round(backupAge / (24 * 60 * 60 * 1000))} 天)`);
    }
    
    // 恢复会话
    Storage.saveSessions(backup.sessions);
    
    // 恢复活跃会话
    if (backup.activeSessionId) {
      Storage.setActiveSessionId(backup.activeSessionId);
    }
    
    console.log(`[SessionSync] 已恢复 ${backup.sessions.length} 个会话`);
    
    // 触发同步
    triggerSessionSync(STORAGE_KEYS.SESSIONS, backup.sessions);
    
    return true;
  } catch (error) {
    console.error('[SessionSync] 恢复会话失败:', error);
    return false;
  }
};

export default {
  initSessionSync,
  subscribeToSessionSync,
  triggerSessionSync,
  backupSessions,
  restoreSessions
}; 