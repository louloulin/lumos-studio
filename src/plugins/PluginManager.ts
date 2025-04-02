import { 
  Plugin, 
  PluginDefinition, 
  PluginStatus, 
  PluginContext, 
  PluginManifest,
  PluginEvent,
  PluginManager as IPluginManager
} from '../api/types/plugin';

/**
 * 插件管理器
 * 负责插件的加载、卸载、启用和禁用等操作
 */
export class PluginManager implements IPluginManager {
  private plugins: Map<string, Plugin>;
  private pluginStorage: Storage;
  private eventListeners: Map<PluginEvent, Set<(pluginId: string) => void>>;

  constructor() {
    this.plugins = new Map();
    this.pluginStorage = localStorage;
    this.eventListeners = new Map();
    
    // 初始化事件类型
    Object.values(PluginEvent).forEach(event => {
      this.eventListeners.set(event, new Set());
    });
  }

  /**
   * 初始化插件管理器
   */
  async initialize(): Promise<void> {
    try {
      // 尝试恢复已安装的插件
      const storedPluginsJSON = this.pluginStorage.getItem('installedPlugins');
      if (storedPluginsJSON) {
        const storedPlugins = JSON.parse(storedPluginsJSON) as Plugin[];
        
        // 重新加载已安装的插件
        for (const storedPlugin of storedPlugins) {
          // 查找当前可用的插件
          const definition = await this.findPluginDefinition(storedPlugin.manifest.id);
          if (definition) {
            // 重新加载插件，但保持其状态
            await this.registerPlugin(definition, storedPlugin.status);
          }
        }
      }
      
      console.log('插件管理器初始化完成');
    } catch (error) {
      console.error('插件管理器初始化失败:', error);
    }
  }

  /**
   * 查找插件定义
   * @param pluginId 插件ID
   * @returns 插件定义
   */
  private async findPluginDefinition(pluginId: string): Promise<PluginDefinition | null> {
    // 这里应该从插件仓库或文件系统加载插件定义
    // 此处为示例实现
    return null;
  }

  /**
   * 获取所有插件
   * @returns 插件列表
   */
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 获取指定插件
   * @param pluginId 插件ID
   * @returns 插件对象
   */
  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * 注册插件
   * @param definition 插件定义
   * @param initialStatus 初始状态
   * @returns 插件对象
   */
  private async registerPlugin(
    definition: PluginDefinition, 
    initialStatus: PluginStatus = PluginStatus.Installed
  ): Promise<Plugin> {
    const { manifest } = definition;
    
    // 检查插件是否已注册
    if (this.plugins.has(manifest.id)) {
      throw new Error(`插件 ${manifest.id} 已经注册`);
    }
    
    // 创建插件对象
    const plugin: Plugin = {
      manifest,
      status: initialStatus,
      config: { enabled: false },
      definition
    };
    
    // 存储插件
    this.plugins.set(manifest.id, plugin);
    
    // 保存插件状态到存储
    this.savePluginsToStorage();
    
    return plugin;
  }

  /**
   * 安装插件
   * @param definition 插件定义
   * @returns 插件对象
   */
  async installPlugin(definition: PluginDefinition): Promise<Plugin> {
    try {
      // 注册插件
      const plugin = await this.registerPlugin(definition);
      
      // 执行插件安装回调
      if (definition.onInstall) {
        await definition.onInstall();
      }
      
      // 触发安装事件
      this.emitEvent(PluginEvent.Install, plugin.manifest.id);
      
      console.log(`插件 ${plugin.manifest.id} 安装成功`);
      return plugin;
    } catch (error) {
      console.error(`插件 ${definition.manifest.id} 安装失败:`, error);
      throw error;
    }
  }

