import { v4 as uuid } from 'uuid';
import { Agent, Message, Session, GenerateConfig } from './types';
import * as ChatService from './chat';
import * as Storage from './storage';

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
 * 创建新会话
 * @param agentId 智能体ID
 * @param title 会话标题
 * @returns 新创建的会话
 */
export const createSession = (agentId: string, title: string = '新会话'): Session => {
  try {
    console.log(`[SessionService] 开始创建新会话, agentId: ${agentId}, title: ${title}`);
    
    // 检查是否有空会话
    const sessions = Storage.getSessions();
    const emptySession = sessions.find(s => s.messages.length === 0);
    
    // 如果有空会话，复用它而不是创建新会话
    if (emptySession) {
      console.log(`[SessionService] 发现空会话 ${emptySession.id}，复用而不是创建新会话`);
      const updatedSession = ChatService.updateSessionTitle({...emptySession, agentId}, title);
      Storage.upsertSession(updatedSession);
      Storage.setActiveSessionId(updatedSession.id);
      return updatedSession;
    }
    
    // 创建全新会话
    const sessionId = uuid(); // 预先生成ID，确保一致性
    const session = ChatService.createSession(agentId, title);
    
    // 确保session不为null
    if (!session) {
      console.error('[SessionService] ChatService.createSession返回null或undefined');
      // 创建备选会话
      const fallbackSession: Session = {
        id: sessionId,
        title: title || '新会话',
        agentId: agentId || 'generalAssistant',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      Storage.upsertSession(fallbackSession);
      Storage.setActiveSessionId(fallbackSession.id);
      return fallbackSession;
    }
    
    console.log(`[SessionService] 会话创建成功: ${session.id}`);
    
    // 持久化会话
    Storage.upsertSession(session);
    Storage.setActiveSessionId(session.id);
    return session;
  } catch (error) {
    console.error('[SessionService] 创建会话失败:', error);
    
    // 确保即使发生错误也能返回有效会话
    const fallbackSession: Session = {
      id: uuid(),
      title: title || '新会话',
      agentId: agentId || 'generalAssistant',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    try {
      Storage.upsertSession(fallbackSession);
      Storage.setActiveSessionId(fallbackSession.id);
    } catch (storageError) {
      console.error('[SessionService] 存储备用会话失败:', storageError);
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
export const addUserMessage = (sessionId: string, content: string): Session | null => {
  try {
    console.log(`[SessionService] 添加用户消息到会话 ${sessionId}`);
    const sessions = Storage.getSessions();
    let session = sessions.find(s => s.id === sessionId);
    
    // 如果会话不存在，创建一个新会话
    if (!session) {
      console.warn(`[SessionService] 会话 ${sessionId} 不存在，创建新会话`);
      session = createSession('generalAssistant', '新会话');
      if (!session) {
        throw new Error(`无法为消息创建会话: ${content}`);
      }
    }
    
    // 创建用户消息
    const message: Message = {
      id: uuid(),
      role: 'user',
      content,
      createdAt: Date.now(),
    };
    
    // 防止重复消息
    const isDuplicate = session.messages.some(
      msg => msg.role === 'user' && msg.content === content
    );
    
    if (isDuplicate) {
      console.warn(`[SessionService] 检测到重复消息，跳过添加`);
      return session;
    }
    
    // 更新会话
    const updatedSession = ChatService.addMessage(session, message);
    Storage.upsertSession(updatedSession);
    
    console.log(`[SessionService] 用户消息已添加，会话现在有 ${updatedSession.messages.length} 条消息`);
    return updatedSession;
  } catch (error) {
    console.error('[SessionService] 添加用户消息失败:', error);
    return null;
  }
};

/**
 * 生成助手响应
 * @param sessionId 会话ID
 * @param config 生成配置
 * @param onMessageUpdate 消息更新回调
 * @param onComplete 完成回调
 * @param onError 错误回调
 */
export const generateAssistantResponse = async (
  sessionId: string,
  config?: GenerateConfig,
  onMessageUpdate?: (content: string) => void,
  onComplete?: (session: Session) => void,
  onError?: (error: Error) => void
): Promise<void> => {
  console.log(`[SessionService] 为会话 ${sessionId} 生成助手响应`);
  
  const sessions = Storage.getSessions();
  const session = sessions.find(s => s.id === sessionId);
  
  if (!session) {
    const errorMsg = `会话不存在: ${sessionId}`;
    console.error(`[SessionService] ${errorMsg}`);
    if (onError) onError(new Error(errorMsg));
    return;
  }
  
  if (session.messages.length === 0) {
    const errorMsg = `会话 ${sessionId} 没有消息，无法生成响应`;
    console.warn(`[SessionService] ${errorMsg}`);
    if (onError) onError(new Error(errorMsg));
    return;
  }
  
  // 创建一个标记，防止重复处理完成事件
  let isCompleted = false;
  let inProgress = true;
  let retryCount = 0;
  const MAX_RETRIES = 2;
  
  // 设置超时保护，确保响应最终完成
  const timeoutId = setTimeout(() => {
    if (inProgress && !isCompleted) {
      console.warn(`[SessionService] 响应生成超时，强制完成`);
      isCompleted = true;
      inProgress = false;
      
      // 创建一个超时响应消息
      const timeoutMessage: Message = {
        id: uuid(),
        role: 'assistant',
        content: '抱歉，响应生成超时。请尝试再次发送您的问题。',
        createdAt: Date.now(),
      };
      
      // 将超时消息添加到会话
      const updatedSession = ChatService.addMessage(session, timeoutMessage);
      Storage.upsertSession(updatedSession);
      
      if (onComplete) {
        onComplete(updatedSession);
      }
    }
  }, 60000); // 60秒超时
  
  const tryGenerate = async () => {
    try {
      await ChatService.generateResponse(
        session,
        config,
        (content) => {
          if (onMessageUpdate && !isCompleted) onMessageUpdate(content);
        },
        (message) => {
          clearTimeout(timeoutId);
          
          // 防止重复处理完成事件
          if (isCompleted) {
            console.log('[SessionService] 忽略重复的完成回调');
            return;
          }
          
          isCompleted = true;
          inProgress = false;
          
          try {
            // 如果生成的消息为空，添加一个提示
            if (!message.content || message.content.trim() === '') {
              message.content = '抱歉，我无法为此生成回复。请尝试用不同的方式提问。';
            }
            
            // 将生成的消息添加到会话
            const updatedSession = ChatService.addMessage(session, message);
            Storage.upsertSession(updatedSession);
            
            // 确保我们只触发一次onComplete回调
            if (onComplete) {
              console.log('[SessionService] 调用onComplete回调');
              onComplete(updatedSession);
            }
          } catch (err) {
            console.error('[SessionService] 处理完成回调时出错:', err);
            if (onError && !isCompleted) onError(err instanceof Error ? err : new Error('处理完成回调时出错'));
          }
        },
        (error) => {
          console.error('[SessionService] 生成响应错误:', error);
          
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            console.log(`[SessionService] 重试生成响应 (${retryCount}/${MAX_RETRIES})`);
            return tryGenerate();
          }
          
          clearTimeout(timeoutId);
          
          if (!isCompleted) {
            isCompleted = true;
            inProgress = false;
            
            if (onError) onError(error);
          }
        }
      );
    } catch (error) {
      console.error('[SessionService] 生成响应出现异常:', error);
      
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.log(`[SessionService] 重试生成响应 (${retryCount}/${MAX_RETRIES})`);
        return tryGenerate();
      }
      
      clearTimeout(timeoutId);
      
      if (!isCompleted) {
        isCompleted = true;
        inProgress = false;
        
        if (onError) onError(error instanceof Error ? error : new Error('生成响应失败'));
      }
    }
  };
  
  // 开始生成响应
  await tryGenerate();
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
}; 