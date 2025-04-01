import { MastraAPI } from './mastra';
import { Agent, AgentTool } from './types';
import { toolService } from './ToolService';

// 本地存储键
const LOCAL_AGENTS_KEY = 'lumos_studio_agents';

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
      // 从API获取所有智能体
      const response = await MastraAPI.getAllAgents();
      
      if (!response || !Array.isArray(response)) {
        return [];
      }
      
      // 处理每个智能体，确保tools字段被正确解析
      return response.map(agent => {
        let tools = [];
        if (agent.tools && typeof agent.tools === 'string') {
          try {
            tools = JSON.parse(agent.tools);
          } catch (e) {
            console.warn(`解析智能体ID ${agent.id} 的工具字符串失败`, e);
          }
        }
        
        return {
          id: agent.id,
          name: agent.name,
          description: agent.description || '',
          instructions: agent.instructions || '',
          model: agent.model || 'gpt-4o',
          temperature: agent.temperature || 0.7,
          maxTokens: agent.maxTokens || 4000,
          tools,
          systemAgent: agent.systemAgent || false
        };
      });
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
      // 从Mastra API获取智能体
      const response = await MastraAPI.getAgent(id);
      
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
  async createAgent(agent: Omit<Agent, 'id'>): Promise<Agent> {
    try {
      // 序列化工具列表
      let toolsString = '[]';
      if (agent.tools && Array.isArray(agent.tools)) {
        toolsString = JSON.stringify(agent.tools);
      }
      
      // 准备参数
      const agentParams = {
        ...agent,
        tools: toolsString
      };
      
      // 调用Mastra API创建智能体
      const result = await MastraAPI.createAgent(agentParams);
      
      if (!result) {
        throw new Error('创建智能体失败，API返回为空');
      }
      
      // 解析工具
      let tools = [];
      if (result.tools && typeof result.tools === 'string') {
        try {
          tools = JSON.parse(result.tools);
        } catch (e) {
          console.warn('解析创建的智能体工具失败:', e);
        }
      }
      
      return {
        ...result,
        tools
      };
    } catch (error) {
      console.error('创建智能体失败:', error);
      throw new Error(`创建智能体失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 更新智能体
   */
  async updateAgent(agent: Agent): Promise<Agent | null> {
    try {
      // 序列化工具列表
      let toolsString = '[]';
      if (agent.tools && Array.isArray(agent.tools)) {
        toolsString = JSON.stringify(agent.tools);
      }
      
      // 准备参数
      const agentParams = {
        ...agent,
        tools: toolsString
      };
      
      // 调用Mastra API更新智能体
      const result = await MastraAPI.updateAgent(agent.id, agentParams);
      
      if (!result) {
        throw new Error(`更新智能体ID ${agent.id} 失败，API返回为空`);
      }
      
      // 解析工具
      let tools = [];
      if (result.tools && typeof result.tools === 'string') {
        try {
          tools = JSON.parse(result.tools);
        } catch (e) {
          console.warn(`解析更新后的智能体ID ${agent.id} 工具失败:`, e);
        }
      }
      
      return {
        ...result,
        tools
      };
    } catch (error) {
      console.error(`更新智能体ID ${agent.id} 失败:`, error);
      throw new Error(`更新智能体失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 删除智能体
   */
  async deleteAgent(id: string): Promise<boolean> {
    try {
      // 调用Mastra API删除智能体
      const result = await MastraAPI.deleteAgent(id);
      return result;
    } catch (error) {
      console.error(`删除智能体ID ${id} 失败:`, error);
      throw new Error(`删除智能体失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 导出智能体为JSON
   */
  async exportAgent(id: string): Promise<string | null> {
    const agent = await this.getAgent(id);
    if (!agent) {
      return null;
    }
    
    return JSON.stringify(agent, null, 2);
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
}

// 创建单例实例
export const agentService = new AgentService();

// 导出单例
export default agentService; 