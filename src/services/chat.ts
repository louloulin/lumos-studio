import { v4 as uuid } from 'uuid';
import { Message, Session, GenerateConfig, StreamMessageEvent } from './types';
import { getAgent, streamGenerate } from './mastra';

/**
 * 创建一个新的聊天会话
 * @param agentId 智能体ID
 * @param title 会话标题
 * @returns 新的会话对象
 */
export const createSession = (agentId: string, title: string = '新会话'): Session => {
  return {
    id: uuid(),
    title,
    agentId,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};

/**
 * 向会话添加一条消息
 * @param session 会话对象
 * @param message 消息对象
 * @returns 更新后的会话对象
 */
export const addMessage = (session: Session, message: Message): Session => {
  const updatedSession = {
    ...session,
    messages: [...session.messages, { ...message, id: uuid(), createdAt: Date.now() }],
    updatedAt: Date.now(),
  };
  
  return updatedSession;
};

/**
 * 生成AI响应
 * @param session 会话对象
 * @param config 配置项
 * @returns 流式响应处理函数
 */
export const generateResponse = async (
  session: Session,
  config?: GenerateConfig,
  onMessageUpdate?: (content: string) => void,
  onComplete?: (message: Message) => void,
  onError?: (error: Error) => void
) => {
  try {
    const { agentId, messages } = session;
    
    // 创建一个空的助手消息
    const assistantMessage: Message = {
      id: uuid(),
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
    };
    
    // 开始生成流式响应
    const response = await streamGenerate(agentId, messages, config);
    
    // 根据Mastra文档，正确处理流式响应
    if (response && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // 流已结束
            if (onComplete) onComplete(assistantMessage);
            break;
          }
          
          // 解码二进制数据为文本
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim());
          
          // 处理每一行数据
          for (const line of lines) {
            try {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                
                if (data === '[DONE]') {
                  // 流结束标记
                  if (onComplete) onComplete(assistantMessage);
                  break;
                }
                
                const parsed = JSON.parse(data);
                
                if (parsed.type === 'message') {
                  // 更新消息内容
                  assistantMessage.content += parsed.message || '';
                  if (onMessageUpdate) onMessageUpdate(assistantMessage.content);
                } else if (parsed.type === 'error') {
                  throw new Error(parsed.error?.message || '生成失败');
                }
              }
            } catch (e) {
              console.error('Error parsing stream data:', e, line);
            }
          }
        }
      } catch (err) {
        if (onError) onError(err instanceof Error ? err : new Error('处理响应流时发生错误'));
      } finally {
        reader.releaseLock();
      }
    } else {
      throw new Error('无效的流式响应');
    }
  } catch (error) {
    if (onError) onError(error instanceof Error ? error : new Error('未知错误'));
  }
};

/**
 * 更新会话标题
 * @param session 会话对象
 * @param title 新标题
 * @returns 更新后的会话对象
 */
export const updateSessionTitle = (session: Session, title: string): Session => {
  return {
    ...session,
    title,
    updatedAt: Date.now(),
  };
};

/**
 * 清空会话消息
 * @param session 会话对象
 * @returns 更新后的会话对象
 */
export const clearSessionMessages = (session: Session): Session => {
  return {
    ...session,
    messages: [],
    updatedAt: Date.now(),
  };
};

export default {
  createSession,
  addMessage,
  generateResponse,
  updateSessionTitle,
  clearSessionMessages,
}; 