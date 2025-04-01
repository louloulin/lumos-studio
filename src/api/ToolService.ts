import { MastraAPI } from './mastra';

/**
 * 工具参数定义
 */
export interface ToolParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  defaultValue?: any;
}

/**
 * 工具定义
 */
export interface Tool {
  id: string;
  name: string;
  description: string;
  icon?: string;
  parameters: ToolParameter[];
  execute: (params: Record<string, any>) => Promise<any>;
  enabled?: boolean;
}

/**
 * 工具注册表
 * 存储所有注册的工具
 */
class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  /**
   * 注册工具
   */
  register(tool: Tool): void {
    if (this.tools.has(tool.id)) {
      console.warn(`工具 ${tool.id} 已存在，将被覆盖`);
    }
    this.tools.set(tool.id, tool);
    console.log(`成功注册工具: ${tool.name} (${tool.id})`);
  }

  /**
   * 注销工具
   */
  unregister(toolId: string): boolean {
    const result = this.tools.delete(toolId);
    if (result) {
      console.log(`成功注销工具: ${toolId}`);
    } else {
      console.warn(`无法注销工具 ${toolId}，该工具未注册`);
    }
    return result;
  }

  /**
   * 获取所有工具
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * 获取工具
   */
  getTool(toolId: string): Tool | undefined {
    return this.tools.get(toolId);
  }

  /**
   * 检查工具是否存在
   */
  hasToolId(toolId: string): boolean {
    return this.tools.has(toolId);
  }
}

/**
 * 工具服务
 * 提供工具注册和调用功能
 */
export class ToolService {
  private registry = new ToolRegistry();
  private mastraToolsCache: string[] | null = null;

  constructor() {
    this.registerBuiltinTools();
  }

  /**
   * 注册内置工具
   */
  private registerBuiltinTools(): void {
    // 注册网络搜索工具
    this.registry.register({
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
      ],
      execute: async (params) => {
        const client = await MastraAPI.getClient();
        const searchTool = client.getTool('web-search');
        if (!searchTool) {
          throw new Error('网络搜索工具不可用');
        }
        
        const result = await searchTool.execute({
          data: {
            query: params.query
          }
        });
        
        return result;
      }
    });

    // 注册天气查询工具
    this.registry.register({
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
      ],
      execute: async (params) => {
        const client = await MastraAPI.getClient();
        const weatherTool = client.getTool('weather');
        if (!weatherTool) {
          throw new Error('天气查询工具不可用');
        }
        
        const result = await weatherTool.execute({
          data: {
            location: params.location
          }
        });
        
        return result;
      }
    });

    // 注册计算器工具
    this.registry.register({
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
      ],
      execute: async (params) => {
        try {
          // 使用Function执行计算，注意安全风险
          // 实际生产环境应使用更安全的评估方式
          const safeExpression = params.expression.replace(/[^-()\d/*+.]/g, '');
          // eslint-disable-next-line no-new-func
          const result = new Function(`return ${safeExpression}`)();
          return {
            expression: params.expression,
            result: result
          };
        } catch (error) {
          return {
            expression: params.expression,
            error: '计算表达式无效'
          };
        }
      }
    });

    // 注册图像生成工具
    this.registry.register({
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
        },
        {
          name: 'model',
          type: 'string',
          description: '模型名称',
          required: false,
          defaultValue: 'dall-e-3'
        }
      ],
      execute: async (params) => {
        const client = await MastraAPI.getClient();
        const imageGenTool = client.getTool('image-generation');
        if (!imageGenTool) {
          throw new Error('图像生成工具不可用');
        }
        
        const result = await imageGenTool.execute({
          data: {
            prompt: params.prompt,
            model: params.model || 'dall-e-3'
          }
        });
        
        return result;
      }
    });
  }

  /**
   * 注册工具
   */
  registerTool(tool: Tool): void {
    this.registry.register(tool);
  }

  /**
   * 注销工具
   */
  unregisterTool(toolId: string): boolean {
    return this.registry.unregister(toolId);
  }

  /**
   * 获取所有注册工具
   */
  getAllTools(): Tool[] {
    return this.registry.getAllTools();
  }

  /**
   * 获取工具实例
   */
  getTool(toolId: string): Tool | undefined {
    return this.registry.getTool(toolId);
  }

  /**
   * 调用工具
   */
  async executeTool(toolId: string, params: Record<string, any>): Promise<any> {
    const tool = this.registry.getTool(toolId);
    
    if (!tool) {
      // 尝试使用Mastra工具
      return this.executeMastraTool(toolId, params);
    }
    
    try {
      return await tool.execute(params);
    } catch (error) {
      console.error(`执行工具 ${toolId} 失败:`, error);
      throw new Error(`执行工具 ${tool.name} 失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 调用Mastra工具
   */
  private async executeMastraTool(toolId: string, params: Record<string, any>): Promise<any> {
    try {
      const client = await MastraAPI.getClient();
      const mastraTool = client.getTool(toolId);
      
      if (!mastraTool) {
        throw new Error(`工具 ${toolId} 不存在`);
      }
      
      return await mastraTool.execute({
        data: params
      });
    } catch (error) {
      console.error(`执行Mastra工具 ${toolId} 失败:`, error);
      throw new Error(`执行Mastra工具 ${toolId} 失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取所有可用的Mastra工具
   */
  async getMastraTools(): Promise<string[]> {
    if (this.mastraToolsCache) {
      return this.mastraToolsCache;
    }
    
    try {
      const tools = await MastraAPI.getTools();
      this.mastraToolsCache = tools;
      return tools;
    } catch (error) {
      console.error('获取Mastra工具失败:', error);
      return [];
    }
  }

  /**
   * 刷新Mastra工具缓存
   */
  async refreshMastraTools(): Promise<string[]> {
    this.mastraToolsCache = null;
    return this.getMastraTools();
  }
}

// 创建单例实例
export const toolService = new ToolService();

// 导出实例
export default toolService; 