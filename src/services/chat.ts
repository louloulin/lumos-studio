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
    
    console.log('[ChatService] 开始生成流式响应, agentId:', agentId);
    
    // 开始生成流式响应
    const response = await streamGenerate(agentId, messages, config);
    
    // 根据Mastra文档，正确处理流式响应
    if (response && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = ''; // 累积内容而非独立显示每个token
      let chunkCount = 0;
      let messageMode = ''; // 'tokens' 或 'json' 或 'prefixed'
      
      try {
        console.log('[ChatService] 开始处理流式响应');
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // 流已结束
            console.log('[ChatService] 流式响应已结束, 最终消息长度:', accumulatedContent.length);
            if (accumulatedContent && onComplete) {
              assistantMessage.content = accumulatedContent;
              onComplete(assistantMessage);
            }
            break;
          }
          
          // 解码二进制数据为文本
          const chunk = decoder.decode(value, { stream: true });
          chunkCount++;
          
          try {
            // 如果这是第一个数据块，检测响应格式
            if (chunkCount === 1) {
              if (chunk.includes('data: {')) {
                messageMode = 'json';
                console.log('[ChatService] 检测到JSON格式的消息');
              } else if (chunk.match(/^0:".*"$/m)) {
                messageMode = 'prefixed';
                console.log('[ChatService] 检测到带前缀的文本格式');
              } else {
                messageMode = 'tokens';
                console.log('[ChatService] 检测到纯文本token流');
              }
            }
            
            console.log(`[ChatService] 收到数据块 #${chunkCount}, 大小: ${value.length}字节, 模式: ${messageMode}`);
            
            const lines = chunk.split('\n').filter(line => line.trim());
            
            // 不同格式的处理逻辑
            if (messageMode === 'prefixed') {
              // 0:"text" 格式处理
              for (const line of lines) {
                // 匹配 0:"text" 格式
                const textMatch = line.match(/^0:"(.+)"$/);
                if (textMatch) {
                  const textContent = textMatch[1];
                  
                  // 处理转义字符
                  const unescapedText = textContent
                    .replace(/\\n/g, '\n')
                    .replace(/\\"/g, '"')
                    .replace(/\\\\/g, '\\');
                  
                  accumulatedContent += unescapedText;
                  assistantMessage.content = accumulatedContent;
                  
                  if (onMessageUpdate) {
                    onMessageUpdate(accumulatedContent);
                  }
                } else if (line.startsWith('f:') || line.startsWith('d:') || line.startsWith('e:')) {
                  // 元数据处理
                  console.log(`[ChatService] 收到元数据: ${line}`);
                  
                  // 如果是结束标记
                  if (line.includes('"finishReason":"stop"')) {
                    if (accumulatedContent && onComplete) {
                      assistantMessage.content = accumulatedContent;
                      onComplete(assistantMessage);
                    }
                  }
                }
              }
            } else if (messageMode === 'json') {
              // JSON格式处理
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  
                  if (data === '[DONE]') {
                    // 流结束标记
                    console.log('[ChatService] 收到[DONE]标记');
                    if (accumulatedContent && onComplete) {
                      assistantMessage.content = accumulatedContent;
                      onComplete(assistantMessage);
                    }
                    break;
                  }
                  
                  try {
                    const parsed = JSON.parse(data);
                    
                    if (parsed.type === 'message' && parsed.message) {
                      accumulatedContent += parsed.message;
                      assistantMessage.content = accumulatedContent;
                      
                      if (onMessageUpdate) {
                        onMessageUpdate(accumulatedContent);
                      }
                    } else if (parsed.type === 'error') {
                      throw new Error(parsed.error?.message || '生成失败');
                    }
                  } catch (parseError) {
                    console.warn('[ChatService] 解析JSON失败:', parseError);
                  }
                }
              }
            } else {
              // 直接文本模式 - 每个chunk就是文本内容
              accumulatedContent += chunk;
              assistantMessage.content = accumulatedContent;
              
              if (onMessageUpdate) {
                onMessageUpdate(accumulatedContent);
              }
            }
          } catch (chunkError) {
            console.error('[ChatService] 处理数据块时出错:', chunkError);
          }
        }
      } catch (err) {
        console.error('[ChatService] 处理响应流时发生错误:', err);
        if (onError) onError(err instanceof Error ? err : new Error('处理响应流时发生错误'));
      } finally {
        try {
          reader.releaseLock();
        } catch (lockError) {
          console.warn('[ChatService] 释放reader锁时出错:', lockError);
        }
        console.log('[ChatService] 响应流处理完成');
      }
    } else {
      console.error('[ChatService] 无效的流式响应:', response);
      throw new Error('无效的流式响应');
    }
  } catch (error) {
    console.error('[ChatService] 生成响应失败:', error);
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