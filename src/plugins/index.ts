import { pluginManager } from './PluginManager';
import fileSystemPluginDefinition from './FileSystemPlugin';
import networkPluginDefinition from './NetworkPlugin';
import databasePluginDefinition from './DatabasePlugin';
import toolPluginDefinition from './ToolPlugin';

/**
 * 注册所有核心插件
 */
export async function registerCorePlugins() {
  try {
    console.log('开始注册核心插件...');
    
    // 注册文件系统插件
    await pluginManager.installPlugin(fileSystemPluginDefinition);
    
    // 注册网络请求插件
    await pluginManager.installPlugin(networkPluginDefinition);
    
    // 注册数据库插件
    await pluginManager.installPlugin(databasePluginDefinition);
    
    // 注册工具插件
    await pluginManager.installPlugin(toolPluginDefinition);
    
    console.log('所有核心插件注册完成');
  } catch (error) {
    console.error('注册核心插件失败:', error);
  }
}

// 导出所有插件定义
export {
  fileSystemPluginDefinition,
  networkPluginDefinition,
  databasePluginDefinition,
  toolPluginDefinition
};

// 导出插件管理器
export { pluginManager }; 