  /**
   * 卸载插件
   * @param pluginId 插件ID
   * @returns 是否卸载成功
   */
  async uninstallPlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`插件 ${pluginId} 不存在`);
    }
    
    try {
      // 如果插件是启用状态，先禁用它
      if (plugin.status === PluginStatus.Active) {
        await this.disablePlugin(pluginId);
      }
      
      // 执行插件卸载回调
      if (plugin.definition.onUninstall) {
        await plugin.definition.onUninstall();
      }
      
      // 从管理器中移除插件
      this.plugins.delete(pluginId);
      
      // 保存插件状态到存储
      this.savePluginsToStorage();
      
      // 触发卸载事件
      this.emitEvent(PluginEvent.Uninstall, pluginId);
      
      console.log(`插件 ${pluginId} 卸载成功`);
      return true;
    } catch (error) {
      console.error(`插件 ${pluginId} 卸载失败:`, error);
      throw error;
    }
  }

  /**
   * 启用插件
   * @param pluginId 插件ID
   * @returns 是否启用成功
   */
  async enablePlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`插件 ${pluginId} 不存在`);
    }
    
    // 如果插件已经是激活状态，直接返回
    if (plugin.status === PluginStatus.Active) {
      return true;
    }
    
    try {
      // 创建插件上下文
      const context = await this.createPluginContext(plugin.manifest);
      
      // 执行插件设置
      if (plugin.definition.setup) {
        await plugin.definition.setup(context);
      }
      
      // 执行插件启用回调
      if (plugin.definition.onEnable) {
        await plugin.definition.onEnable();
      }
      
      // 更新插件状态
      plugin.status = PluginStatus.Active;
      plugin.config.enabled = true;
      
      // 保存插件状态到存储
      this.savePluginsToStorage();
      
      // 触发启用事件
      this.emitEvent(PluginEvent.Enable, pluginId);
      
      console.log(`插件 ${pluginId} 启用成功`);
      return true;
    } catch (error) {
      plugin.status = PluginStatus.Error;
      console.error(`插件 ${pluginId} 启用失败:`, error);
      throw error;
    }
  }

  /**
   * 禁用插件
   * @param pluginId 插件ID
   * @returns 是否禁用成功
   */
  async disablePlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`插件 ${pluginId} 不存在`);
    }
    
    // 如果插件已经是非激活状态，直接返回
    if (plugin.status !== PluginStatus.Active) {
      return true;
    }
    
    try {
      // 执行插件禁用回调
      if (plugin.definition.onDisable) {
        await plugin.definition.onDisable();
      }
      
      // 更新插件状态
      plugin.status = PluginStatus.Inactive;
      plugin.config.enabled = false;
      
      // 保存插件状态到存储
      this.savePluginsToStorage();
      
      // 触发禁用事件
      this.emitEvent(PluginEvent.Disable, pluginId);
      
      console.log(`插件 ${pluginId} 禁用成功`);
      return true;
    } catch (error) {
      console.error(`插件 ${pluginId} 禁用失败:`, error);
      throw error;
    }
  }

  /**
   * 保存插件到存储
   */
  private savePluginsToStorage(): void {
    try {
      const pluginsToSave = Array.from(this.plugins.values());
      this.pluginStorage.setItem('installedPlugins', JSON.stringify(pluginsToSave));
    } catch (error) {
      console.error('保存插件状态失败:', error);
    }
  }

  /**
   * 创建插件上下文
   * @param manifest 插件清单
   * @returns 插件上下文
   */
  private async createPluginContext(manifest: PluginManifest): Promise<PluginContext> {
    // 创建日志记录器
    const logger = {
      debug: (message: string) => console.debug(`[插件:${manifest.id}] ${message}`),
      info: (message: string) => console.info(`[插件:${manifest.id}] ${message}`),
      warn: (message: string) => console.warn(`[插件:${manifest.id}] ${message}`),
      error: (message: string) => console.error(`[插件:${manifest.id}] ${message}`)
    };
    
    // 创建插件存储
    const storage = {
      getItem: (key: string): string | null => {
        const fullKey = `plugin:${manifest.id}:${key}`;
        return this.pluginStorage.getItem(fullKey);
      },
      setItem: (key: string, value: string): void => {
        const fullKey = `plugin:${manifest.id}:${key}`;
        this.pluginStorage.setItem(fullKey, value);
      },
      removeItem: (key: string): void => {
        const fullKey = `plugin:${manifest.id}:${key}`;
        this.pluginStorage.removeItem(fullKey);
      },
      clear: (): void => {
        // 只清除该插件的存储项
        const keys = [];
        for (let i = 0; i < this.pluginStorage.length; i++) {
          const key = this.pluginStorage.key(i);
          if (key && key.startsWith(`plugin:${manifest.id}:`)) {
            keys.push(key);
          }
        }
        keys.forEach(key => this.pluginStorage.removeItem(key));
      }
    };
    
    // 创建插件API
    const api = {
      // 注册工具方法
      registerTool: (tool: any) => {
        // 这里应该与智能体工具系统集成
        console.log(`[插件:${manifest.id}] 注册工具: ${tool.name}`);
      },
      
      // 获取应用状态
      getAppState: () => {
        // 返回应用状态的有限视图
        return {
          version: '1.0.0'
        };
      },
      
      // 其他API方法...
    };
    
    return {
      manifest,
      logger,
      storage,
      api,
      config: { enabled: true }
    };
  }

  /**
   * 监听插件事件
   * @param event 事件类型
   * @param callback 回调函数
   */
  addEventListener(event: PluginEvent, callback: (pluginId: string) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.add(callback);
    }
  }

  /**
   * 移除事件监听器
   * @param event 事件类型
   * @param callback 回调函数
   */
  removeEventListener(event: PluginEvent, callback: (pluginId: string) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * 触发事件
   * @param event 事件类型
   * @param pluginId 插件ID
   */
  private emitEvent(event: PluginEvent, pluginId: string): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(pluginId);
        } catch (error) {
          console.error(`事件监听器执行错误:`, error);
        }
      });
    }
  }
}

// 创建全局插件管理器实例
export const pluginManager = new PluginManager();

export default pluginManager; 