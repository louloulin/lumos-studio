import { useState, useEffect, useCallback } from 'react';
import { Session, GenerateConfig, Message, MessageRole } from '../services/types';
import { SessionService } from '../services';
import { UseSessionsResult } from '../types/session';

/**
 * 会话管理Hook
 * 提供会话列表管理、会话操作和消息处理功能
 */
export const useSessions = (): UseSessionsResult => {
  // 状态定义
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSessionState] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // 初始化加载会话
  useEffect(() => {
    try {
      setIsLoading(true);
      
      // 加载会话列表
      const loadedSessions = SessionService.getSessions();
      setSessions(loadedSessions);
      
      // 获取当前活跃会话
      const active = SessionService.getActiveSession();
      setActiveSessionState(active);
      
    } catch (err) {
      setError(err instanceof Error ? err : new Error('加载会话失败'));
      console.error('Failed to load sessions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // 创建新会话
  const createSession = useCallback((agentId: string, title?: string): Session => {
    try {
      const newSession = SessionService.createSession(agentId, title);
      
      // 更新状态
      setSessions(prevSessions => [...prevSessions, newSession]);
      setActiveSessionState(newSession);
      
      return newSession;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('创建会话失败'));
      console.error('Failed to create session:', err);
      throw err;
    }
  }, []);
  
  // 更新会话标题
  const updateSessionTitle = useCallback((sessionId: string, title: string): Session | null => {
    try {
      const updatedSession = SessionService.updateSessionTitle(sessionId, title);
      
      if (updatedSession) {
        // 更新状态
        setSessions(prevSessions => 
          prevSessions.map(s => s.id === sessionId ? updatedSession : s)
        );
        
        // 如果是当前活跃会话，更新活跃会话状态
        if (activeSession?.id === sessionId) {
          setActiveSessionState(updatedSession);
        }
      }
      
      return updatedSession;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('更新会话标题失败'));
      console.error('Failed to update session title:', err);
      return null;
    }
  }, [activeSession]);
  
  // 删除会话
  const deleteSession = useCallback((sessionId: string): void => {
    try {
      const remainingSessions = SessionService.deleteSession(sessionId);
      setSessions(remainingSessions);
      
      // 如果删除的是当前活跃会话，设置活跃会话为null
      if (activeSession?.id === sessionId) {
        setActiveSessionState(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('删除会话失败'));
      console.error('Failed to delete session:', err);
    }
  }, [activeSession]);
  
  // 清空会话消息
  const clearSessionMessages = useCallback((sessionId: string): Session | null => {
    try {
      const clearedSession = SessionService.clearSessionMessages(sessionId);
      
      if (clearedSession) {
        // 更新状态
        setSessions(prevSessions => 
          prevSessions.map(s => s.id === sessionId ? clearedSession : s)
        );
        
        // 如果是当前活跃会话，更新活跃会话状态
        if (activeSession?.id === sessionId) {
          setActiveSessionState(clearedSession);
        }
      }
      
      return clearedSession;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('清空会话消息失败'));
      console.error('Failed to clear session messages:', err);
      return null;
    }
  }, [activeSession]);
  
  // 设置当前活跃会话
  const setActiveSession = useCallback((sessionId: string): void => {
    try {
      SessionService.setActiveSession(sessionId);
      
      // 从会话列表中找到对应会话
      const session = sessions.find(s => s.id === sessionId);
      setActiveSessionState(session || null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('设置活跃会话失败'));
      console.error('Failed to set active session:', err);
    }
  }, [sessions]);
  
  // 添加用户消息
  const addUserMessage = useCallback((sessionId: string, content: string): Session | null => {
    try {
      const updatedSession = SessionService.addUserMessage(sessionId, content);
      
      if (updatedSession) {
        // 更新状态
        setSessions(prevSessions => 
          prevSessions.map(s => s.id === sessionId ? updatedSession : s)
        );
        
        // 如果是当前活跃会话，更新活跃会话状态
        if (activeSession?.id === sessionId) {
          setActiveSessionState(updatedSession);
        }
      }
      
      return updatedSession;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('添加用户消息失败'));
      console.error('Failed to add user message:', err);
      return null;
    }
  }, [activeSession]);
  
  // 生成助手响应
  const generateAssistantResponse = useCallback(
    async (sessionId: string, config?: GenerateConfig): Promise<void> => {
      try {
        // 创建一个临时状态存储生成中的内容
        let tempContent = '';
        let targetSession = sessions.find(s => s.id === sessionId);
        
        if (!targetSession) {
          throw new Error('会话不存在');
        }
        
        // 处理消息更新（流式响应）
        const handleMessageUpdate = (content: string) => {
          tempContent = content;
          
          // 创建临时会话副本用于UI更新
          if (targetSession) {
            const tempMessage: Message = {
              id: 'temp-response',
              role: 'assistant' as MessageRole,
              content,
              createdAt: Date.now(),
            };
            
            const tempSession: Session = {
              ...targetSession,
              messages: [...targetSession.messages, tempMessage],
              updatedAt: Date.now(),
            };
            
            // 如果是当前活跃会话，更新活跃会话状态
            if (activeSession?.id === sessionId) {
              setActiveSessionState(tempSession);
            }
          }
        };
        
        // 处理消息完成
        const handleComplete = (updatedSession: Session) => {
          // 更新会话列表
          setSessions(prevSessions => 
            prevSessions.map(s => s.id === sessionId ? updatedSession : s)
          );
          
          // 如果是当前活跃会话，更新活跃会话状态
          if (activeSession?.id === sessionId) {
            setActiveSessionState(updatedSession);
          }
        };
        
        // 处理错误
        const handleError = (err: Error) => {
          setError(err);
          console.error('Failed to generate assistant response:', err);
        };
        
        // 开始生成助手响应
        await SessionService.generateAssistantResponse(
          sessionId,
          config,
          handleMessageUpdate,
          handleComplete,
          handleError
        );
      } catch (err) {
        setError(err instanceof Error ? err : new Error('生成助手响应失败'));
        console.error('Failed to generate assistant response:', err);
      }
    },
    [sessions, activeSession]
  );
  
  // 导出会话数据
  const exportSessions = useCallback((): string => {
    try {
      return SessionService.exportSessions();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('导出会话数据失败'));
      console.error('Failed to export sessions:', err);
      return '';
    }
  }, []);
  
  // 导入会话数据
  const importSessions = useCallback((jsonData: string): boolean => {
    try {
      const success = SessionService.importSessions(jsonData);
      
      if (success) {
        // 重新加载会话
        const loadedSessions = SessionService.getSessions();
        setSessions(loadedSessions);
        
        // 获取当前活跃会话
        const active = SessionService.getActiveSession();
        setActiveSessionState(active);
      }
      
      return success;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('导入会话数据失败'));
      console.error('Failed to import sessions:', err);
      return false;
    }
  }, []);
  
  return {
    // 状态
    sessions,
    activeSession,
    isLoading,
    error,
    // 会话管理
    createSession,
    updateSessionTitle,
    deleteSession,
    clearSessionMessages,
    setActiveSession,
    // 消息管理
    addUserMessage,
    generateAssistantResponse,
    // 数据导入导出
    exportSessions,
    importSessions,
  };
}; 