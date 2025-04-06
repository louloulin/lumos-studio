/**
 * 聊天相关类型定义
 */

/**
 * 消息角色类型
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * 消息类型
 */
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  // 消息所属的智能体ID
  agentId?: string;
  // 智能体名称，用于显示
  agentName?: string;
  // 智能体头像
  agentAvatar?: string;
  // 可选的图片支持
  images?: string[];
  // 是否正在生成
  generating?: boolean;
  // 错误信息
  error?: string;
}

/**
 * 会话类型
 */
export interface Session {
  id: string;
  title: string;
  // 主要智能体ID（默认使用）
  defaultAgentId: string;
  // 会话中的所有智能体IDs
  agentIds: string[];
  // 每个智能体的上下文设置
  agentContexts?: Record<string, {
    systemPrompt?: string;
    modelSettings?: any;
  }>;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  tags?: string[];
}

/**
 * 智能体简介信息
 */
export interface AgentSummary {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
}

/**
 * 会话摘要信息
 */
export interface SessionSummary {
  id: string;
  title: string;
  defaultAgentId: string;
  defaultAgentName?: string;
  messageCount: number;
  lastMessagePreview?: string;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
} 