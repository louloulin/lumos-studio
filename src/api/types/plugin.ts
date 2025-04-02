import { z } from 'zod';

// 插件元数据
export interface PluginMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  author?: string;
  homepage?: string;
  repository?: string;
  license?: string;
  tags?: string[];
  icon?: string;
}

// 插件配置
export interface PluginConfig {
  enabled: boolean;
  settings?: Record<string, any>;
}

// 插件权限
export enum PluginPermission {
  FileSystem = 'filesystem',
  Network = 'network',
  Process = 'process',
  Clipboard = 'clipboard',
}

// 插件清单
export interface PluginManifest extends PluginMetadata {
  main: string;
  permissions?: PluginPermission[];
  dependencies?: Record<string, string>;
  configSchema?: z.ZodSchema;
  minHostVersion?: string;
}

// 插件实例
export interface Plugin extends PluginMetadata {
  enabled?: boolean;
  status?: PluginStatus;
  config?: PluginConfig;
  category?: string;
  error?: string;
}

// 插件状态
export enum PluginStatus {
  Installed = 'installed',
  Active = 'active',
  Inactive = 'inactive',
  Error = 'error',
}

// 插件事件
export enum PluginEvent {
  Install = 'install',
  Uninstall = 'uninstall',
  Enable = 'enable',
  Disable = 'disable',
  ConfigChange = 'configChange',
  Error = 'error',
}

// 插件上下文
export interface PluginContext {
  id: string;
  config: PluginConfig;
  logger: PluginLogger;
  storage: PluginStorage;
  api: PluginAPI;
}

// 插件日志接口
export interface PluginLogger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

// 插件存储接口
export interface PluginStorage {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

// 插件API接口
export interface PluginAPI {
  // 工具调用
  callTool(name: string, params: any): Promise<any>;
  // 发送消息
  sendMessage(message: string, metadata?: any): Promise<void>;
  // 注册命令
  registerCommand(command: string, handler: (args: any) => Promise<any>): void;
  // 注册工具
  registerTool(tool: any): void;
  // 获取当前会话信息
  getSession(): Promise<any>;
  // 获取当前智能体信息
  getAgent(): Promise<any>;
}

// 插件生命周期钩子
export interface PluginLifecycle {
  onInstall?(): Promise<void>;
  onUninstall?(): Promise<void>;
  onEnable?(): Promise<void>;
  onDisable?(): Promise<void>;
  onConfigChange?(config: PluginConfig): Promise<void>;
}

// 插件定义
export interface PluginDefinition extends PluginLifecycle {
  manifest: PluginManifest;
  setup(context: PluginContext): Promise<void>;
}

// 插件管理器接口
export interface PluginManager {
  // 插件操作
  install(id: string): Promise<void>;
  uninstall(id: string): Promise<void>;
  enable(id: string): Promise<void>;
  disable(id: string): Promise<void>;
  
  // 插件查询
  getPlugin(id: string): Plugin | undefined;
  getAllPlugins(): Plugin[];
  getEnabledPlugins(): Plugin[];
  
  // 插件配置
  getConfig(id: string): PluginConfig | undefined;
  updateConfig(id: string, config: Partial<PluginConfig>): Promise<void>;
  
  // 事件监听
  on(event: PluginEvent, handler: (plugin: Plugin) => void): void;
  off(event: PluginEvent, handler: (plugin: Plugin) => void): void;
} 