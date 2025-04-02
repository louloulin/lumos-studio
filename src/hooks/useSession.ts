import { useState, useEffect, useCallback, useMemo } from 'react';
import { Session, Message, Agent, GenerateConfig } from '../services/types';
import { SessionService, MastraService } from '../services';
import { UseSessionResult } from '../types/session';

/**
 * 单个会话管理Hook
 * @param sessionId 会话ID
 */
export const useSession = (sessionId: string): UseSessionResult => {
  // 状态定义
  const [session, setSession] = useState<Session | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  // 加载会话数据
  useEffect(() => {
    const loadSession = async () => {
      try {
        setIsLoading(true);
        
        // 获取会话
        const sessions = SessionService.getSessions();
        const targetSession = sessions.find(s => s.id === sessionId);
        
        if (!targetSession) {
          throw new Error('会话不存在');
        }
        
        setSession(targetSession);
        
        // 设置为活跃会话
        SessionService.setActiveSession(sessionId);
        
        // 加载智能体信息
        try {
          const agentsList = await MastraService.getAgents();
          const agentInfo = agentsList.find(a => a.id === targetSession.agentId);
          setAgent(agentInfo || null);
        } catch (agentError) {
          console.error('Failed to load agent info:', agentError);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('加载会话失败'));
        console.error('Failed to load session:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSession();
  }, [sessionId]);
  
  // 发送消息并获取响应
  const sendMessage = useCallback(async (content: string): Promise<void> => {
    if (!session) {
      setError(new Error('会话未加载'));
      return;
    }
    
    try {
      // 添加用户消息
      const updatedSession = SessionService.addUserMessage(sessionId, content);
      if (!updatedSession) {
        throw new Error('添加用户消息失败');
      }
      
      setSession(updatedSession);
      
      // 准备生成助手响应
      setIsGenerating(true);
      
      // 处理消息更新（流式响应）
      const handleMessageUpdate = (content: string) => {
        if (updatedSession) {
          const tempMessage: Message = {
            id: 'temp-response',
            role: 'assistant',
            content,
            createdAt: Date.now(),
          };
          
          setSession({
            ...updatedSession,
            messages: [...updatedSession.messages, tempMessage],
          });
        }
      };
      
      // 处理消息完成
      const handleComplete = (resultSession: Session) => {
        setSession(resultSession);
        setIsGenerating(false);
      };
      
      // 处理错误
      const handleError = (err: Error) => {
        setError(err);
        setIsGenerating(false);
        console.error('Failed to generate assistant response:', err);
      };
      
      // 生成助手响应
      await SessionService.generateAssistantResponse(
        sessionId,
        undefined, // 使用默认配置
        handleMessageUpdate,
        handleComplete,
        handleError
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('发送消息失败'));
      setIsGenerating(false);
      console.error('Failed to send message:', err);
    }
  }, [session, sessionId]);
  
  // 重新生成最后一条消息
  const regenerateLastMessage = useCallback(async (): Promise<void> => {
    if (!session || session.messages.length === 0) {
      setError(new Error('没有可重新生成的消息'));
      return;
    }
    
    try {
      // 查找最后一条助手消息和前一条用户消息
      const messages = [...session.messages];
      let lastAssistantIndex = -1;
      
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'assistant') {
          lastAssistantIndex = i;
          break;
        }
      }
      
      if (lastAssistantIndex === -1) {
        throw new Error('没有助手消息可重新生成');
      }
      
      // 移除最后一条助手消息
      messages.splice(lastAssistantIndex);
      
      // 更新会话移除最后一条助手消息
      const updatedSession = {
        ...session,
        messages,
        updatedAt: Date.now(),
      };
      
      SessionService.updateSessionTitle(sessionId, session.title);
      setSession(updatedSession);
      
      // 重新生成响应
      setIsGenerating(true);
      
      // 处理消息更新（流式响应）
      const handleMessageUpdate = (content: string) => {
        if (updatedSession) {
          const tempMessage: Message = {
            id: 'temp-response',
            role: 'assistant',
            content,
            createdAt: Date.now(),
          };
          
          setSession({
            ...updatedSession,
            messages: [...updatedSession.messages, tempMessage],
          });
        }
      };
      
      // 处理消息完成
      const handleComplete = (resultSession: Session) => {
        setSession(resultSession);
        setIsGenerating(false);
      };
      
      // 处理错误
      const handleError = (err: Error) => {
        setError(err);
        setIsGenerating(false);
        console.error('Failed to regenerate message:', err);
      };
      
      // 生成助手响应
      await SessionService.generateAssistantResponse(
        sessionId,
        undefined, // 使用默认配置
        handleMessageUpdate,
        handleComplete,
        handleError
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('重新生成消息失败'));
      setIsGenerating(false);
      console.error('Failed to regenerate message:', err);
    }
  }, [session, sessionId]);
  
  // 更新会话标题
  const updateTitle = useCallback((title: string): void => {
    try {
      const updatedSession = SessionService.updateSessionTitle(sessionId, title);
      if (updatedSession) {
        setSession(updatedSession);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('更新会话标题失败'));
      console.error('Failed to update session title:', err);
    }
  }, [sessionId]);
  
  // 清空会话消息
  const clearMessages = useCallback((): void => {
    try {
      const clearedSession = SessionService.clearSessionMessages(sessionId);
      if (clearedSession) {
        setSession(clearedSession);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('清空会话消息失败'));
      console.error('Failed to clear session messages:', err);
    }
  }, [sessionId]);
  
  return {
    session,
    isLoading,
    error,
    agent,
    sendMessage,
    regenerateLastMessage,
    updateTitle,
    clearMessages,
  };
}; 