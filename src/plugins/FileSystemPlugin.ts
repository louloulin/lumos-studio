import { PluginDefinition, PluginContext, PluginPermission } from '../api/types/plugin';

/**
 * 文件系统插件
 * 提供文件读写和管理功能
 */
class FileSystemPlugin {
  private context: PluginContext;

  constructor(context: PluginContext) {
    this.context = context;
  }

  /**
   * 读取文件内容
   * @param path 文件路径
   * @returns 文件内容
   */
  async readFile(path: string): Promise<string> {
    try {
      this.context.logger.info(`正在读取文件: ${path}`);
      const result = await this.context.api.callTool('file-system', {
        operation: 'read',
        path
      });
      return result.content;
    } catch (error) {
      this.context.logger.error(`读取文件失败: ${error}`);
      throw new Error(`读取文件失败: ${error}`);
    }
  }

  /**
   * 写入文件内容
   * @param path 文件路径
   * @param content 文件内容
   */
  async writeFile(path: string, content: string): Promise<void> {
    try {
      this.context.logger.info(`正在写入文件: ${path}`);
      await this.context.api.callTool('file-system', {
        operation: 'write',
        path,
        content
      });
    } catch (error) {
      this.context.logger.error(`写入文件失败: ${error}`);
      throw new Error(`写入文件失败: ${error}`);
    }
  }

  /**
   * 删除文件
   * @param path 文件路径
   */
  async deleteFile(path: string): Promise<void> {
    try {
      this.context.logger.info(`正在删除文件: ${path}`);
      await this.context.api.callTool('file-system', {
        operation: 'delete',
        path
      });
    } catch (error) {
      this.context.logger.error(`删除文件失败: ${error}`);
      throw new Error(`删除文件失败: ${error}`);
    }
  }

  /**
   * 列出目录内容
   * @param path 目录路径
   * @returns 目录内容列表
   */
  async listDirectory(path: string): Promise<string[]> {
    try {
      this.context.logger.info(`正在列出目录内容: ${path}`);
      const result = await this.context.api.callTool('file-system', {
        operation: 'list',
        path
      });
      return result.files;
    } catch (error) {
      this.context.logger.error(`列出目录内容失败: ${error}`);
      throw new Error(`列出目录内容失败: ${error}`);
    }
  }

  /**
   * 创建目录
   * @param path 目录路径
   */
  async createDirectory(path: string): Promise<void> {
    try {
      this.context.logger.info(`正在创建目录: ${path}`);
      await this.context.api.callTool('file-system', {
        operation: 'mkdir',
        path
      });
    } catch (error) {
      this.context.logger.error(`创建目录失败: ${error}`);
      throw new Error(`创建目录失败: ${error}`);
    }
  }
}

// 插件定义
const fileSystemPluginDefinition: PluginDefinition = {
  manifest: {
    id: 'file-system-plugin',
    name: '文件系统插件',
    description: '提供文件读写和管理功能',
    version: '1.0.0',
    author: 'Lumos团队',
    permissions: [PluginPermission.FileSystem],
    category: '核心插件'
  },
  setup: async (context: PluginContext) => {
    const plugin = new FileSystemPlugin(context);
    
    // 注册文件系统命令
    context.api.registerCommand('readFile', async (args: { path: string }) => {
      return await plugin.readFile(args.path);
    });
    
    context.api.registerCommand('writeFile', async (args: { path: string, content: string }) => {
      await plugin.writeFile(args.path, args.content);
      return { success: true };
    });
    
    context.api.registerCommand('deleteFile', async (args: { path: string }) => {
      await plugin.deleteFile(args.path);
      return { success: true };
    });
    
    context.api.registerCommand('listDirectory', async (args: { path: string }) => {
      return await plugin.listDirectory(args.path);
    });
    
    context.api.registerCommand('createDirectory', async (args: { path: string }) => {
      await plugin.createDirectory(args.path);
      return { success: true };
    });
    
    context.logger.info('文件系统插件初始化完成');
  },
  
  onInstall: async () => {
    console.log('文件系统插件安装完成');
  },
  
  onUninstall: async () => {
    console.log('文件系统插件已卸载');
  },
  
  onEnable: async () => {
    console.log('文件系统插件已启用');
  },
  
  onDisable: async () => {
    console.log('文件系统插件已禁用');
  }
};

export default fileSystemPluginDefinition; 