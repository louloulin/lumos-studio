import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const dbPath = join(__dirname, '../../../agent.db');

// 创建 libsql 客户端
const client = createClient({
  url: `file:${dbPath}`,
});

// 初始化 Drizzle ORM
export const db = drizzle(client);

// 初始化数据库
export async function initDatabase() {
  try {
    // 确保数据库连接正常
    await client.execute('PRAGMA journal_mode = WAL');
    console.log('数据库初始化成功');
    return true;
  } catch (error) {
    console.error('数据库初始化失败:', error);
    return false;
  }
}

// 关闭数据库连接
export async function closeDatabase() {
  try {
    await client.close();
    console.log('数据库连接已关闭');
    return true;
  } catch (error) {
    console.error('关闭数据库连接失败:', error);
    return false;
  }
} 