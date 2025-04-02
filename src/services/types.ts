/**
 * 消息角色类型
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * 基础消息类型
 */
export interface Message {
  id?: string;
  role: MessageRole;
  content: string;
  createdAt?: Date | number;
}

/**
 * 智能体定义
 */
export interface Agent {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  systemPrompt?: string;
  model?: string;
  modelConfig?: {
    temperature?: number;
    max_tokens?: number;
    [key: string]: any;
  };
  tools?: Tool[];
  createdAt?: Date | number;
  updatedAt?: Date | number;
}

/**
 * 工具定义
 */
export interface Tool {
  id: string;
  name: string;
  description?: string;
  type: 'function' | 'plugin';
  schema?: any;
  function?: any;
  pluginId?: string;
}

/**
 * 会话定义
 */
export interface Session {
  id: string;
  title: string;
  agentId: string;
  messages: Message[];
  createdAt: Date | number;
  updatedAt: Date | number;
  pinned?: boolean;
  tags?: string[];
}

/**
 * 生成配置
 */
export interface GenerateConfig {
  temperature?: number;
  max_tokens?: number;
  threadId?: string;
  resourceId?: string;
  [key: string]: any;
}

/**
 * 流式消息事件类型
 */
export interface StreamMessageEvent {
  type: 'message' | 'error' | 'done';
  message?: string;
  error?: Error;
} 