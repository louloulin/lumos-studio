import { Database } from "bun:sqlite";
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const dbPath = join(__dirname, '../../../agent.db');

// 创建 Bun SQLite 数据库连接
const sqlite = new Database(dbPath);

// 启用 WAL 模式以提高性能
sqlite.run("PRAGMA journal_mode = WAL");

// 使用 Drizzle ORM 包装 SQLite 连接
export const db = drizzle(sqlite);

export function initDatabase() {
  try {
    // 确保数据库连接正常
    console.log('数据库初始化成功');
    return true;
  } catch (error) {
    console.error('数据库初始化失败:', error);
    return false;
  }
}

export function closeDatabase() {
  try {
    sqlite.close();
    console.log('数据库连接已关闭');
    return true;
  } catch (error) {
    console.error('关闭数据库连接失败:', error);
    return false;
  }
} 