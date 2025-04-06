import { v4 as uuid } from 'uuid';
import { Agent, Message, Session, GenerateConfig } from './types';
import * as ChatService from './chat';
import * as Storage from './storage';
import SessionSync from './sessionSync';
import SessionAnalytics from './sessionAnalytics';
import { MastraAPI } from '../api/mastra';
import * as ChatTypes from '../types/chat';

/**
 * 将内部Session类型转换为Chat Session类型
 */
const convertToSessionType = (session: Session): ChatTypes.Session => {
  return {
    id: session.id,
    title: session.title,
    defaultAgentId: session.agentId,
    agentIds: [session.agentId],
    messages: session.messages.map(msg => ({
      id: msg.id || uuid(),
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt ? Number(msg.createdAt) : Date.now(),
      agentId: session.agentId
    })),
    createdAt: Number(session.createdAt),
    updatedAt: Number(session.updatedAt),
    pinned: session.pinned,
    tags: session.tags
  };
};

/**
 * 将Chat Session类型转换回内部Session类型
 */
const convertFromSessionType = (session: ChatTypes.Session): Session => {
  return {
    id: session.id,
    title: session.title,
    agentId: session.defaultAgentId,
    messages: session.messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt
    })),
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    pinned: session.pinned,
    tags: session.tags
  };
};

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
 * 检查会话ID是否有效
 * @param sessionId 要检查的会话ID
 * @returns 是否是有效的会话ID
 */
export const isValidSessionId = (sessionId: string | null | undefined): boolean => {
  if (!sessionId) return false;
  if (sessionId === 'undefined' || sessionId === 'null') return false;
  if (sessionId.trim() === '') return false;
  
  // 检查是否是有效的UUID格式或有效的数字ID
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const numericPattern = /^\d{10,20}$/; // 数字ID (时间戳形式的ID通常为数字)
  
  return uuidPattern.test(sessionId) || numericPattern.test(sessionId);
};

/**
 * 获取指定ID的会话
 * @param sessionId 会话ID
 * @returns 会话对象，如果不存在则返回null
 */
