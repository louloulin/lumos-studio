import { PluginDefinition, PluginContext, PluginPermission } from '../api/types/plugin';

/**
 * 数据库插件
 * 提供简单的数据存储和查询功能
 */
class DatabasePlugin {
  private context: PluginContext;
  private collections: Map<string, any[]> = new Map();

  constructor(context: PluginContext) {
    this.context = context;
    this.initializeCollections();
  }

  /**
   * 初始化数据集合
   */
  private async initializeCollections(): Promise<void> {
    try {
      // 尝试从插件存储中恢复数据
      const savedData = await this.context.storage.get('collections');
      if (savedData) {
        const collections = JSON.parse(savedData);
        for (const [name, data] of Object.entries(collections)) {
          this.collections.set(name, data as any[]);
        }
        this.context.logger.info('已从存储中恢复数据集合');
      }
    } catch (error) {
      this.context.logger.error(`初始化数据集合失败: ${error}`);
    }
  }

  /**
   * 保存数据集合到存储
   */
  private async saveCollections(): Promise<void> {
    try {
      const collections: Record<string, any[]> = {};
      for (const [name, data] of this.collections.entries()) {
        collections[name] = data;
      }
      await this.context.storage.set('collections', JSON.stringify(collections));
      this.context.logger.info('数据集合已保存到存储');
    } catch (error) {
      this.context.logger.error(`保存数据集合失败: ${error}`);
    }
  }

  /**
   * 创建集合
   * @param name 集合名称
   */
  async createCollection(name: string): Promise<void> {
    if (this.collections.has(name)) {
      throw new Error(`集合 "${name}" 已存在`);
    }
    
    this.collections.set(name, []);
    await this.saveCollections();
    this.context.logger.info(`创建集合: ${name}`);
  }

  /**
   * 删除集合
   * @param name 集合名称
   */
  async deleteCollection(name: string): Promise<void> {
    if (!this.collections.has(name)) {
      throw new Error(`集合 "${name}" 不存在`);
    }
    
    this.collections.delete(name);
    await this.saveCollections();
    this.context.logger.info(`删除集合: ${name}`);
  }

  /**
   * 获取所有集合名称
   * @returns 集合名称列表
   */
  async getCollections(): Promise<string[]> {
    return Array.from(this.collections.keys());
  }

  /**
   * 插入文档
   * @param collection 集合名称
   * @param document 文档对象
   * @returns 带有ID的文档
   */
  async insertDocument(collection: string, document: any): Promise<any> {
    if (!this.collections.has(collection)) {
      throw new Error(`集合 "${collection}" 不存在`);
    }
    
    // 确保每个文档都有唯一ID
    const id = document._id || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newDocument = { ...document, _id: id };
    
    const docs = this.collections.get(collection)!;
    docs.push(newDocument);
    await this.saveCollections();
    
    this.context.logger.info(`插入文档到集合 "${collection}": ${id}`);
    return newDocument;
  }

  /**
   * 批量插入文档
   * @param collection 集合名称
   * @param documents 文档对象数组
   * @returns 带有ID的文档数组
   */
  async insertDocuments(collection: string, documents: any[]): Promise<any[]> {
    if (!this.collections.has(collection)) {
      throw new Error(`集合 "${collection}" 不存在`);
    }
    
    const result = [];
    for (const doc of documents) {
      const newDoc = await this.insertDocument(collection, doc);
      result.push(newDoc);
    }
    
    this.context.logger.info(`批量插入 ${documents.length} 个文档到集合 "${collection}"`);
    return result;
  }

  /**
   * 查找文档
   * @param collection 集合名称
   * @param query 查询条件
   * @returns 匹配的文档数组
   */
  async findDocuments(collection: string, query: any = {}): Promise<any[]> {
    if (!this.collections.has(collection)) {
      throw new Error(`集合 "${collection}" 不存在`);
    }
    
    const docs = this.collections.get(collection)!;
    
    // 如果没有查询条件，返回所有文档
    if (Object.keys(query).length === 0) {
      this.context.logger.info(`查询集合 "${collection}" 的所有文档`);
      return [...docs];
    }
    
    // 简单的查询逻辑，支持精确匹配
    const results = docs.filter(doc => {
      for (const [key, value] of Object.entries(query)) {
        if (doc[key] !== value) {
          return false;
        }
      }
      return true;
    });
    
    this.context.logger.info(`查询集合 "${collection}": 找到 ${results.length} 个匹配文档`);
    return results;
  }

