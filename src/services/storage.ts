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
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  } catch (error) {
    console.error('Failed to save sessions to localStorage:', error);
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
 * @returns 更新后的会话列表
 */
export const upsertSession = (session: Session): Session[] => {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === session.id);
  
  if (index !== -1) {
    // 更新已存在的会话
    sessions[index] = {
      ...session,
      updatedAt: Date.now(),
    };
  } else {
    // 添加新会话
    sessions.push({
      ...session,
      createdAt: session.createdAt || Date.now(),
      updatedAt: Date.now(),
    });
  }
  
  saveSessions(sessions);
  return sessions;
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