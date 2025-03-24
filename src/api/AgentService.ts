import { MastraAPI } from './mastra';
import { Agent, AgentTool } from './types';

// 本地存储键
const LOCAL_AGENTS_KEY = 'lumos_studio_agents';

/**
 * 获取所有内置工具
 */
export const getBuiltinTools = (): AgentTool[] => {
  return [
    {
      id: 'web-search',
      name: '网络搜索',
      description: '从互联网搜索最新信息',
      icon: '🔍',
      parameters: [
        {
          name: 'query',
          type: 'string',
          description: '搜索查询',
          required: true
        }
      ]
    },
    {
      id: 'weather',
      name: '天气查询',
      description: '获取指定地点的天气信息',
      icon: '🌤️',
      parameters: [
        {
          name: 'location',
          type: 'string',
          description: '位置名称',
          required: true
        }
      ]
    },
    {
      id: 'calculator',
      name: '计算器',
      description: '执行数学计算',
      icon: '🧮',
      parameters: [
        {
          name: 'expression',
          type: 'string',
          description: '数学表达式',
          required: true
        }
      ]
    },
    {
      id: 'image-gen',
      name: '图像生成',
      description: '根据描述生成图像',
      icon: '🖼️',
      parameters: [
        {
          name: 'prompt',
          type: 'string',
          description: '图像描述',
          required: true
        }
      ]
    }
  ];
};

/**
 * 智能体服务类
 * 提供智能体的CRUD操作和持久化，集成Mastra API
 */
export class AgentService {
  constructor() {
    // 不再需要加载本地存储
  }

  /**
   * 获取Mastra系统智能体列表
   */
  async getMastraAgents(): Promise<Agent[]> {
    try {
      // 使用market-agents工具获取智能体市场列表
      const marketAgents = await MastraAPI.getMarketAgents();
      
      // 如果工具API成功，整理数据
      if (marketAgents && marketAgents.length > 0) {
        return marketAgents.map(agent => ({
          id: agent.id || agent.name,
          name: agent.name,
          description: agent.description || `Mastra智能体: ${agent.name}`,
          instructions: agent.instructions,
          model: agent.model,
          temperature: agent.temperature,
          maxTokens: agent.maxTokens,
          systemAgent: true
        }));
      }
      
      // 如果工具API失败或返回为空，尝试使用老方法
      const mastraAgents = await MastraAPI.getAgents();
      return mastraAgents.map(name => ({
        id: name,
        name: name,
        description: `Mastra智能体: ${name}`,
        systemAgent: true
      }));
    } catch (error) {
      console.error('获取Mastra智能体失败:', error);
      return [];
    }
  }

  /**
   * 获取所有智能体（包括本地和Mastra系统智能体）
   */
  async getAllAgents(): Promise<Agent[]> {
    try {
      // 获取本地存储的智能体
      const localAgents = await this.getLocalAgents();
      // 获取系统智能体
      const mastraAgents = await this.getMastraAgents();
      // 合并并返回
      return [...localAgents, ...mastraAgents];
    } catch (error) {
      console.error('获取所有智能体失败:', error);
      return [];
    }
  }

  /**
   * 获取本地创建的智能体
   */
  async getLocalAgents(): Promise<Agent[]> {
    try {
      // 通过agent-storage工具获取本地存储的智能体
      const agents = await MastraAPI.getAllAgents();
      // 过滤掉系统智能体
      return agents.filter(agent => !agent.systemAgent).map(agent => ({
        ...agent,
        systemAgent: false
      }));
    } catch (error) {
      console.error('获取本地智能体失败:', error);
      return [];
    }
  }

  /**
   * 根据ID获取智能体
   */
  async getAgent(id: string): Promise<Agent | null> {
    try {
      // 首先尝试获取本地智能体
      try {
        const agent = await MastraAPI.getAgent(id);
        if (agent) {
          return {
            ...agent,
            systemAgent: agent.systemAgent || false
          };
        }
      } catch (localError) {
        console.warn(`从本地获取智能体 ${id} 失败:`, localError);
      }
      
      // 如果本地获取失败，尝试获取系统智能体
      const mastraAgents = await this.getMastraAgents();
      return mastraAgents.find(agent => agent.id === id) || null;
    } catch (error) {
      console.error(`获取智能体 ${id} 失败:`, error);
      return null;
    }
  }

