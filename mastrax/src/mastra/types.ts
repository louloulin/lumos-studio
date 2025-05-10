export interface AgentData {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: string;
  systemAgent?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface AgentTool {
  id: string;
  name: string;
  description: string;
  parameters?: Record<string, any>;
}

export interface ToolParameter {
  name: string;
  type: string;
  description?: string;
  required?: boolean;
  default?: any;
}

export interface AgentLog {
  id: string;
  agentId: string;
  operation: string;
  timestamp: number;
  details?: string;
  status: 'success' | 'error';
  error?: string;
} 