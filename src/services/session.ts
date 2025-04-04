import { v4 as uuid } from 'uuid';
import { Agent, Message, Session, GenerateConfig } from './types';
import * as ChatService from './chat';
import * as Storage from './storage';
import SessionSync from './sessionSync';
import SessionAnalytics from './sessionAnalytics';

/**
 * 获取会话列表
 * @returns 会话列表
 */
export const getSessions = (): Session[] => {
  return Storage.getSessions();
};

/**
 * 获取当前活跃会话
 * @returns 活跃会话
 */
export const getActiveSession = (): Session | null => {
  const activeSessionId = Storage.getActiveSessionId();
  if (!activeSessionId) return null;
  
  const sessions = Storage.getSessions();
  return sessions.find(session => session.id === activeSessionId) || null;
};

/**
 * 设置当前活跃会话
 * @param sessionId 会话ID
 */
export const setActiveSession = (sessionId: string): void => {
  Storage.setActiveSessionId(sessionId);
};

/**
 * 创建新的会话
 * @returns 新创建的会话
 */
export const createSession = async (agentId: string = 'generalAssistant', title: string = 'New Chat'): Promise<Session> => {
  try {
    console.log('[Session] 创建新会话');
    
    // 检查是否有可重用的空会话
    const sessions = Storage.getSessions();
    const emptySession = sessions.find(s => 
      s.messages.length === 0 || (s.messages.length === 1 && s.messages[0].role === 'system')
    );
    
    if (emptySession && !isSessionExpired(emptySession)) {
      console.log(`[Session] 重用空会话: ${emptySession.id}`);
      // 更新时间戳
      const updatedSession = {
        ...emptySession,
        updatedAt: Date.now()
      };
      Storage.upsertSession(updatedSession);
      SessionAnalytics.trackSessionAccessed(updatedSession.id);
      return updatedSession;
    }
    
    // 创建新会话
    const timestamp = Date.now();
    const session: Session = {
      id: uuid(),
      createdAt: timestamp,
      updatedAt: timestamp,
      title: title,
      agentId: agentId,
      messages: []
    };
    
    // 保存会话
    Storage.upsertSession(session);
    Storage.setActiveSessionId(session.id);
    
    // 记录分析数据
    SessionAnalytics.trackSessionCreated(session.id);
    
    // 触发同步
    SessionSync.triggerSessionSync('lumos-chat-sessions', Storage.getSessions());
    SessionSync.triggerSessionSync('lumos-active-session', session.id);
    
    return session;
  } catch (error) {
    console.error('[Session] 创建会话失败:', error);
    // 即使出错也返回一个有效的会话
    const fallbackSession: Session = {
      id: uuid(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      title: 'New Chat (Fallback)',
      agentId: agentId,
      messages: []
    };
    return fallbackSession;
  }
};

/**
 * 更新会话标题
 * @param sessionId 会话ID
 * @param title 新标题
 * @returns 更新后的会话
 */
export const updateSessionTitle = (sessionId: string, title: string): Session | null => {
  const sessions = Storage.getSessions();
  const session = sessions.find(s => s.id === sessionId);
  if (!session) return null;
  
  const updatedSession = ChatService.updateSessionTitle(session, title);
  Storage.upsertSession(updatedSession);
  return updatedSession;
};

/**
 * 删除会话
 * @param sessionId 会话ID
 * @returns 更新后的会话列表
 */
export const deleteSession = (sessionId: string): Session[] => {
  return Storage.deleteSession(sessionId);
};

/**
 * 清空会话消息
 * @param sessionId 会话ID
 * @returns 更新后的会话
 */
export const clearSessionMessages = (sessionId: string): Session | null => {
  const sessions = Storage.getSessions();
  const session = sessions.find(s => s.id === sessionId);
  if (!session) return null;
  
  const updatedSession = ChatService.clearSessionMessages(session);
  Storage.upsertSession(updatedSession);
  return updatedSession;
};

/**
 * 添加用户消息到会话
 * @param sessionId 会话ID
 * @param content 消息内容
 * @returns 更新后的会话
 */
export const addUserMessage = async (
  sessionId: string,
  content: string
): Promise<Session | null> => {
  try {
    if (!sessionId) {
      console.error('[Session] 添加用户消息失败: 会话ID为空');
      return null;
    }
    
    let session = getSession(sessionId);
    
    // 如果会话不存在，创建新会话
    if (!session) {
      console.log('[Session] 会话不存在，创建新会话');
      session = await createSession();
      sessionId = session.id;
    }
    
    // 检查是否是重复消息
    const isDuplicate = session.messages.some(
      msg => msg.role === 'user' && msg.content === content
    );
    
    if (isDuplicate) {
      console.log('[Session] 跳过重复的用户消息');
      return session;
    }
    
    // 创建用户消息
    const userMessage: Message = {
      id: uuid(),
      role: 'user',
      content,
      createdAt: Date.now()
    };
    
    // 更新会话
    const updatedSession: Session = {
      ...session,
      messages: [...session.messages, userMessage],
      updatedAt: Date.now()
    };
    
    // 如果是第一条消息，设置会话标题
    if (session.messages.length === 0 || (session.messages.length === 1 && session.messages[0].role === 'system')) {
      // 使用用户消息的前20个字符作为标题
      const titlePreview = content.substring(0, 20);
      updatedSession.title = titlePreview + (content.length > 20 ? '...' : '');
    }
    
    // 保存会话
    Storage.upsertSession(updatedSession);
    
    // 记录消息分析
    SessionAnalytics.trackMessageAdded(sessionId, userMessage);
    
    // 触发同步
    SessionSync.triggerSessionSync('lumos-chat-sessions', Storage.getSessions());
    
    return updatedSession;
  } catch (error) {
    console.error('[Session] 添加用户消息失败:', error);
    return null;
  }
};

/**
 * 生成助手响应
 * @param sessionId 会话ID
 * @param onUpdate 更新回调函数
 * @param onComplete 完成回调函数
 * @param onError 错误回调函数
 */
export const generateAssistantResponse = async (
  sessionId: string,
  onUpdate?: (content: string) => void,
  onComplete?: (message: Message) => void,
  onError?: (error: Error) => void
): Promise<void> => {
  if (!sessionId) {
    const error = new Error('会话ID为空');
    if (onError) onError(error);
    return;
  }
  
  let session = getSession(sessionId);
  
  if (!session) {
    const error = new Error(`会话不存在: ${sessionId}`);
    if (onError) onError(error);
    return;
  }
  
  // 创建临时助手消息ID
  const messageId = uuid();
  const startTime = Date.now();
  
  try {
    // 调用API获取响应
    // 实际实现取决于您的API集成
    // 这里简化为一个示例
    
    // 模拟响应生成
    const response = "这是一个示例响应。在实际应用中，您需要从API获取真实响应。";
    
    // 创建最终消息
    const assistantMessage: Message = {
      id: messageId,
      role: 'assistant',
      content: response,
      createdAt: Date.now()
    };
    
    // 更新会话
    const updatedSession: Session = {
      ...session,
      messages: [...session.messages, assistantMessage],
      updatedAt: Date.now()
    };
    
    // 保存会话
    Storage.upsertSession(updatedSession);
    
    // 计算响应时间
    const responseTime = Date.now() - startTime;
    
    // 记录消息分析
    SessionAnalytics.trackMessageAdded(sessionId, assistantMessage, responseTime);
    
    // 触发同步
    SessionSync.triggerSessionSync('lumos-chat-sessions', Storage.getSessions());
    
    // 调用完成回调
    if (onComplete) onComplete(assistantMessage);
    
    // 备份会话
    SessionSync.backupSessions();
    
  } catch (error) {
    console.error('[Session] 生成助手响应失败:', error);
    if (onError) onError(error as Error);
    
    // 重试机制
    // 如果有必要，可以在这里实现重试逻辑
  }
};

/**
 * 导出会话数据
 * @returns 会话数据JSON字符串
 */
export const exportSessions = (): string => {
  return Storage.exportSessionsData();
};

/**
 * 导入会话数据
 * @param jsonData 会话数据JSON字符串
 * @returns 是否导入成功
 */
export const importSessions = (jsonData: string): boolean => {
  return Storage.importSessionsData(jsonData);
};

/**
 * 获取会话中的所有Agent IDs
 * @returns Agent ID列表
 */
export const getSessionAgentIds = (): string[] => {
  const sessions = Storage.getSessions();
  const agentIdsSet = new Set(sessions.map(session => session.agentId));
  return Array.from(agentIdsSet);
};

/**
 * 检查会话是否已过期
 * @param session 要检查的会话
 * @returns 如果会话已过期则返回true，否则返回false
 */
export const isSessionExpired = (session: Session): boolean => {
  if (!session) return true;
  
  const now = Date.now();
  const lastUpdated = session.updatedAt || session.createdAt || now;
  
  // 会话闲置超过7天视为过期
  const IDLE_TIMEOUT = 7 * 24 * 60 * 60 * 1000; // 7天
  // 会话存在超过30天视为绝对过期
  const ABSOLUTE_TIMEOUT = 30 * 24 * 60 * 60 * 1000; // 30天
  
  // 检查闲置超时
  if (now - Number(lastUpdated) > IDLE_TIMEOUT) {
    console.log(`[Session] 会话 ${session.id} 已闲置超过7天，被标记为过期`);
    return true;
  }
  
  // 检查绝对超时
  if (now - Number(session.createdAt) > ABSOLUTE_TIMEOUT) {
    console.log(`[Session] 会话 ${session.id} 已存在超过30天，被标记为绝对过期`);
    return true;
  }
  
  return false;
};

/**
 * 获取指定ID的会话
 * @param sessionId 会话ID
 * @returns 会话对象，如果不存在则返回null
 */
export const getSession = (sessionId: string): Session | null => {
  if (!sessionId) {
    console.warn('[Session] 尝试获取的会话ID为空');
    return null;
  }
  
  try {
    // 从存储中获取所有会话
    const sessions = Storage.getSessions();
    
    // 查找指定ID的会话
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) {
      console.warn(`[Session] 未找到会话: ${sessionId}`);
      return null;
    }
    
    // 检查会话是否过期
    if (isSessionExpired(session)) {
      console.warn(`[Session] 会话已过期: ${sessionId}`);
      // 异步删除过期会话，不阻塞当前进程
      setTimeout(() => {
        Storage.deleteSession(sessionId);
        SessionAnalytics.trackSessionDeleted(sessionId);
      }, 0);
      return null;
    }
    
    // 记录会话访问
    SessionAnalytics.trackSessionAccessed(sessionId);
    
    return session;
  } catch (error) {
    console.error('[Session] 获取会话失败:', error);
    return null;
  }
};