  /**
   * 创建新智能体 - 通过Mastra API
   */
  async createAgent(agent: Omit<Agent, 'id'>): Promise<Agent> {
    try {
      // 准备创建智能体的参数
      const createParams = {
        name: agent.name,
        description: agent.description,
        instructions: agent.instructions || '',
        model: agent.model || 'gpt-4o',
        temperature: agent.temperature || 0.7,
        maxTokens: agent.maxTokens || 4000,
        tools: agent.tools || [],
        systemAgent: false
      };
      
      // 调用Mastra API创建智能体
      const response = await MastraAPI.createAgent(createParams);
      
      // 返回创建的智能体
      return {
        ...agent,
        id: response.id || this.generateUniqueId(),
        systemAgent: false
      };
    } catch (error) {
      console.error('创建智能体失败:', error);
      throw error;
    }
  }

  /**
   * 更新智能体
   */
  async updateAgent(agent: Agent): Promise<Agent | null> {
    try {
      // 如果是系统智能体，则不允许更新
      if (agent.systemAgent) {
        console.warn('不能更新系统智能体');
        return null;
      }

      // 准备更新参数
      const updateParams = {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        instructions: agent.instructions || '',
        model: agent.model || 'gpt-4o',
        temperature: agent.temperature || 0.7,
        maxTokens: agent.maxTokens || 4000,
        tools: agent.tools || [],
        systemAgent: false
      };
      
      // 调用Mastra API更新智能体
      await MastraAPI.updateAgent(agent.id, updateParams);
      
      return agent;
    } catch (error) {
      console.error(`更新智能体 ${agent.id} 失败:`, error);
      return null;
    }
  }

  /**
   * 删除智能体
   */
  async deleteAgent(id: string): Promise<boolean> {
    try {
      // 先验证智能体是否存在
      const agent = await this.getAgent(id);
      if (!agent) {
        return false;
      }
      
      // 验证是否为系统智能体
      if (agent.systemAgent) {
        console.warn('不能删除系统智能体');
        return false;
      }
      
      // 调用Mastra API删除智能体
      return await MastraAPI.deleteAgent(id);
    } catch (error) {
      console.error(`删除智能体 ${id} 失败:`, error);
      return false;
    }
  }

  /**
   * 导出智能体为JSON
   */
  async exportAgent(id: string): Promise<string | null> {
    try {
      const agent = await this.getAgent(id);
      if (!agent) {
        return null;
      }

      return JSON.stringify(agent, null, 2);
    } catch (error) {
      console.error(`导出智能体 ${id} 失败:`, error);
      return null;
    }
  }

  /**
   * 导入智能体从JSON
   */
  async importAgent(agentData: string): Promise<Agent | null> {
    try {
      // 解析智能体数据
      const agent = JSON.parse(agentData) as Agent;
      
      // 确保智能体不是系统智能体
      agent.systemAgent = false;
      
      // 准备创建智能体的参数
      const createParams = {
        name: agent.name,
        description: agent.description,
        instructions: agent.instructions || '',
        model: agent.model || 'gpt-4o',
        temperature: agent.temperature || 0.7,
        maxTokens: agent.maxTokens || 4000,
        tools: agent.tools || [],
        systemAgent: false
      };
      
      // 调用Mastra API创建智能体
      const response = await MastraAPI.createAgent(createParams);
      
      // 返回创建的智能体
      return {
        ...agent,
        id: response.id,
        systemAgent: false
      };
    } catch (error) {
      console.error('导入智能体失败:', error);
      return null;
    }
  }

  /**
   * 生成唯一ID
   */
  private generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
  }
}

// 导出单例实例
export const agentService = new AgentService(); 