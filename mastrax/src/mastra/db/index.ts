import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const dbPath = join(__dirname, '../../../agent.db');

const client = createClient({
  url: `file:${dbPath}`,
});

export const db = drizzle(client);

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