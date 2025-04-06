import { v4 as uuid } from 'uuid';
import { Message, Session, MessageRole } from '@/types/chat';
import { MastraAPI } from '../api/mastra';
import { getDefaultStore } from 'jotai';
import * as atoms from '../stores/atoms';
import * as sessionActions from '../stores/sessionActions';

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
    defaultAgentId: agentId,
    agentIds: [agentId],
    messages: [],
    agentContexts: {},
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
export const addClientMessage = (session: Session, message: Omit<Message, "id" | "createdAt">): Session => {
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
 * @param config 生成配置
 * @param onMessageUpdate 消息更新回调
 * @param onComplete 生成完成回调
 * @param onError 错误处理回调
 */
export const generateResponse = async (
  session: Session,
  config?: any,
  onMessageUpdate?: (content: string) => void,
  onComplete?: (message: Message) => void,
  onError?: (error: Error) => void
) => {
  try {
    const { defaultAgentId, messages } = session;
    
    if (!defaultAgentId) {
      throw new Error('会话没有指定默认智能体ID');
    }
    
    // 创建一个空的助手消息
    const assistantMessage: Message = {
      id: uuid(),
      role: 'assistant' as MessageRole,
      content: '',
      agentId: defaultAgentId,
      createdAt: Date.now(),
    };
    
    console.log('[ChatService] 开始生成流式响应, agentId:', defaultAgentId);
    
    // 构建消息上下文
    const contextMessages = messages.map(m => ({
      role: m.role,
      content: m.content
    }));
    
    // 直接使用MastraAPI进行流式生成
    let accumulatedContent = '';
    
    try {
      // 使用MastraAPI的流式生成接口
      for await (const chunk of MastraAPI.streamGenerate(defaultAgentId, {
        messages: contextMessages,
        options: config || {}
      })) {
        if (chunk) {
          accumulatedContent += chunk;
          
          // 更新消息内容
          if (onMessageUpdate) {
            onMessageUpdate(accumulatedContent);
          }
        }
      }
      
      // 流式生成结束
      console.log('[ChatService] 流式响应已结束, 最终消息长度:', accumulatedContent.length);
      
      // 更新最终消息
      assistantMessage.content = accumulatedContent;
      
      if (onComplete) {
        onComplete(assistantMessage);
      }
    } catch (streamError) {
      console.error('[ChatService] 流式生成失败, 尝试使用普通生成:', streamError);
      
      try {
        // 尝试使用普通生成
        const result = await MastraAPI.generate(defaultAgentId, {
          messages: contextMessages,
          options: config || {}
        });
        
        if (result && result.text) {
          accumulatedContent = result.text;
          assistantMessage.content = result.text;
          
          if (onMessageUpdate) {
            onMessageUpdate(result.text);
          }
          
          if (onComplete) {
            onComplete(assistantMessage);
          }
        } else {
          throw new Error('生成结果无效');
        }
      } catch (fallbackError) {
        console.error('[ChatService] 普通生成也失败:', fallbackError);
        throw fallbackError;
      }
    }
  } catch (error) {
    console.error('[ChatService] 生成响应失败:', error);
    if (onError) onError(error instanceof Error ? error : new Error('生成响应失败'));
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

/**
 * 发送消息并指定响应的智能体
 * @param sessionId 会话ID
 * @param content 消息内容
 * @param agentId 可选的智能体ID，如果不提供则使用会话默认智能体
 * @param onUpdate 可选的回调函数，在接收到流式响应时调用
 */
export async function sendMessageToAgent(
  sessionId: string,
  content: string,
  agentId?: string,
  onUpdate?: (content: string) => void,
): Promise<void> {
  try {
    console.log(`[ChatService] 开始发送消息, sessionId: ${sessionId}, 指定智能体: ${agentId || '默认'}`);
    
    const store = getDefaultStore();
    const session = sessionActions.getSession(sessionId);
    
    if (!session) {
      console.error(`[ChatService] 错误: 找不到会话 ${sessionId}`);
      return;
    }
    
    // 如果未指定智能体，使用会话默认智能体
    const targetAgentId = agentId || session.defaultAgentId;
    console.log(`[ChatService] 目标智能体ID: ${targetAgentId}`);
    
    // 添加用户消息
    const userMessage = sessionActions.addMessage(sessionId, {
      role: 'user',
      content,
      // 不需要给用户消息指定agentId
    });
    
    // 记录日志
    console.log(`[ChatService] 已添加用户消息`, { 
      sessionId, 
      messageId: userMessage.id,
      contentLength: content.length
    });
    
    // 获取智能体信息
    console.log(`[ChatService] 开始获取智能体信息: ${targetAgentId}`);
    let agent;
    try {
      agent = await MastraAPI.getAgent(targetAgentId);
      console.log(`[ChatService] 获取智能体信息成功: ${agent?.name || targetAgentId}`);
    } catch (error) {
      console.error(`[ChatService] 获取智能体信息失败: ${targetAgentId}`, error);
    }
    
    // 创建助手消息
    const assistantMessage = sessionActions.addMessage(sessionId, {
      role: 'assistant',
      content: '',
      agentId: targetAgentId,
      agentName: agent?.name || '助手',
      agentAvatar: agent?.avatar,
      generating: true,
    });
    
    console.log(`[ChatService] 已创建助手消息占位符: ${assistantMessage.id}`);
    
    try {
      // 构建上下文消息 - 只包含当前会话中与目标智能体相关的消息或无特定智能体的消息
      const contextMessages = session.messages
        .filter(m => m.id !== assistantMessage.id)
        .filter(m => !m.agentId || m.agentId === targetAgentId || m.role === 'user')
        .map(m => ({
          role: m.role,
          content: m.content
        }));
      
      // 添加系统提示
      const systemPrompt = session.agentContexts?.[targetAgentId]?.systemPrompt;
      if (systemPrompt) {
        contextMessages.unshift({
          role: 'system',
          content: systemPrompt
        });
        console.log(`[ChatService] 已添加系统提示, 长度: ${systemPrompt.length}`);
      }
      
      // 应用模型设置
      const modelSettings = session.agentContexts?.[targetAgentId]?.modelSettings || {};
      
      console.log(`[ChatService] 构建请求上下文完成:`, { 
        targetAgentId,
        contextMessagesCount: contextMessages.length,
        hasSystemPrompt: !!systemPrompt,
        modelSettings
      });
      
      let accumulatedText = '';
      let streamStartTime = Date.now();
      
      // 使用MastraAPI的流式生成
      try {
        console.log(`[ChatService] 开始调用MastraAPI.streamGenerate: ${targetAgentId}`);
        
        for await (const chunk of MastraAPI.streamGenerate(targetAgentId, {
          messages: contextMessages,
          options: modelSettings
        })) {
          // 第一个chunk收到的时间
          if (accumulatedText === '') {
            const timeToFirstToken = Date.now() - streamStartTime;
            console.log(`[ChatService] 收到首个token, 耗时: ${timeToFirstToken}ms`);
          }
          
          // 处理接收到的chunk
          if (chunk) {
            accumulatedText += chunk;
            
            // 记录进度
            if (accumulatedText.length % 100 === 0) {
              console.log(`[ChatService] 流式响应进度: ${accumulatedText.length}字符`);
            }
            
            // 更新消息内容
            sessionActions.updateMessage(sessionId, assistantMessage.id, {
              content: accumulatedText,
            });
            
            if (onUpdate) {
              onUpdate(accumulatedText);
            }
          }
        }
        
        const totalTime = Date.now() - streamStartTime;
        console.log(`[ChatService] 流式生成完成, 总时间: ${totalTime}ms, 内容长度: ${accumulatedText.length}`);
        
      } catch (streamError) {
        console.error('[ChatService] 流式生成失败, 错误详情:', streamError);
        console.log('[ChatService] 尝试使用普通生成...');
        
        // 如果流式生成失败，尝试使用普通生成
        try {
          const fallbackStartTime = Date.now();
          
          const result = await MastraAPI.generate(targetAgentId, {
            messages: contextMessages,
            options: modelSettings
          });
          
          const fallbackTime = Date.now() - fallbackStartTime;
          
          if (result && result.text) {
            accumulatedText = result.text;
            console.log(`[ChatService] 普通生成成功, 耗时: ${fallbackTime}ms, 长度: ${result.text.length}`);
            
            // 更新消息内容
            sessionActions.updateMessage(sessionId, assistantMessage.id, {
              content: accumulatedText,
            });
            
            if (onUpdate) {
              onUpdate(accumulatedText);
            }
          } else {
            console.error('[ChatService] 普通生成失败: 无效的响应格式', result);
            throw new Error('生成结果无效');
          }
        } catch (fallbackError) {
          console.error('[ChatService] 普通生成也失败:', fallbackError);
          throw fallbackError;
        }
      }
      
      // 完成生成
      console.log(`[ChatService] 更新消息状态为已完成生成`);
      sessionActions.updateMessage(sessionId, assistantMessage.id, {
        content: accumulatedText,
        generating: false,
      });
      
    } catch (error) {
      console.error(`[ChatService] 生成消息失败:`, error);
      
      // 统一错误处理
      sessionActions.updateMessage(sessionId, assistantMessage.id, {
        content: assistantMessage.content || '',
        generating: false,
        error: error instanceof Error ? error.message : '生成失败',
      });
    }
  } catch (outerError) {
    // 捕获最外层的错误，确保不会导致整个应用崩溃
    console.error(`[ChatService] 发送消息过程中出现严重错误:`, outerError);
  }
}

/**
 * 向当前会话发送消息
 * @param content 消息内容
 * @param agentId 可选的智能体ID
 * @param onUpdate 可选的回调函数
 */
export async function sendMessageToCurrent(
  content: string,
  agentId?: string,
  onUpdate?: (content: string) => void,
): Promise<void> {
  const store = getDefaultStore();
  const currentSessionId = store.get(atoms.currentSessionIdAtom);
  
  if (!currentSessionId) {
    console.error('No active session');
    return;
  }
  
  await sendMessageToAgent(currentSessionId, content, agentId, onUpdate);
}

/**
 * 取消正在生成的消息
 * @param sessionId 会话ID
 * @param messageId 消息ID
 */
export function cancelGeneration(sessionId: string, messageId: string): void {
  // 这里可以实现取消生成的逻辑
  const message = sessionActions.getMessage(sessionId, messageId);
  
  if (message && message.generating) {
    sessionActions.updateMessage(sessionId, messageId, {
      ...message,
      content: message.content + ' [已取消]',
      generating: false,
    });
  }
}

/**
 * 重新生成最后一条助手消息
 * @param sessionId 会话ID
 * @param onUpdate 消息更新回调
 */
export async function regenerateLastMessage(
  sessionId: string,
  onUpdate?: (content: string) => void,
): Promise<void> {
  // 获取会话
  const session = sessionActions.getSession(sessionId);
  if (!session) {
    throw new Error('会话不存在');
  }
  
  // 找到最后一条助手消息
  const assistantMessages = session.messages.filter(m => m.role === 'assistant');
  if (assistantMessages.length === 0) {
    throw new Error('没有可重新生成的消息');
  }
  
  const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];
  const lastAssistantIndex = session.messages.findIndex(m => m.id === lastAssistantMessage.id);
  
  // 找到上一条用户消息
  let userMessageIndex = lastAssistantIndex - 1;
  while (userMessageIndex >= 0 && session.messages[userMessageIndex].role !== 'user') {
    userMessageIndex--;
  }
  
  if (userMessageIndex < 0) {
    throw new Error('未找到相关的用户消息');
  }
  
  const userMessage = session.messages[userMessageIndex];
  
  // 使用原始智能体或默认智能体
  const targetAgentId = lastAssistantMessage.agentId || session.defaultAgentId;
  
  // 重新发送用户消息到相同的智能体
  await sendMessageToAgent(
    sessionId,
    userMessage.content,
    targetAgentId,
    onUpdate
  );
}

/**
 * 从多个智能体获取回复
 * @param sessionId 会话ID
 * @param content 消息内容
 * @param agentIds 智能体ID数组
 * @param onUpdate 消息更新回调
 */
export async function sendMessageToMultipleAgents(
  sessionId: string,
  content: string,
  agentIds: string[],
  onUpdate?: (agentId: string, content: string) => void,
): Promise<void> {
  // 确保有智能体
  if (!agentIds.length) {
    throw new Error('未指定智能体');
  }
  
  // 添加用户消息
  sessionActions.addMessage(sessionId, {
    role: 'user',
    content,
  });
  
  // 为每个智能体并行生成回复
  await Promise.all(agentIds.map(async (agentId) => {
    try {
      await sendMessageToAgent(
        sessionId,
        content,
        agentId,
        (content) => {
          if (onUpdate) onUpdate(agentId, content);
        }
      );
    } catch (error) {
      console.error(`智能体 ${agentId} 生成回复失败:`, error);
      // 继续处理其他智能体，不中断整体流程
    }
  }));
}

export default {
  createSession,
  addClientMessage,
  generateResponse,
  updateSessionTitle,
  clearSessionMessages,
  sendMessageToAgent,
  regenerateLastMessage,
  sendMessageToMultipleAgents,
  sendMessageToCurrent,
  cancelGeneration,
}; 