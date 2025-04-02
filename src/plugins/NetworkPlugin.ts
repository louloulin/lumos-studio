import { PluginDefinition, PluginContext, PluginPermission } from '../api/types/plugin';

/**
 * 网络请求插件
 * 提供HTTP请求和WebSocket连接功能
 */
class NetworkPlugin {
  private context: PluginContext;
  private activeWebSockets: Map<string, WebSocket> = new Map();

  constructor(context: PluginContext) {
    this.context = context;
  }

  /**
   * 发送HTTP GET请求
   * @param url 请求URL
   * @param headers 请求头
   * @returns 响应数据
   */
  async httpGet(url: string, headers: Record<string, string> = {}): Promise<any> {
    try {
      this.context.logger.info(`发送GET请求: ${url}`);
      const result = await this.context.api.callTool('network', {
        operation: 'httpGet',
        url,
        headers
      });
      return result;
    } catch (error) {
      this.context.logger.error(`GET请求失败: ${error}`);
      throw new Error(`GET请求失败: ${error}`);
    }
  }

  /**
   * 发送HTTP POST请求
   * @param url 请求URL
   * @param body 请求体
   * @param headers 请求头
   * @returns 响应数据
   */
  async httpPost(url: string, body: any, headers: Record<string, string> = {}): Promise<any> {
    try {
      this.context.logger.info(`发送POST请求: ${url}`);
      const result = await this.context.api.callTool('network', {
        operation: 'httpPost',
        url,
        body,
        headers
      });
      return result;
    } catch (error) {
      this.context.logger.error(`POST请求失败: ${error}`);
      throw new Error(`POST请求失败: ${error}`);
    }
  }

  /**
   * 发送HTTP PUT请求
   * @param url 请求URL
   * @param body 请求体
   * @param headers 请求头
   * @returns 响应数据
   */
  async httpPut(url: string, body: any, headers: Record<string, string> = {}): Promise<any> {
    try {
      this.context.logger.info(`发送PUT请求: ${url}`);
      const result = await this.context.api.callTool('network', {
        operation: 'httpPut',
        url,
        body,
        headers
      });
      return result;
    } catch (error) {
      this.context.logger.error(`PUT请求失败: ${error}`);
      throw new Error(`PUT请求失败: ${error}`);
    }
  }

  /**
   * 发送HTTP DELETE请求
   * @param url 请求URL
   * @param headers 请求头
   * @returns 响应数据
   */
  async httpDelete(url: string, headers: Record<string, string> = {}): Promise<any> {
    try {
      this.context.logger.info(`发送DELETE请求: ${url}`);
      const result = await this.context.api.callTool('network', {
        operation: 'httpDelete',
        url,
        headers
      });
      return result;
    } catch (error) {
      this.context.logger.error(`DELETE请求失败: ${error}`);
      throw new Error(`DELETE请求失败: ${error}`);
    }
  }

  /**
   * 创建WebSocket连接
   * @param url WebSocket URL
   * @param id 连接ID
   * @param onMessage 消息回调
   * @param onClose 关闭回调
   * @param onError 错误回调
   */
  async createWebSocket(
    url: string, 
    id: string,
    onMessage: (data: any) => void,
    onClose?: () => void,
    onError?: (error: any) => void
  ): Promise<void> {
    try {
      this.context.logger.info(`创建WebSocket连接: ${url}, ID: ${id}`);
      
      // 使用WebSocket API创建连接
      const ws = new WebSocket(url);
      
      // 存储WebSocket实例
      this.activeWebSockets.set(id, ws);
      
      // 设置事件处理程序
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          onMessage(event.data);
        }
      };
      
      ws.onclose = () => {
        this.activeWebSockets.delete(id);
        this.context.logger.info(`WebSocket连接关闭: ID ${id}`);
        if (onClose) onClose();
      };
      