/**
 * 轮换会话ID以提高安全性
 * 此函数在进行重要操作后调用，如权限更改
 * 
 * @param sessionId 当前会话ID
 * @returns 更新后的会话，如果会话不存在则返回null
 */
export const rotateSessionId = (sessionId: string): Session | null => {
  try {
    // 获取当前会话
    const session = getSession(sessionId);
    
    // 如果会话不存在，返回null
    if (!session) {
      console.warn(`[Session] 无法轮换ID: 会话不存在 (${sessionId})`);
      return null;
    }
    
    // 生成新的会话ID
    const newSessionId = uuid();
    console.log(`[Session] 轮换会话ID: ${sessionId} -> ${newSessionId}`);
    
    // 创建更新后的会话对象
    const updatedSession: Session = {
      ...session,
      id: newSessionId,
      updatedAt: Date.now()
    };
    
    // 保存更新后的会话
    Storage.upsertSession(updatedSession);
    
    // 如果当前会话是活跃会话，更新活跃会话ID
    const activeSessionId = Storage.getActiveSessionId();
    if (activeSessionId === sessionId) {
      Storage.setActiveSessionId(newSessionId);
    }
    
    // 删除旧会话
    Storage.deleteSession(sessionId);
    
    // 记录会话访问
    SessionAnalytics.trackSessionAccessed(newSessionId);
    
    // 触发同步
    SessionSync.triggerSessionSync('lumos-chat-sessions', Storage.getSessions());
    SessionSync.triggerSessionSync('lumos-active-session', Storage.getActiveSessionId());
    
    return updatedSession;
  } catch (error) {
    console.error('[Session] 轮换会话ID失败:', error);
    return null;
  }
};

/**
 * 初始化会话服务
 * 在应用启动时调用一次
 */
export const initSessionService = (): void => {
  try {
    // 初始化会话同步
    SessionSync.initSessionSync();
    
    console.log('[Session] 会话服务已初始化');
  } catch (error) {
    console.error('[Session] 初始化会话服务失败:', error);
  }
};

export default {
  getSessions,
  getActiveSession,
  setActiveSession,
  createSession,
  updateSessionTitle,
  deleteSession,
  clearSessionMessages,
  addUserMessage,
  generateAssistantResponse,
  exportSessions,
  importSessions,
  getSessionAgentIds,
  isSessionExpired,
  getSession,
  rotateSessionId,
  initSessionService
}; 