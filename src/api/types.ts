/**
 * Mastra API 相关类型定义
 */

// 消息内容类型
export interface MessageContent {
  type: 'text' | 'image';
  text?: string;
  image?: string;
}

// 消息类型定义
export interface Message {
  role: 'user' | 'assistant' | string;
  content: string | MessageContent[];
}

// 本地消息类型
export interface LocalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  images?: string[]; // Base64 encoded images
}

// Mastra消息类型
export interface MastraMessage {
  role: string;
  content: string | MessageContent[];
}

// 智能体生成请求
export interface AgentGenerateRequest {
  messages: MastraMessage[];
  stream?: boolean;
  options?: Record<string, any>;
}

// 智能体生成响应
export interface AgentGenerateResponse {
  text: string;
  metadata?: Record<string, any>;
}

// 智能体定义
export interface Agent {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  instructions?: string;
  model?: string;
  tools?: AgentTool[];
}

// 智能体工具
export interface AgentTool {
  id: string;
  name: string;
  description: string;
  icon?: string;
  parameters?: ToolParameter[];
}

// 工具参数
export interface ToolParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  default?: any;
} 