import { Session, Message, GenerateConfig, Agent } from '../services/types';

/**
 * 会话状态管理Hook返回类型
 */
export interface UseSessionsResult {
  // 状态
  sessions: Session[];
  activeSession: Session | null;
  isLoading: boolean;
  error: Error | null;
  // 会话管理
  createSession: (agentId: string, title?: string) => Session;
  updateSessionTitle: (sessionId: string, title: string) => Session | null;
  deleteSession: (sessionId: string) => void;
  clearSessionMessages: (sessionId: string) => Session | null;
  setActiveSession: (sessionId: string) => void;
  // 消息管理
  addUserMessage: (sessionId: string, content: string) => Session | null;
  generateAssistantResponse: (
    sessionId: string, 
    config?: GenerateConfig
  ) => Promise<void>;
  // 数据导入导出
  exportSessions: () => string;
  importSessions: (jsonData: string) => boolean;
}

/**
 * 会话列表项
 */
export interface SessionItem {
  id: string;
  title: string;
  agentId: string;
  agentName?: string;
  lastMessage?: string;
  messageCount: number;
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
  pinned?: boolean;
}

/**
 * 会话详情Hook返回类型
 */
export interface UseSessionResult {
  session: Session | null;
  isLoading: boolean;
  error: Error | null;
  agent: Agent | null;
  sendMessage: (content: string) => Promise<void>;
  regenerateLastMessage: () => Promise<void>;
  updateTitle: (title: string) => void;
  clearMessages: () => void;
} 