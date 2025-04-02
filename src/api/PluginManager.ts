import { EventEmitter } from 'events';
import { 
  Plugin, PluginConfig, PluginDefinition, PluginEvent, 
  PluginStatus, PluginContext, PluginLogger, PluginStorage, PluginAPI 
} from './types/plugin';
import { MastraAPI } from './mastra';

// 插件日志实现
class DefaultPluginLogger implements PluginLogger {
  constructor(private pluginId: string) {}

  private formatMessage(message: string): string {
    return `[Plugin: ${this.pluginId}] ${message}`;
  }

  debug(message: string, ...args: any[]): void {
    console.debug(this.formatMessage(message), ...args);
  }

  info(message: string, ...args: any[]): void {
    console.info(this.formatMessage(message), ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(this.formatMessage(message), ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(this.formatMessage(message), ...args);
  }
}

// 插件存储实现
class DefaultPluginStorage implements PluginStorage {
  constructor(private pluginId: string) {}

  private getKey(key: string): string {
    return `plugin:${this.pluginId}:${key}`;
  }

  async get(key: string): Promise<any> {
    const value = localStorage.getItem(this.getKey(key));
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any): Promise<void> {
    localStorage.setItem(this.getKey(key), JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(this.getKey(key));
  }

  async clear(): Promise<void> {
    const prefix = `plugin:${this.pluginId}:`;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        localStorage.removeItem(key);
      }
    }
  }
}

// 插件API实现
class DefaultPluginAPI implements PluginAPI {
  constructor(
    private pluginId: string,
    private mastraApi: typeof MastraAPI
  ) {}

  async callTool(name: string, params: any): Promise<any> {
    const client = await this.mastraApi.getClient();
    const tool = client.getTool(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }
    return await tool.execute(params);
  }

  async sendMessage(message: string, metadata?: any): Promise<void> {
    // TODO: 实现消息发送
  }

  registerCommand(command: string, handler: (args: any) => Promise<any>): void {
    // TODO: 实现命令注册
  }

  registerTool(tool: any): void {
    // TODO: 实现工具注册
  }

  async getSession(): Promise<any> {
    // TODO: 实现获取会话信息
    return {};
  }

  async getAgent(): Promise<any> {
    // TODO: 实现获取智能体信息
    return {};
  }
}

export class PluginManagerImpl extends EventEmitter {
  private plugins: Map<string, Plugin> = new Map();
  private definitions: Map<string, PluginDefinition> = new Map();
  private mastraApi: typeof MastraAPI;

  constructor() {
    super();
    this.mastraApi = MastraAPI;
  }

  // 创建插件上下文
  private createPluginContext(id: string, config: PluginConfig): PluginContext {
    return {
      id,
      config,
      logger: new DefaultPluginLogger(id),
      storage: new DefaultPluginStorage(id),
      api: new DefaultPluginAPI(id, this.mastraApi),
    };
  }

  // 安装插件
  async install(id: string): Promise<void> {
    try {
      // 检查插件是否已安装
      if (this.plugins.has(id)) {
        throw new Error(`Plugin ${id} is already installed`);
      }

      // 获取插件定义
      const definition = this.definitions.get(id);
      if (!definition) {
        throw new Error(`Plugin ${id} not found`);
      }

      // 创建插件实例
      const plugin: Plugin = {
        ...definition.manifest,
        enabled: false,
        status: PluginStatus.Installed,
        config: {
          enabled: false,
        },
      };

      // 创建插件上下文
      const context = this.createPluginContext(id, plugin.config!);

      // 调用插件安装钩子
      if (definition.onInstall) {
        await definition.onInstall();
      }

      // 调用插件设置函数
      await definition.setup(context);

      // 保存插件实例
      this.plugins.set(id, plugin);

      // 触发安装事件
      this.emit(PluginEvent.Install, plugin);
    } catch (error) {
      console.error(`Failed to install plugin ${id}:`, error);
      throw error;
    }
  }

