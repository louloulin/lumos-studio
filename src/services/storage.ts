import { Session, Message } from './types';

// 本地存储键名
const STORAGE_KEYS = {
  SESSIONS: 'lumos-chat-sessions',
  ACTIVE_SESSION: 'lumos-active-session',
  SETTINGS: 'lumos-settings',
};

/**
 * 获取本地存储中的所有会话
 * @returns 会话列表
 */
export const getSessions = (): Session[] => {
  try {
    const sessionsJson = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!sessionsJson) return [];
    
    const sessions = JSON.parse(sessionsJson);
    // 确保数据格式正确
    if (!Array.isArray(sessions)) return [];
    
    return sessions.map(session => ({
      ...session,
      messages: session.messages || [],
      createdAt: session.createdAt ? new Date(session.createdAt).getTime() : Date.now(),
      updatedAt: session.updatedAt ? new Date(session.updatedAt).getTime() : Date.now(),
    }));
  } catch (error) {
    console.error('Failed to get sessions from localStorage:', error);
    return [];
  }
};

/**
 * 保存会话列表到本地存储
 * @param sessions 会话列表
 */
export const saveSessions = (sessions: Session[]): void => {
  try {
    // 验证参数
    if (!Array.isArray(sessions)) {
      console.error('[StorageService] 保存会话失败: sessions 不是数组');
      return;
    }
    
    // 过滤有效的会话
    const validSessions = sessions.filter(session => 
      session && typeof session === 'object' && session.id && 
      typeof session.id === 'string'
    );
    
    if (validSessions.length !== sessions.length) {
      console.warn(`[StorageService] 过滤了 ${sessions.length - validSessions.length} 个无效会话`);
    }
    
    // 确保不会存储太多会话，最多保留30个
    const MAX_SESSIONS = 30;
    const sessionsToSave = validSessions.length > MAX_SESSIONS
      ? validSessions.sort((a, b) => {
          const aTime = typeof a.updatedAt === 'number' ? a.updatedAt : 0;
          const bTime = typeof b.updatedAt === 'number' ? b.updatedAt : 0;
          return bTime - aTime;
        }).slice(0, MAX_SESSIONS)
      : validSessions;
    
    // 尝试保存到本地存储
    try {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessionsToSave));
      console.log(`[StorageService] 保存了 ${sessionsToSave.length} 个会话到本地存储`);
    } catch (storageError) {
      console.error('[StorageService] 保存会话到本地存储失败:', storageError);
      
      // 如果是存储空间不足，尝试清理一些会话
      if (sessionsToSave.length > 5) {
        console.warn(`[StorageService] 尝试通过减少会话数量来保存`);
        // 只保留最近的5个会话
        const reducedSessions = sessionsToSave
          .sort((a, b) => {
            const aTime = typeof a.updatedAt === 'number' ? a.updatedAt : 0;
            const bTime = typeof b.updatedAt === 'number' ? b.updatedAt : 0;
            return bTime - aTime;
          })
          .slice(0, 5);
        localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(reducedSessions));
        console.log(`[StorageService] 保存了最新的5个会话作为备选方案`);
      }
      
      // 最后一次尝试 - 只保存一个会话
      try {
        const latestSession = sessionsToSave
          .sort((a, b) => {
            const aTime = typeof a.updatedAt === 'number' ? a.updatedAt : 0;
            const bTime = typeof b.updatedAt === 'number' ? b.updatedAt : 0;
            return bTime - aTime;
          })[0];
        
        if (latestSession) {
          localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([latestSession]));
          console.log(`[StorageService] 保存了最新会话作为最后的备选方案`);
        }
      } catch (finalError) {
        console.error('[StorageService] 所有尝试都失败:', finalError);
      }
    }
  } catch (error) {
    console.error('[StorageService] 保存会话时发生未知错误:', error);
  }
};

/**
 * 获取当前活跃会话ID
 * @returns 活跃会话ID
 */
export const getActiveSessionId = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
};

/**
 * 设置当前活跃会话ID
 * @param sessionId 会话ID
 */
export const setActiveSessionId = (sessionId: string): void => {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, sessionId);
};

/**
 * 添加或更新会话
 * @param session 会话对象
 * @returns 操作是否成功
 */
export const upsertSession = (session: Session): boolean => {
  try {
    if (!session || !session.id) {
      console.error('[StorageService] 尝试更新无效会话:', session);
      return false;
    }
    
    const sessions = getSessions();
    const index = sessions.findIndex(s => s.id === session.id);
    
    // 创建会话的深拷贝，避免引用问题
    const sessionCopy = JSON.parse(JSON.stringify({
      ...session,
      // 确保消息数组存在
      messages: Array.isArray(session.messages) ? session.messages : [],
      // 确保时间戳是数字
      createdAt: session.createdAt || Date.now(),
      updatedAt: Date.now(),
    }));
    
    if (index !== -1) {
      // 更新已存在的会话
      sessions[index] = sessionCopy;
      console.log(`[StorageService] 更新会话 ${session.id}, 消息数: ${sessionCopy.messages.length}`);
    } else {
      // 添加新会话
      console.log(`[StorageService] 创建新会话 ${session.id}`);
      sessions.push(sessionCopy);
    }
    
    saveSessions(sessions);
    return true;
  } catch (error) {
    console.error('[StorageService] 更新会话时发生错误:', error);
    return false;
  }
};

/**
 * 删除会话
 * @param sessionId 会话ID
 * @returns 更新后的会话列表
 */
export const deleteSession = (sessionId: string): Session[] => {
  const sessions = getSessions().filter(s => s.id !== sessionId);
  saveSessions(sessions);
  
  // 如果删除的是当前活跃会话，清除活跃会话ID
  if (getActiveSessionId() === sessionId) {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
  }
  
  return sessions;
};

/**
 * 清空所有会话
 */
export const clearAllSessions = (): void => {
  localStorage.removeItem(STORAGE_KEYS.SESSIONS);
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
};

/**
 * 导出会话数据
 * @returns 会话数据JSON字符串
 */
export const exportSessionsData = (): string => {
  const sessions = getSessions();
  return JSON.stringify(sessions, null, 2);
};

/**
 * 导入会话数据
 * @param jsonData 会话数据JSON字符串
 * @returns 是否导入成功
 */
export const importSessionsData = (jsonData: string): boolean => {
  try {
    const sessions = JSON.parse(jsonData);
    if (!Array.isArray(sessions)) return false;
    
    saveSessions(sessions);
    return true;
  } catch (error) {
    console.error('Failed to import sessions data:', error);
    return false;
  }
};

/**
 * 获取应用设置
 */
export const getSettings = (): Record<string, any> => {
  try {
    const settingsJson = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!settingsJson) return {};
    
    return JSON.parse(settingsJson);
  } catch (error) {
    console.error('Failed to get settings from localStorage:', error);
    return {};
  }
};

/**
 * 保存应用设置
 * @param settings 设置对象
 */
export const saveSettings = (settings: Record<string, any>): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error);
  }
};

export default {
  getSessions,
  saveSessions,
  getActiveSessionId,
  setActiveSessionId,
  upsertSession,
  deleteSession,
  clearAllSessions,
  exportSessionsData,
  importSessionsData,
  getSettings,
  saveSettings,
}; 