import { MastraClient } from '@mastra/client-js';
import { Agent, GenerateConfig, Message } from './types';

// 读取环境变量的帮助函数
const getEnv = (key: string, defaultValue: string = ''): string => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }
  return defaultValue;
};

// 判断环境变量
const getMastraApiUrl = () => {
  // 优先使用NEXT_PUBLIC前缀的环境变量，适配Next.js
  const nextPublicUrl = getEnv('NEXT_PUBLIC_MASTRA_API_URL');
  if (nextPublicUrl) {
    return nextPublicUrl;
  }
  
  // 支持Vite环境变量
  const viteUrl = getEnv('VITE_MASTRA_API_URL');
  if (viteUrl) {
    return viteUrl;
  }
  
  // 默认本地开发地址
  return 'http://localhost:4111';
};

/**
 * Lumos Mastra 客户端
 * 提供统一的 Mastra 服务访问接口
 */
export const mastraClient = new MastraClient({
  baseUrl: getMastraApiUrl(),
});

/**
 * 获取指定名称的智能体
 * @param agentId 智能体ID
 * @returns 智能体实例
 */
export const getAgent = (agentId: string) => {
  return mastraClient.getAgent(agentId);
};

/**
 * 获取所有可用的智能体
 * @returns 智能体列表
 */
export const getAgents = async (): Promise<Agent[]> => {
  try {
    // 获取所有智能体
    const agentsResponse = await mastraClient.getAgents();
    
    // Mastra客户端返回的是一个对象，其中包含了智能体列表
    const agentEntries = Object.entries(agentsResponse);
    
    // 转换为内部定义的智能体类型
    return agentEntries.map(([id, agentData]: [string, any]) => ({
      id,
      name: agentData.name || id,
      description: agentData.description || '',
      avatar: agentData.avatar || '',
      systemPrompt: agentData.instructions || '',
      model: agentData.modelId || agentData.provider,
      modelConfig: {
        temperature: agentData.temperature,
        max_tokens: agentData.maxTokens,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  } catch (error) {
    console.error('Failed to get agents:', error);
    return [];
  }
};

/**
 * 处理智能体流式响应
 * @param agentId 智能体ID
 * @param messages 消息列表
 * @param options 选项
 * @returns 流式响应
 */
export const streamGenerate = async (
  agentId: string,
  messages: Array<Message>,
  options?: GenerateConfig
) => {
  const agent = mastraClient.getAgent(agentId);
  return agent.stream({ messages, ...options });
};

/**
 * 处理智能体非流式响应
 * @param agentId 智能体ID
 * @param messages 消息列表
 * @param options 选项
 * @returns 非流式响应
 */
export const generate = async (
  agentId: string,
  messages: Array<Message>,
  options?: GenerateConfig
) => {
  const agent = mastraClient.getAgent(agentId);
  return agent.generate({ messages, ...options });
};

export default {
  client: mastraClient,
  getAgent,
  getAgents,
  streamGenerate,
  generate,
}; 