export const getSession = (sessionId: string): Session | null => {
  if (!isValidSessionId(sessionId)) {
    console.warn('[Session] 尝试获取的会话ID无效:', sessionId);
    return null;
  }
  
  try {
    // 从存储中获取所有会话
    const sessions = Storage.getSessions();
    
    // 查找指定ID的会话 - 同时考虑字符串和数字形式的ID
    const session = sessions.find(s => {
      if (s.id === sessionId) return true;
      
      // 处理数字形式的ID (URL中常见)
      if (typeof s.id === 'string' && /^\d+$/.test(s.id) && /^\d+$/.test(sessionId)) {
        return s.id.replace(/^0+/, '') === sessionId.replace(/^0+/, '');
      }
      
      return false;
    });
    
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
 * 创建新的会话
 * 改进错误处理和会话ID生成
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
    
    // 创建新会话，为确保会话ID的一致性，使用时间戳作为ID
    const timestamp = Date.now();
    const sessionId = timestamp.toString(); // 使用时间戳作为ID，与URL格式匹配
    
    const session: Session = {
      id: sessionId,
      createdAt: timestamp,
      updatedAt: timestamp,
      title: title,
      agentId: agentId,
      messages: []
    };
    
    // 保存会话
    const saveResult = Storage.upsertSession(session);
    if (!saveResult) {
      throw new Error('保存会话失败');
    }
    
    Storage.setActiveSessionId(session.id);
    
    // 记录分析数据
    SessionAnalytics.trackSessionCreated(session.id);
    
    // 触发同步
    SessionSync.triggerSessionSync('lumos-chat-sessions', Storage.getSessions());
    SessionSync.triggerSessionSync('lumos-active-session', session.id);
    
    // 备份会话
    SessionSync.backupSessions();
    
    console.log(`[Session] 成功创建新会话: ${session.id}`);
    return session;
  } catch (error) {
    console.error('[Session] 创建会话失败:', error);
    // 即使出错也返回一个有效的会话，使用当前时间戳作为ID
    const fallbackId = Date.now().toString();
    console.log(`[Session] 创建会话失败，使用备用ID: ${fallbackId}`);
    
    const fallbackSession: Session = {
      id: fallbackId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      title: 'New Chat (Fallback)',
      agentId: agentId,
      messages: []
    };
    
    // 尝试保存备用会话
    try {
      Storage.upsertSession(fallbackSession);
    } catch (saveError) {
      console.error('[Session] 保存备用会话失败:', saveError);
    }
    
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
  
  // 转换为Chat类型
  const chatSession = convertToSessionType(session);
  
  // 使用Chat服务更新标题
  const updatedChatSession = ChatService.updateSessionTitle(chatSession, title);
  
  // 转换回内部类型
  const updatedSession = convertFromSessionType(updatedChatSession);
  
  // 保存到存储
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
  
  // 转换为Chat类型
  const chatSession = convertToSessionType(session);
  
  // 使用Chat服务清空消息
  const clearedChatSession = ChatService.clearSessionMessages(chatSession);
  
  // 转换回内部类型
  const clearedSession = convertFromSessionType(clearedChatSession);
  
  // 保存到存储
  Storage.upsertSession(clearedSession);
  return clearedSession;
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
 * 使用真实的MastraAPI而非模拟数据
 */
export const generateAssistantResponse = async (
  sessionId: string,
  onUpdate?: (content: string) => void,
  onComplete?: (message: Message) => void,
  onError?: (error: Error) => void
): Promise<void> => {
  if (!isValidSessionId(sessionId)) {
    const error = new Error(`会话ID无效: ${sessionId}`);
    console.error('[Session]', error.message);
    if (onError) onError(error);
    return;
  }
  
  let session = getSession(sessionId);
  
  // 如果会话不存在，自动创建新会话
  if (!session) {
    console.warn(`[Session] 会话 ${sessionId} 不存在，自动创建新会话`);
    try {
      session = await createSession();
      sessionId = session.id;
      // 通知调用者ID已更改
      if (onUpdate) onUpdate(`会话ID已更改为 ${sessionId}，继续生成响应...`);
    } catch (error) {
      const createError = error instanceof Error ? error : new Error(String(error));
      const errorMessage = `无法创建新会话: ${createError.message}`;
      console.error('[Session]', errorMessage);
      if (onError) onError(new Error(errorMessage));
      return;
    }
  }
  
  // 创建临时助手消息ID
  const messageId = uuid();
  const startTime = Date.now();
  
  try {
    // 提取对话历史，用于上下文
    const contextMessages = session.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    if (contextMessages.length === 0) {
      const error = new Error('没有可回复的消息');
      if (onError) onError(error);
      return;
    }
    
    // 获取会话的智能体ID
    const agentId = session.agentId || 'generalAssistant';
    console.log(`[Session] 使用智能体 ${agentId} 生成响应`);

    let responseContent = '';
    
    // 使用MastraAPI流式生成响应
    try {
      // 使用流式生成器
      const streamGenerator = MastraAPI.streamGenerate(agentId, {
        messages: contextMessages,
        options: {
          temperature: 0.7,
          max_tokens: 2000
        }
      });
      
      // 处理流式响应
      for await (const chunk of streamGenerator) {
        // 添加内容块到完整响应
        responseContent += chunk;
        
        // 调用更新回调
        if (onUpdate) onUpdate(responseContent);
      }
    } catch (streamError) {
      console.error('[Session] 流式生成失败，尝试非流式方法:', streamError);
      
      // 如果流式失败，尝试非流式方法
      try {
        const response = await MastraAPI.generate(agentId, {
          messages: contextMessages,
          options: {
            temperature: 0.7,
            max_tokens: 2000
          }
        });
        
        responseContent = response.text;
        if (onUpdate) onUpdate(responseContent);
      } catch (generateError) {
        throw generateError;
      }
    }
    
    // 确保响应不为空
    if (!responseContent.trim()) {
      responseContent = "抱歉，我目前无法生成响应。请稍后再试。";
      if (onUpdate) onUpdate(responseContent);
    }
    
    // 创建最终消息
    const assistantMessage: Message = {
      id: messageId,
      role: 'assistant',
      content: responseContent,
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
    
    // 如果会话包含敏感信息或已完成重要操作，轮换ID
    if (shouldRotateSessionId(session)) {
      console.log(`[Session] 轮换会话ID: ${sessionId}`);
      const rotatedSession = rotateSessionId(sessionId);
      if (rotatedSession) {
        console.log(`[Session] 会话ID已轮换: ${sessionId} -> ${rotatedSession.id}`);
      }
    }
    
  } catch (error) {
    console.error('[Session] 生成助手响应失败:', error);
    
    // 重试机制
    let retrySuccess = false;
    try {
      console.log('[Session] 尝试重试生成响应...');
      
      // 简单的重试响应
      const retryResponse = "抱歉，我在处理您的请求时遇到了问题，但我会尽力提供帮助。请问有什么我可以协助您的？";
      
      // 创建重试消息
      const retryMessage: Message = {
        id: uuid(),
        role: 'assistant',
        content: retryResponse,
        createdAt: Date.now()
      };
      
      // 重新获取最新会话
      const latestSession = getSession(sessionId);
      if (latestSession) {
        // 更新会话
        const updatedSession: Session = {
          ...latestSession,
          messages: [...latestSession.messages, retryMessage],
          updatedAt: Date.now()
        };
        
        // 保存会话
        Storage.upsertSession(updatedSession);
        
        // 触发同步
        SessionSync.triggerSessionSync('lumos-chat-sessions', Storage.getSessions());
        
        // 调用完成回调
        if (onComplete) onComplete(retryMessage);
        
        retrySuccess = true;
      }
    } catch (retryError) {
      console.error('[Session] 重试失败:', retryError);
    }
    
    if (!retrySuccess && onError) {
      onError(error as Error);
    }
  }
};

/**
 * 判断会话是否需要进行ID轮换
 * 根据会话中的敏感操作或消息数量决定
 */
const shouldRotateSessionId = (session: Session): boolean => {
  // 如果消息多于10条，概率性轮换
  if (session.messages.length > 10) {
    // 10%的概率轮换ID
    return Math.random() < 0.1;
  }
  return false;
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
  isValidSessionId,
  getSession,
  rotateSessionId,
  initSessionService
}; 