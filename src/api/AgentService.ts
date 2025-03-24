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
  private agents: Agent[] = [];
  private mastraClient: any = null;

  constructor() {
    this.loadAgents();
  }

  /**
   * 从本地存储加载智能体
   */
  private loadAgents(): void {
    try {
      const storedAgents = localStorage.getItem(LOCAL_AGENTS_KEY);
      if (storedAgents) {
        this.agents = JSON.parse(storedAgents);
      }
    } catch (error) {
      console.error('加载智能体失败:', error);
      this.agents = [];
    }
  }

  /**
   * 保存智能体到本地存储
   */
  private saveAgents(): void {
    try {
      localStorage.setItem(LOCAL_AGENTS_KEY, JSON.stringify(this.agents));
    } catch (error) {
      console.error('保存智能体失败:', error);
    }
  }

  /**
   * 获取Mastra系统智能体列表
   */
  async getMastraAgents(): Promise<Agent[]> {
    try {
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
    const mastraAgents = await this.getMastraAgents();
    return [...this.agents, ...mastraAgents];
  }

  /**
   * 获取本地创建的智能体
   */
  getLocalAgents(): Agent[] {
    return [...this.agents];
  }

  /**
   * 根据ID获取智能体
   */
  async getAgent(id: string): Promise<Agent | null> {
    // 先检查本地智能体
    const localAgent = this.agents.find(agent => agent.id === id);
    if (localAgent) {
      return localAgent;
    }

    // 如果不是本地智能体，尝试获取Mastra智能体
    try {
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
      // 调用Mastra API创建智能体
      // 准备创建智能体的参数
      const createParams = {
        name: agent.name,
        description: agent.description,
        instructions: agent.instructions || '',
        model: agent.model || 'gpt-4o',
        temperature: agent.temperature || 0.7,
        maxTokens: agent.maxTokens || 4000,
        tools: agent.tools || []
      };
      
      // 调用Mastra API创建智能体
      const response = await MastraAPI.createAgent(createParams);
      
      // 构建完整的智能体对象
      const newAgent: Agent = {
        ...agent,
        id: response.id || this.generateUniqueId(),
        systemAgent: false
      };
      
      // 保存到本地
      this.agents.push(newAgent);
      this.saveAgents();
      
      return newAgent;
    } catch (error) {
      console.error('创建Mastra智能体失败:', error);
      
      // 创建失败，降级为本地智能体
      const localAgent: Agent = {
        ...agent,
        id: this.generateUniqueId(),
        systemAgent: false
      };
      
      this.agents.push(localAgent);
      this.saveAgents();
      
      return localAgent;
    }
  }

  /**
   * 更新智能体
   */
  async updateAgent(agent: Agent): Promise<Agent | null> {
    try {
      // 检查是否为本地智能体
      const index = this.agents.findIndex(a => a.id === agent.id);
      
      if (index !== -1) {
        // 如果是本地智能体，先更新本地
        this.agents[index] = { ...agent };
        this.saveAgents();
        
        // 如果该智能体已注册到Mastra，也更新Mastra
        if (!agent.systemAgent) {
          try {
            // 准备更新参数
            const updateParams = {
              name: agent.name,
              description: agent.description,
              instructions: agent.instructions || '',
              model: agent.model || 'gpt-4o',
              temperature: agent.temperature || 0.7,
              maxTokens: agent.maxTokens || 4000,
              tools: agent.tools || []
            };
            
            // 调用Mastra API更新智能体
            await MastraAPI.updateAgent(agent.id, updateParams);
          } catch (mastraError) {
            console.warn('更新Mastra智能体失败，但本地已更新:', mastraError);
          }
        }
        
        return this.agents[index];
      } else if (!agent.systemAgent) {
        // 如果不是本地智能体，但也不是系统智能体，尝试直接更新Mastra
        // 准备更新参数
        const updateParams = {
          name: agent.name,
          description: agent.description,
          instructions: agent.instructions || '',
          model: agent.model || 'gpt-4o',
          temperature: agent.temperature || 0.7,
          maxTokens: agent.maxTokens || 4000,
          tools: agent.tools || []
        };
        
        // 调用Mastra API更新智能体
        await MastraAPI.updateAgent(agent.id, updateParams);
        
        // 添加到本地缓存
        this.agents.push(agent);
        this.saveAgents();
        
        return agent;
      }
      
      return null;
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
      // 本地删除
      const initialLength = this.agents.length;
      const agentToDelete = this.agents.find(agent => agent.id === id);
      
      this.agents = this.agents.filter(agent => agent.id !== id);
      
      if (this.agents.length !== initialLength) {
        this.saveAgents();
        
        // 如果不是系统智能体，也从Mastra删除
        if (agentToDelete && !agentToDelete.systemAgent) {
          try {
            await MastraAPI.deleteAgent(id);
          } catch (error) {
            console.warn(`删除Mastra智能体 ${id} 失败:`, error);
          }
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`删除智能体 ${id} 失败:`, error);
      return false;
    }
  }

  /**
   * 导出智能体为JSON
   */
  exportAgent(id: string): string | null {
    const agent = this.agents.find(a => a.id === id);
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
      // 解析智能体数据
      const agent = JSON.parse(agentData) as Agent;
      
      // 确保智能体ID是唯一的
      agent.id = this.generateUniqueId();
      agent.systemAgent = false;
      
      // 如果已连接到Mastra服务，则尝试同时导入到Mastra
      if (await MastraAPI.isRunning()) {
        try {
          // 准备创建智能体的参数
          const createParams = {
            name: agent.name,
            description: agent.description,
            instructions: agent.instructions || '',
            model: agent.model || 'gpt-4o',
            temperature: agent.temperature || 0.7,
            maxTokens: agent.maxTokens || 4000,
            tools: agent.tools || []
          };
          
          // 调用Mastra API创建智能体
          const response = await MastraAPI.createAgent(createParams);
          
          // 更新智能体ID
          agent.id = response.id || agent.id;
        } catch (mastraError) {
          console.warn('导入到Mastra失败，仅本地导入:', mastraError);
        }
      }
      
      // 本地保存
      this.agents.push(agent);
      this.saveAgents();
      return agent;
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