import { MastraAPI } from './mastra';
import { Agent, AgentType } from './types';
import { toolService } from './ToolService';

// 本地存储键
const LOCAL_AGENTS_KEY = 'lumos_studio_agents';

// 市场智能体类型
export interface MarketAgent extends Agent {
  rating: number;
  downloads: number;
  isInstalled?: boolean;
}

/**
 * 智能体服务类
 * 提供智能体的CRUD操作和持久化，集成Mastra API
 */
export class AgentService {
  private api: MastraAPI;

  constructor() {
    this.api = new MastraAPI();
  }

  /**
   * 获取Mastra系统智能体列表
   */
  async getMastraAgents(): Promise<Agent[]> {
    try {
      // 使用market-agents工具获取智能体市场列表
      const marketAgents = await this.api.getMastraAgents();
      
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
      const mastraAgents = await this.api.getAgents();
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
      const agents = await this.api.getAgents();
      return agents;
    } catch (error) {
      console.error('Failed to get agents:', error);
      return [];
    }
  }

  /**
   * 获取本地创建的智能体
   */
  async getLocalAgents(): Promise<Agent[]> {
    try {
      // 通过agent-storage工具获取本地存储的智能体
      const agents = await this.api.getAllAgents();
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
      // 从Mastra API获取智能体
      const response = await this.api.getAgent(id);
      
      if (!response) {
        return null;
      }
      
      // 解析tools字段
      let tools = [];
      if (response.tools && typeof response.tools === 'string') {
        try {
          tools = JSON.parse(response.tools);
        } catch (e) {
          console.warn(`解析智能体ID ${id} 的工具字符串失败`, e);
        }
      }
      
      // 构建智能体对象
      return {
        id: response.id,
        name: response.name,
        description: response.description || '',
        instructions: response.instructions || '',
        model: response.model || 'gpt-4o',
        temperature: response.temperature || 0.7,
        maxTokens: response.maxTokens || 4000,
        tools,
        systemAgent: response.systemAgent || false
      };
    } catch (error) {
      console.error(`获取智能体ID ${id} 失败:`, error);
      return null;
    }
  }

  /**
   * 创建智能体
   */
  async createAgent(agent: Agent): Promise<Agent> {
    try {
      const newAgent = await this.api.createAgent(agent);
      return newAgent;
    } catch (error) {
      console.error('Failed to create agent:', error);
      throw error;
    }
  }

  /**
   * 更新智能体
   */
  async updateAgent(agent: Agent): Promise<Agent> {
    try {
      const updatedAgent = await this.api.updateAgent(agent);
      return updatedAgent;
    } catch (error) {
      console.error('Failed to update agent:', error);
      throw error;
    }
  }

  /**
   * 删除智能体
   */
  async deleteAgent(agentId: string): Promise<void> {
    try {
      await this.api.deleteAgent(agentId);
    } catch (error) {
      console.error('Failed to delete agent:', error);
      throw error;
    }
  }

  /**
   * 导出智能体为JSON
   */
  async exportAgent(agentId: string): Promise<string> {
    try {
      const agent = await this.api.getAgent(agentId);
      if (!agent) {
        throw new Error('Agent not found');
      }
      return JSON.stringify(agent, null, 2);
    } catch (error) {
      console.error('Failed to export agent:', error);
      throw error;
    }
  }

  /**
   * 导入智能体从JSON
   */
  async importAgent(agentData: string): Promise<Agent | null> {
    try {
      const parsedAgent = JSON.parse(agentData) as Agent;
      
      // 验证必要字段
      if (!parsedAgent.name) {
        throw new Error('无效的智能体数据：缺少名称字段');
      }
      
      // 创建新智能体，确保生成新ID
      const { id, ...agentWithoutId } = parsedAgent;
      
      // 创建新智能体
      return await this.createAgent({
        ...agentWithoutId,
        name: `${parsedAgent.name} (导入)`,
        systemAgent: false
      });
    } catch (error) {
      console.error('导入智能体数据失败:', error);
      throw new Error(`导入智能体失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 生成唯一ID
   */
  private generateUniqueId(): string {
    return `agent-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  // 获取市场智能体列表
  async getMarketAgents(): Promise<MarketAgent[]> {
    try {
      const agents = await this.api.getMastraAgents();
      // 添加评分和下载次数等市场信息
      return agents.map(agent => ({
        ...agent,
        rating: Math.random() * 2 + 3, // 模拟 3-5 分的评分
        downloads: Math.floor(Math.random() * 1000), // 模拟下载次数
        createdAt: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000), // 随机创建时间
        updatedAt: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000), // 随机更新时间
      }));
    } catch (error) {
      console.error('Failed to get market agents:', error);
      return [];
    }
  }

  // 安装智能体
  async installAgent(agentId: string): Promise<Agent | null> {
    try {
      // 从市场获取智能体配置
      const marketAgent = await this.api.getMastraAgent(agentId);
      if (!marketAgent) {
        throw new Error('Agent not found in market');
      }

      // 创建本地智能体
      const localAgent = await this.api.createAgent({
        ...marketAgent,
        id: `installed-${Date.now()}`, // 生成新的本地ID
      });

      return localAgent;
    } catch (error) {
      console.error('Failed to install agent:', error);
      return null;
    }
  }
}

// 创建单例实例
export const agentService = new AgentService();

// 导出单例
export default agentService; 