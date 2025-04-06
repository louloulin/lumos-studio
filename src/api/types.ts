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
  role: 'user' | 'assistant' | 'system';
  content: string;
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

/**
 * 智能体类型枚举
 * 用于标识智能体的主要功能类型
 */
export enum AgentType {
  General = 'general',           // 通用型智能体
  Coding = 'coding',             // 编程助手
  Writing = 'writing',           // 写作助手
  Research = 'research',         // 研究助手
  Customer = 'customer',         // 客户服务
  Data = 'data',                 // 数据分析
  Creative = 'creative',         // 创意设计
  Education = 'education',       // 教育辅导
  Tool = 'tool',                 // 工具型智能体
  Custom = 'custom'              // 自定义类型
}

/**
 * 智能体能力标签
 * 用于描述智能体具备的能力和专长
 */
export interface AgentCapability {
  id: string;                     // 能力唯一标识
  name: string;                   // 能力名称
  description: string;            // 能力描述
  level: 'basic' | 'intermediate' | 'advanced'; // 能力熟练程度
}

// 智能体定义
export interface Agent {
  id: string;                     // 智能体唯一标识
  name: string;                   // 智能体名称
  description: string;            // 智能体描述
  avatar?: string;                // 智能体头像URL
  instructions?: string;          // 系统提示词
  model?: string;                 // 使用的模型
  type?: AgentType;               // 智能体类型
  version?: string;               // 版本号，如"1.0.0"
  author?: string;                // 作者名称
  authorLink?: string;            // 作者链接
  temperature?: number;           // 温度参数
  maxTokens?: number;             // 最大token数
  tools?: AgentTool[];            // 智能体工具
  systemAgent?: boolean;          // 是否为系统智能体
  categories?: string[];          // 分类标签
  capabilities?: AgentCapability[]; // 智能体能力
  createdAt?: number;             // 创建时间
  updatedAt?: number;             // 更新时间
  metadata?: Record<string, any>; // 元数据
  icon?: string;                  // 图标URL
  featured?: boolean;             // 是否为推荐智能体
  public?: boolean;               // 是否公开
  welcomeMessage?: string;        // 欢迎消息
  examples?: string[];            // 示例提示词
  homepage?: string;              // 主页链接
  documentationUrl?: string;      // 文档链接
  license?: string;               // 许可证
  supportContact?: string;        // 支持联系方式
  parentId?: string;              // 父智能体ID，用于版本控制
  compatibleModels?: string[];    // 兼容的模型列表
}

// 智能体工具
export interface AgentTool {
  id: string;
  name: string;
  description: string;
  icon?: string;
  enabled?: boolean;
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

// 工具类型声明
export interface Tool {
  details(): Promise<any>;
  execute(params: Record<string, any>): Promise<ToolExecuteResult>;
}

export interface ToolExecuteResult {
  success: boolean;
  data?: any;
  error?: string;
}

// MastraClient类型扩展
export interface MastraClient {
  getAgents(): Promise<any[]>;
  getAgent(agentName: string): Agent;
  getTools(): Promise<Record<string, any>>;
  getTool(toolId: string): Tool;
}

/**
 * Mastra 智能体摘要信息
 */
export interface AgentSummary {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  model?: string;
  type?: string;
  isInstalled?: boolean;
}

/**
 * Mastra 智能体详细信息
 */
export interface AgentDetails extends AgentSummary {
  systemPrompt?: string;
  welcomeMessage?: string;
  temperature?: number;
  maxTokens?: number;
  compatibleModels?: string[];
  tags?: string[];
  category?: string;
  examples?: Array<{ input: string; output: string }>;
  creator?: string;
  createdAt?: number;
  updatedAt?: number;
}

/**
 * 生成响应选项
 */
export interface GenerateOptions {
  messages: MastraMessage[];
  temperature?: number;
  maxTokens?: number;
  model?: string;
  stop?: string[];
}

/**
 * 生成响应结果
 */
export interface GenerateResult {
  content: string;
  model?: string;
  tokensUsed?: number;
}

/**
 * 智能体创建请求
 */
export interface CreateAgentRequest {
  name: string;
  description?: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  avatar?: string;
  type?: string;
}

/**
 * API错误响应
 */
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
} 