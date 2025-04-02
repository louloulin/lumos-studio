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
  const session = ChatService.createSession(agentId, title);
  Storage.upsertSession(session);
  Storage.setActiveSessionId(session.id);
  return session;
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
  const sessions = Storage.getSessions();
  const session = sessions.find(s => s.id === sessionId);
  if (!session) return null;
  
  const message: Message = {
    role: 'user',
    content,
  };
  
  const updatedSession = ChatService.addMessage(session, message);
  Storage.upsertSession(updatedSession);
  return updatedSession;
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
  const sessions = Storage.getSessions();
  const session = sessions.find(s => s.id === sessionId);
  if (!session) {
    if (onError) onError(new Error('会话不存在'));
    return;
  }
  
  try {
    await ChatService.generateResponse(
      session,
      config,
      onMessageUpdate,
      (message) => {
        // 将生成的消息添加到会话
        const updatedSession = ChatService.addMessage(session, message);
        Storage.upsertSession(updatedSession);
        if (onComplete) onComplete(updatedSession);
      },
      onError
    );
  } catch (error) {
    if (onError) onError(error instanceof Error ? error : new Error('生成响应失败'));
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