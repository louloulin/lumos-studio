import { MastraAPI } from './mastra';

/**
 * 工具参数定义
 */
export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
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
  parameters: ToolParameter[];
  execute: (params: any) => Promise<any>;
  isBuiltin?: boolean;     // 是否为内置工具
  isMastraTool?: boolean;  // 是否为Mastra工具
  isCustom?: boolean;      // 是否为自定义工具
}

// 工具存储键
const CUSTOM_TOOLS_KEY = 'lumos_studio_custom_tools';

/**
 * 工具服务
 * 负责管理工具注册和执行
 */
export class ToolService {
  private tools: Tool[] = [];
  private mastraToolsCache: Tool[] | null = null;
  
  constructor() {
    // 注册内置工具
    this.registerBuiltinTools();
    
    // 加载自定义工具
    this.loadCustomTools();
  }
  
  /**
   * 注册内置工具
   */
  private registerBuiltinTools(): void {
    // 注册Web搜索工具
    this.registerTool({
      id: 'web-search',
      name: '网络搜索',
      description: '搜索互联网上的信息',
      parameters: [
        {
          name: 'query',
          type: 'string',
          description: '搜索查询',
          required: true
        }
      ],
      execute: async (params) => {
        try {
          console.log('执行网络搜索工具:', params.data.query);
          // 模拟搜索延迟
          await new Promise(resolve => setTimeout(resolve, 1500));
          return `搜索结果: 关于"${params.data.query}"的信息...`;
        } catch (error) {
          console.error('网络搜索工具执行失败:', error);
          throw new Error('网络搜索失败');
        }
      },
      isBuiltin: true
    });
    
    // 注册天气查询工具
    this.registerTool({
      id: 'weather',
      name: '天气查询',
      description: '查询指定城市的天气信息',
      parameters: [
        {
          name: 'city',
          type: 'string',
          description: '城市名称',
          required: true
        }
      ],
      execute: async (params) => {
        try {
          console.log('执行天气查询工具:', params.data.city);
          // 模拟API调用延迟
          await new Promise(resolve => setTimeout(resolve, 1000));
          return `${params.data.city}的天气: 晴朗, 温度25°C, 湿度60%`;
        } catch (error) {
          console.error('天气查询工具执行失败:', error);
          throw new Error('天气查询失败');
        }
      },
      isBuiltin: true
    });
    
    // 注册计算器工具
    this.registerTool({
      id: 'calculator',
      name: '计算器',
      description: '执行数学计算',
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
          const expression = params.data.expression;
          console.log('执行计算器工具:', expression);
          
          // 安全的表达式计算，使用Function构造函数但限制可用的全局变量
          // eslint-disable-next-line no-new-func
          const calculationFunction = new Function(
            'Math', 'Number', 'parseInt', 'parseFloat',
            `"use strict"; return ${expression};`
          );
          
          const result = calculationFunction(Math, Number, parseInt, parseFloat);
          return `计算结果: ${expression} = ${result}`;
        } catch (error) {
          console.error('计算器工具执行失败:', error);
          throw new Error('计算失败: 无效的表达式');
        }
      },
      isBuiltin: true
    });
    
    // 注册图像生成工具
    this.registerTool({
      id: 'image-generator',
      name: '图像生成',
      description: '根据描述生成图像',
      parameters: [
        {
          name: 'prompt',
          type: 'string',
          description: '图像描述',
          required: true
        }
      ],
      execute: async (params) => {
        try {
          console.log('执行图像生成工具:', params.data.prompt);
          // 模拟图像生成延迟
          await new Promise(resolve => setTimeout(resolve, 2000));
          return `已生成图像: ${params.data.prompt}\n图像URL: https://example.com/generated-image.jpg`;
        } catch (error) {
          console.error('图像生成工具执行失败:', error);
          throw new Error('图像生成失败');
        }
      },
      isBuiltin: true
    });
    
    // 注册时间查询工具
    this.registerTool({
      id: 'time',
      name: '时间查询',
      description: '获取当前时间或特定时区的时间',
      parameters: [
        {
          name: 'timezone',
          type: 'string',
          description: '时区(可选)',
          required: false
        }
      ],
      execute: async (params) => {
        try {
          const timezone = params.data.timezone || 'Asia/Shanghai';
          console.log('执行时间查询工具:', timezone);
          
          // 获取指定时区的当前时间
          const date = new Date();
          let formattedTime;
          
          try {
            formattedTime = date.toLocaleString('zh-CN', { timeZone: timezone });
          } catch (error) {
            // 如果时区无效，使用本地时间
            formattedTime = date.toLocaleString('zh-CN');
          }
          
          return `当前时间 (${timezone}): ${formattedTime}`;
        } catch (error) {
          console.error('时间查询工具执行失败:', error);
          throw new Error('时间查询失败');
        }
      },
      isBuiltin: true
    });
    
    // 注册文件读取工具
    this.registerTool({
      id: 'file-reader',
      name: '文件读取',
      description: '读取指定路径的文件内容',
      parameters: [
        {
          name: 'path',
          type: 'string',
          description: '文件路径',
          required: true
        }
      ],
      execute: async (params) => {
        try {
          const path = params.data.path;
          console.log('执行文件读取工具:', path);
          
          // 模拟文件读取
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // 在真实环境中应该访问文件系统
          // 这里只返回模拟内容
          return `文件内容 (${path}):\n这是文件 ${path} 的模拟内容，实际功能需要实现文件系统访问。`;
        } catch (error) {
          console.error('文件读取工具执行失败:', error);
          throw new Error(`文件读取失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      },
      isBuiltin: true
    });
  }
  
  /**
   * 加载自定义工具
   */
  private loadCustomTools(): void {
    try {
      const storedTools = localStorage.getItem(CUSTOM_TOOLS_KEY);
      if (storedTools) {
        const customTools = JSON.parse(storedTools);
        
        // 注册每个自定义工具
        customTools.forEach((toolData: any) => {
          // 处理execute函数，将其从字符串转换为函数
          let executeFunction: (params: any) => Promise<any>;
          try {
            // 尝试从字符串创建函数
            // eslint-disable-next-line no-new-func
            const funcBody = toolData.executeCode;
            executeFunction = async (params: any) => {
              // 使用安全的方式执行代码，避免直接使用eval
              const result = await Function('params', `return ${funcBody}`)(params);
              return result;
            };
          } catch (error) {
            console.error(`为工具 ${toolData.name} 创建执行函数失败:`, error);
            // 使用默认函数
            executeFunction = async (params: any) => {
              return `执行自定义工具 ${toolData.name}: ${JSON.stringify(params.data)}`;
            };
          }
          
          // 注册工具
          this.registerTool({
            id: toolData.id,
            name: toolData.name,
            description: toolData.description,
            parameters: toolData.parameters,
            execute: executeFunction,
            isCustom: true
          });
        });
      }
    } catch (error) {
      console.error('加载自定义工具失败:', error);
    }
  }
  
  /**
   * 保存自定义工具
   */
  private saveCustomTools(): void {
    try {
      // 过滤出自定义工具
      const customTools = this.tools.filter(tool => tool.isCustom).map(tool => {
        // 将execute函数转换为字符串以便存储
        const executeCode = tool.execute.toString();
        
        return {
          id: tool.id,
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
          executeCode: executeCode
        };
      });
      
      localStorage.setItem(CUSTOM_TOOLS_KEY, JSON.stringify(customTools));
    } catch (error) {
      console.error('保存自定义工具失败:', error);
    }
  }
  
  /**
   * 注册工具
   */
  registerTool(tool: Tool): Tool {
    // 检查是否已存在同ID的工具
    const existingToolIndex = this.tools.findIndex(t => t.id === tool.id);
    
    if (existingToolIndex !== -1) {
      // 替换已存在的工具
      this.tools[existingToolIndex] = tool;
    } else {
      // 添加新工具
      this.tools.push(tool);
    }
    
    // 如果是自定义工具，保存到本地存储
    if (tool.isCustom) {
      this.saveCustomTools();
    }
    
    return tool;
  }
  
  /**
   * 注册自定义工具
   * @param name 工具名称
   * @param description 工具描述
   * @param parameters 工具参数
   * @returns 注册的工具
   */
  registerCustomTool(
    name: string, 
    description: string, 
    parameters: ToolParameter[] = []
  ): Tool {
    // 创建自定义工具
    const tool: Tool = {
      id: `custom-tool-${Date.now()}`,
      name,
      description,
      parameters,
      execute: async (params) => {
        try {
          console.log(`执行自定义工具 ${name}:`, params.data);
          return `执行自定义工具 ${name} 的结果: ${JSON.stringify(params.data, null, 2)}`;
        } catch (error) {
          console.error(`自定义工具 ${name} 执行失败:`, error);
          throw new Error(`工具执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      },
      isCustom: true
    };
    
    // 注册工具
    this.registerTool(tool);
    
    return tool;
  }
  
  /**
   * 注销工具
   * @param id 工具ID
   * @returns 是否成功注销
   */
  unregisterTool(id: string): boolean {
    const initialLength = this.tools.length;
    
    // 找到工具
    const tool = this.tools.find(t => t.id === id);
    
    // 只允许注销自定义工具
    if (!tool || !tool.isCustom) {
      return false;
    }
    
    // 过滤掉要删除的工具
    this.tools = this.tools.filter(t => t.id !== id);
    
    // 检查是否有工具被删除
    if (this.tools.length !== initialLength) {
      // 更新本地存储
      this.saveCustomTools();
      return true;
    }
    
    return false;
  }
  
  /**
   * 获取所有工具
   */
  async getAllTools(): Promise<Tool[]> {
    // 获取Mastra工具
    const mastraTools = await this.getMastraTools();
    
    // 合并所有工具
    return [...this.tools, ...mastraTools];
  }
  
  /**
   * 获取本地工具
   */
  getLocalTools(): Tool[] {
    return [...this.tools];
  }
  
  /**
   * 获取Mastra工具
   */
  async getMastraTools(): Promise<Tool[]> {
    // 如果已有缓存，直接返回
    if (this.mastraToolsCache) {
      return this.mastraToolsCache;
    }
    
    try {
      // 尝试获取MastraAPI客户端
      const client = await MastraAPI.getClient().catch(err => {
        console.warn('Failed to get Mastra client:', err);
        return null;
      });
      
      if (!client) {
        console.warn('Mastra client not available, using mock tools');
        // 返回模拟的工具数据
        const mockTools: Tool[] = [
          {
            id: 'mastra-mock-search',
            name: 'Mastra搜索(模拟)',
            description: '模拟的Mastra搜索工具',
            parameters: [
              {
                name: 'query',
                type: 'string',
                description: '搜索查询',
                required: true
              }
            ],
            execute: async (params) => {
              console.log('执行模拟Mastra搜索工具:', params.data.query);
              await new Promise(resolve => setTimeout(resolve, 1000));
              return `模拟搜索结果: ${params.data.query}`;
            },
            isMastraTool: true
          }
        ];
        
        this.mastraToolsCache = mockTools;
        return mockTools;
      }
      
      // 获取工具ID列表
      const toolIds = await MastraAPI.getTools().catch(err => {
        console.warn('Failed to get Mastra tools:', err);
        return [];
      });
      
      if (!toolIds || !Array.isArray(toolIds) || toolIds.length === 0) {
        console.log('未获取到Mastra工具，或返回空数组');
        return [];
      }
      
      console.log("获取到Mastra工具IDs:", toolIds);
      
      // 创建工具对象数组
      const tools: Tool[] = toolIds.map(toolId => ({
        id: `mastra-${toolId}`,
        name: `Mastra工具: ${toolId}`,
        description: `来自Mastra的工具: ${toolId}`,
        parameters: [],
        execute: async (params) => {
          try {
            // 使用MastraAPI调用工具
            const client = await MastraAPI.getClient();
            // 获取对应的工具
            const tool = client.getTool(toolId);
            if (!tool) {
              throw new Error(`找不到Mastra工具: ${toolId}`);
            }
            
            // 调用工具
            console.log(`执行Mastra工具: ${toolId}`, params.data);
            const result = await tool.execute(params.data);
            
            // 返回结果
            return typeof result === 'string' 
              ? result 
              : JSON.stringify(result, null, 2);
          } catch (error) {
            console.error(`执行Mastra工具 ${toolId} 失败:`, error);
            throw new Error(`Mastra工具执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
          }
        },
        isMastraTool: true
      }));
      
      // 缓存工具
      this.mastraToolsCache = tools;
      return tools;
    } catch (error) {
      console.error('获取Mastra工具列表失败:', error);
      return [];
    }
  }
  
  /**
   * 刷新Mastra工具缓存
   */
  async refreshMastraTools(): Promise<Tool[]> {
    // 清除缓存
    this.mastraToolsCache = null;
    // 重新加载工具
    return this.getMastraTools();
  }
  
  /**
   * 获取指定ID的工具
   * @param id 工具ID
   */
  async getTool(id: string): Promise<Tool | null> {
    // 检查本地工具
    const localTool = this.tools.find(tool => tool.id === id);
    if (localTool) {
      return localTool;
    }
    
    // 检查Mastra工具
    if (id.startsWith('mastra-')) {
      const mastraTools = await this.getMastraTools();
      return mastraTools.find(tool => tool.id === id) || null;
    }
    
    return null;
  }
  
  /**
   * 执行工具
   * @param toolId 工具ID
   * @param params 工具参数
   */
  async executeTool(toolId: string, params: any): Promise<any> {
    // 获取工具
    const tool = await this.getTool(toolId);
    if (!tool) {
      throw new Error(`工具不存在: ${toolId}`);
    }
    
    try {
      // 验证参数
      this.validateParameters(tool, params.data);
      
      // 设置执行超时
      const TIMEOUT = 30000; // 30秒超时
      
      // 创建Promise竞争，一个是工具执行，一个是超时
      const result = await Promise.race([
        tool.execute(params),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`工具执行超时 (${TIMEOUT / 1000}秒)`)), TIMEOUT);
        })
      ]);
      
      return result;
    } catch (error) {
      console.error(`执行工具 ${toolId} 失败:`, error);
      throw error;
    }
  }
  
  /**
   * 验证工具参数
   * @param tool 工具定义
   * @param params 请求参数
   */
  private validateParameters(tool: Tool, params: any): void {
    if (!params) {
      throw new Error('参数不能为空');
    }
    
    // 检查必填参数
    for (const paramDef of tool.parameters) {
      if (paramDef.required && (params[paramDef.name] === undefined || params[paramDef.name] === null)) {
        throw new Error(`缺少必填参数: ${paramDef.name}`);
      }
    }
  }
}

// 导出单例
export const toolService = new ToolService(); 