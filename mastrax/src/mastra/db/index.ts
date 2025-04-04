import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import * as schema from './schema';
import { eq } from 'drizzle-orm';
import { existsSync } from 'fs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// 获取数据库文件的绝对路径
function getDatabasePath() {
  // 优先使用环境变量
  if (process.env.MASTRA_DB_PATH) {
    console.log('使用环境变量配置的数据库路径: ', process.env.MASTRA_DB_PATH);
    // 检查环境变量是否已经包含file:前缀
    if (process.env.MASTRA_DB_PATH.startsWith('file:')) {
      return process.env.MASTRA_DB_PATH;
    } else {
      // 添加file:前缀
      return `file:${process.env.MASTRA_DB_PATH}`;
    }
  }
  
  // 默认路径
  const defaultPath = '/Users/louloulin/Documents/linchong/crop/lumos-studio/lumos-studio/agent.db';
  console.log('使用默认数据库路径: ', defaultPath);
  return `file:${defaultPath}`;
}

const dbPath = getDatabasePath();

// 创建 libsql 客户端
export const client = createClient({
  url: dbPath,
});

// 初始化 Drizzle ORM 并显式传入 schema
export const db = drizzle(client, { schema });

// 数据库初始化状态
let isInitialized = false;
let initializationError: Error | null = null;

// 初始化数据库 - 同步启动版本
export function initDatabaseSync() {
  if (isInitialized) {
    return isInitialized;
  }
  
  // 在应用启动时立即执行初始化
  console.log('开始同步初始化数据库...');
  
  initDatabase().then(success => {
    isInitialized = success;
    if (success) {
      console.log('数据库同步初始化成功');
    } else {
      console.error('数据库同步初始化失败');
    }
  }).catch(error => {
    initializationError = error;
    console.error('数据库同步初始化出错:', error);
  });
  
  return isInitialized;
}

// 检查数据库状态
export function getDatabaseStatus() {
  return {
    isInitialized,
    error: initializationError ? initializationError.message : null,
    dbPath
  };
}

// 初始化数据库
export async function initDatabase() {
  console.log('========== 开始数据库初始化 ==========');
  let validationPassed = true;
  
  try {
    // 1. 检查数据库连接和WAL模式
    console.log('1. 检查数据库连接和配置...');
    await client.execute('PRAGMA journal_mode = WAL');
    
    const walCheck = await client.execute('PRAGMA journal_mode');
    const journalMode = walCheck.rows[0].journal_mode;
    console.log('  - 日志模式:', journalMode);
    
    if (journalMode !== 'wal') {
      console.warn('  - 警告: WAL模式未启用，这可能影响性能和并发处理');
      validationPassed = false;
    }
    
    // 强制刷新WAL日志以防止锁定
    await client.execute('PRAGMA wal_checkpoint(FULL)');
    console.log('  - WAL检查点刷新完成');
    
    // 2. 检查SQLite版本
    const versionResult = await client.execute('SELECT sqlite_version()');
    console.log('  - SQLite版本:', versionResult.rows[0]['sqlite_version()']);
    
    // 3. 验证数据库表结构
    console.log('2. 验证数据库表结构...');
    const tablesResult = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
    const tableNames = tablesResult.rows.map(row => row.name);
    console.log(`  - 已存在的表 (${tableNames.length}):`, tableNames.join(', '));
    
    const requiredTables = ['agents', 'agent_logs'];
    const missingTables = requiredTables.filter(table => !tableNames.includes(table));
    
    if (missingTables.length > 0) {
      console.error(`  - 错误: 缺少必要的表: ${missingTables.join(', ')}`);
      validationPassed = false;
    } else {
      console.log('  - 所有必要的表都存在');
    }
    
    // 4. 验证agents表结构
    if (tableNames.includes('agents')) {
      const tableInfoResult = await client.execute('PRAGMA table_info(agents)');
      const columns = tableInfoResult.rows.map(row => row.name);
      console.log(`  - agents表字段 (${columns.length}):`, columns.join(', '));
      
      const requiredColumns = ['id', 'name', 'created_at', 'updated_at'];
      const missingColumns = requiredColumns.filter(col => !columns.includes(col));
      
      if (missingColumns.length > 0) {
        console.error(`  - 错误: agents表缺少必要的字段: ${missingColumns.join(', ')}`);
        validationPassed = false;
      }
    }
    
    // 5. 验证ORM能否正常工作
    console.log('3. 验证ORM功能...');
    try {
      // 测试查询
      const result = await db.select().from(schema.agents).limit(1);
      const count = result.length;
      console.log(`  - 查询测试: 成功 (${count} 条记录)`);
      
      // 测试插入和删除 - 仅在开发模式下执行
      if (process.env.NODE_ENV === 'development') {
        const testId = `test-${Date.now()}`;
        await db.insert(schema.agents).values({
          id: testId,
          name: '测试智能体',
          createdAt: Math.floor(Date.now() / 1000),
          updatedAt: Math.floor(Date.now() / 1000)
        });
        console.log('  - 插入测试: 成功');
        
        await db.delete(schema.agents).where(eq(schema.agents.id, testId));
        console.log('  - 删除测试: 成功');
      }
    } catch (ormError) {
      console.error('  - ORM操作失败:', ormError);
      validationPassed = false;
    }
    
    if (validationPassed) {
      console.log('========== 数据库初始化成功 ==========');
      isInitialized = true;
    } else {
      console.warn('========== 数据库初始化完成，但存在警告 ==========');
      isInitialized = false;
    }
    return validationPassed;
  } catch (error) {
    console.error('========== 数据库初始化失败 ==========', error);
    initializationError = error instanceof Error ? error : new Error(String(error));
    isInitialized = false;
    return false;
  }
}

// 关闭数据库连接
export async function closeDatabase() {
  try {
    // 强制刷新WAL日志
    await client.execute('PRAGMA wal_checkpoint(FULL)');
    await client.close();
    console.log('数据库连接已关闭');
    return true;
  } catch (error) {
    console.error('关闭数据库连接失败:', error);
    return false;
  }
} 