  // 卸载插件
  async uninstall(id: string): Promise<void> {
    try {
      // 获取插件实例
      const plugin = this.plugins.get(id);
      if (!plugin) {
        throw new Error(`Plugin ${id} is not installed`);
      }

      // 获取插件定义
      const definition = this.definitions.get(id);
      if (!definition) {
        throw new Error(`Plugin ${id} definition not found`);
      }

      // 如果插件已启用，先禁用它
      if (plugin.enabled) {
        await this.disable(id);
      }

      // 调用插件卸载钩子
      if (definition.onUninstall) {
        await definition.onUninstall();
      }

      // 清理插件存储
      const storage = new DefaultPluginStorage(id);
      await storage.clear();

      // 移除插件实例
      this.plugins.delete(id);

      // 触发卸载事件
      this.emit(PluginEvent.Uninstall, plugin);
    } catch (error) {
      console.error(`Failed to uninstall plugin ${id}:`, error);
      throw error;
    }
  }

  // 启用插件
  async enable(id: string): Promise<void> {
    try {
      // 获取插件实例
      const plugin = this.plugins.get(id);
      if (!plugin) {
        throw new Error(`Plugin ${id} is not installed`);
      }

      // 获取插件定义
      const definition = this.definitions.get(id);
      if (!definition) {
        throw new Error(`Plugin ${id} definition not found`);
      }

      // 调用插件启用钩子
      if (definition.onEnable) {
        await definition.onEnable();
      }

      // 更新插件状态
      plugin.enabled = true;
      plugin.status = PluginStatus.Active;
      plugin.config!.enabled = true;

      // 触发启用事件
      this.emit(PluginEvent.Enable, plugin);
    } catch (error) {
      console.error(`Failed to enable plugin ${id}:`, error);
      throw error;
    }
  }

  // 禁用插件
  async disable(id: string): Promise<void> {
    try {
      // 获取插件实例
      const plugin = this.plugins.get(id);
      if (!plugin) {
        throw new Error(`Plugin ${id} is not installed`);
      }

      // 获取插件定义
      const definition = this.definitions.get(id);
      if (!definition) {
        throw new Error(`Plugin ${id} definition not found`);
      }

      // 调用插件禁用钩子
      if (definition.onDisable) {
        await definition.onDisable();
      }

      // 更新插件状态
      plugin.enabled = false;
      plugin.status = PluginStatus.Inactive;
      plugin.config!.enabled = false;

      // 触发禁用事件
      this.emit(PluginEvent.Disable, plugin);
    } catch (error) {
      console.error(`Failed to disable plugin ${id}:`, error);
      throw error;
    }
  }

  // 获取插件实例
  getPlugin(id: string): Plugin | undefined {
    return this.plugins.get(id);
  }

  // 获取所有插件
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  // 获取已启用的插件
  getEnabledPlugins(): Plugin[] {
    return Array.from(this.plugins.values()).filter(plugin => plugin.enabled);
  }

  // 获取插件配置
  getConfig(id: string): PluginConfig | undefined {
    return this.plugins.get(id)?.config;
  }

  // 更新插件配置
  async updateConfig(id: string, config: Partial<PluginConfig>): Promise<void> {
    try {
      // 获取插件实例
      const plugin = this.plugins.get(id);
      if (!plugin) {
        throw new Error(`Plugin ${id} is not installed`);
      }

      // 获取插件定义
      const definition = this.definitions.get(id);
      if (!definition) {
        throw new Error(`Plugin ${id} definition not found`);
      }

      // 更新配置
      plugin.config = {
        ...plugin.config!,
        ...config,
      };

      // 调用配置更改钩子
      if (definition.onConfigChange) {
        await definition.onConfigChange(plugin.config);
      }

      // 触发配置更改事件
      this.emit(PluginEvent.ConfigChange, plugin);
    } catch (error) {
      console.error(`Failed to update plugin ${id} config:`, error);
      throw error;
    }
  }

  // 注册插件定义
  registerPluginDefinition(definition: PluginDefinition): void {
    this.definitions.set(definition.manifest.id, definition);
  }
}

// 导出插件管理器单例
export const pluginManager = new PluginManagerImpl(); 