      ws.onerror = (error) => {
        this.context.logger.error(`WebSocket错误: ID ${id}, ${error}`);
        if (onError) onError(error);
      };
      
    } catch (error) {
      this.context.logger.error(`创建WebSocket连接失败: ${error}`);
      throw new Error(`创建WebSocket连接失败: ${error}`);
    }
  }

  /**
   * 发送WebSocket消息
   * @param id 连接ID
   * @param data 消息数据
   */
  async sendWebSocketMessage(id: string, data: any): Promise<void> {
    try {
      const ws = this.activeWebSockets.get(id);
      if (!ws) {
        throw new Error(`WebSocket连接不存在: ID ${id}`);
      }
      
      this.context.logger.info(`发送WebSocket消息: ID ${id}`);
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      ws.send(message);
    } catch (error) {
      this.context.logger.error(`发送WebSocket消息失败: ${error}`);
      throw new Error(`发送WebSocket消息失败: ${error}`);
    }
  }

  /**
   * 关闭WebSocket连接
   * @param id 连接ID
   */
  async closeWebSocket(id: string): Promise<void> {
    try {
      const ws = this.activeWebSockets.get(id);
      if (!ws) {
        throw new Error(`WebSocket连接不存在: ID ${id}`);
      }
      
      this.context.logger.info(`关闭WebSocket连接: ID ${id}`);
      ws.close();
      this.activeWebSockets.delete(id);
    } catch (error) {
      this.context.logger.error(`关闭WebSocket连接失败: ${error}`);
      throw new Error(`关闭WebSocket连接失败: ${error}`);
    }
  }

  /**
   * 关闭所有WebSocket连接
   */
  async closeAllWebSockets(): Promise<void> {
    try {
      this.context.logger.info(`关闭所有WebSocket连接`);
      for (const [id, ws] of this.activeWebSockets.entries()) {
        ws.close();
        this.activeWebSockets.delete(id);
      }
    } catch (error) {
      this.context.logger.error(`关闭所有WebSocket连接失败: ${error}`);
      throw new Error(`关闭所有WebSocket连接失败: ${error}`);
    }
  }
}

// 插件定义
const networkPluginDefinition: PluginDefinition = {
  manifest: {
    id: 'network-plugin',
    name: '网络请求插件',
    description: '提供HTTP请求和WebSocket连接功能',
    version: '1.0.0',
    author: 'Lumos团队',
    permissions: [PluginPermission.Network]
  },
  setup: async (context: PluginContext) => {
    const plugin = new NetworkPlugin(context);
    
    // 注册HTTP请求命令
    context.api.registerCommand('httpGet', async (args: { url: string, headers?: Record<string, string> }) => {
      return await plugin.httpGet(args.url, args.headers);
    });
    
    context.api.registerCommand('httpPost', async (args: { url: string, body: any, headers?: Record<string, string> }) => {
      return await plugin.httpPost(args.url, args.body, args.headers);
    });
    
    context.api.registerCommand('httpPut', async (args: { url: string, body: any, headers?: Record<string, string> }) => {
      return await plugin.httpPut(args.url, args.body, args.headers);
    });
    
    context.api.registerCommand('httpDelete', async (args: { url: string, headers?: Record<string, string> }) => {
      return await plugin.httpDelete(args.url, args.headers);
    });
    
    // 注册WebSocket命令
    context.api.registerCommand('createWebSocket', async (args: { 
      url: string, 
      id: string,
      onMessage: (data: any) => void,
      onClose?: () => void,
      onError?: (error: any) => void
    }) => {
      await plugin.createWebSocket(args.url, args.id, args.onMessage, args.onClose, args.onError);
      return { success: true };
    });
    
    context.api.registerCommand('sendWebSocketMessage', async (args: { id: string, data: any }) => {
      await plugin.sendWebSocketMessage(args.id, args.data);
      return { success: true };
    });
    
    context.api.registerCommand('closeWebSocket', async (args: { id: string }) => {
      await plugin.closeWebSocket(args.id);
      return { success: true };
    });
    
    context.api.registerCommand('closeAllWebSockets', async () => {
      await plugin.closeAllWebSockets();
      return { success: true };
    });
    
    context.logger.info('网络请求插件初始化完成');
  },
  
  onInstall: async () => {
    console.log('网络请求插件安装完成');
  },
  
  onUninstall: async () => {
    console.log('网络请求插件已卸载');
    // 确保卸载时关闭所有WebSocket连接
    const plugin = new NetworkPlugin({} as PluginContext);
    await plugin.closeAllWebSockets();
  },
  
  onEnable: async () => {
    console.log('网络请求插件已启用');
  },
  
  onDisable: async () => {
    console.log('网络请求插件已禁用');
    // 确保禁用时关闭所有WebSocket连接
    const plugin = new NetworkPlugin({} as PluginContext);
    await plugin.closeAllWebSockets();
  }
};

export default networkPluginDefinition; 