  /**
   * 根据ID查找文档
   * @param collection 集合名称
   * @param id 文档ID
   * @returns 文档对象或null
   */
  async findDocumentById(collection: string, id: string): Promise<any | null> {
    if (!this.collections.has(collection)) {
      throw new Error(`集合 "${collection}" 不存在`);
    }
    
    const docs = this.collections.get(collection)!;
    const doc = docs.find(d => d._id === id);
    
    if (doc) {
      this.context.logger.info(`在集合 "${collection}" 中找到文档: ${id}`);
    } else {
      this.context.logger.info(`在集合 "${collection}" 中未找到文档: ${id}`);
    }
    
    return doc || null;
  }

  /**
   * 更新文档
   * @param collection 集合名称
   * @param id 文档ID
   * @param update 更新数据
   * @returns 更新后的文档
   */
  async updateDocument(collection: string, id: string, update: any): Promise<any | null> {
    if (!this.collections.has(collection)) {
      throw new Error(`集合 "${collection}" 不存在`);
    }
    
    const docs = this.collections.get(collection)!;
    const index = docs.findIndex(d => d._id === id);
    
    if (index === -1) {
      this.context.logger.info(`在集合 "${collection}" 中未找到文档: ${id}`);
      return null;
    }
    
    // 确保ID不会被修改
    const updatedDoc = { ...docs[index], ...update, _id: id };
    docs[index] = updatedDoc;
    await this.saveCollections();
    
    this.context.logger.info(`更新集合 "${collection}" 中的文档: ${id}`);
    return updatedDoc;
  }

  /**
   * 删除文档
   * @param collection 集合名称
   * @param id 文档ID
   * @returns 是否成功删除
   */
  async deleteDocument(collection: string, id: string): Promise<boolean> {
    if (!this.collections.has(collection)) {
      throw new Error(`集合 "${collection}" 不存在`);
    }
    
    const docs = this.collections.get(collection)!;
    const index = docs.findIndex(d => d._id === id);
    
    if (index === -1) {
      this.context.logger.info(`在集合 "${collection}" 中未找到文档: ${id}`);
      return false;
    }
    
    docs.splice(index, 1);
    await this.saveCollections();
    
    this.context.logger.info(`删除集合 "${collection}" 中的文档: ${id}`);
    return true;
  }

  /**
   * 清空集合
   * @param collection 集合名称
   */
  async clearCollection(collection: string): Promise<void> {
    if (!this.collections.has(collection)) {
      throw new Error(`集合 "${collection}" 不存在`);
    }
    
    this.collections.set(collection, []);
    await this.saveCollections();
    
    this.context.logger.info(`清空集合: ${collection}`);
  }
}

// 插件定义
const databasePluginDefinition: PluginDefinition = {
  manifest: {
    id: 'database-plugin',
    name: '数据库插件',
    description: '提供简单的数据存储和查询功能',
    version: '1.0.0',
    author: 'Lumos团队',
    permissions: [],
    main: 'index.js'
  },
  setup: async (context: PluginContext) => {
    const plugin = new DatabasePlugin(context);
    
    // 注册集合管理命令
    context.api.registerCommand('createCollection', async (args: { name: string }) => {
      await plugin.createCollection(args.name);
      return { success: true };
    });
    
    context.api.registerCommand('deleteCollection', async (args: { name: string }) => {
      await plugin.deleteCollection(args.name);
      return { success: true };
    });
    
    context.api.registerCommand('getCollections', async () => {
      return await plugin.getCollections();
    });
    
    // 注册文档操作命令
    context.api.registerCommand('insertDocument', async (args: { collection: string, document: any }) => {
      return await plugin.insertDocument(args.collection, args.document);
    });
    
    context.api.registerCommand('insertDocuments', async (args: { collection: string, documents: any[] }) => {
      return await plugin.insertDocuments(args.collection, args.documents);
    });
    
    context.api.registerCommand('findDocuments', async (args: { collection: string, query?: any }) => {
      return await plugin.findDocuments(args.collection, args.query);
    });
    
    context.api.registerCommand('findDocumentById', async (args: { collection: string, id: string }) => {
      return await plugin.findDocumentById(args.collection, args.id);
    });
    
    context.api.registerCommand('updateDocument', async (args: { collection: string, id: string, update: any }) => {
      return await plugin.updateDocument(args.collection, args.id, args.update);
    });
    
    context.api.registerCommand('deleteDocument', async (args: { collection: string, id: string }) => {
      return await plugin.deleteDocument(args.collection, args.id);
    });
    
    context.api.registerCommand('clearCollection', async (args: { collection: string }) => {
      await plugin.clearCollection(args.collection);
      return { success: true };
    });
    
    context.logger.info('数据库插件初始化完成');
  },
  
  onInstall: async () => {
    console.log('数据库插件安装完成');
  },
  
  onUninstall: async () => {
    console.log('数据库插件已卸载');
  },
  
  onEnable: async () => {
    console.log('数据库插件已启用');
  },
  
  onDisable: async () => {
    console.log('数据库插件已禁用');
  }
};

export default databasePluginDefinition; 