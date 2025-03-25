import { migrate } from 'drizzle-orm/libsql/migrator';
import { db } from './index';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const migrationsFolder = path.join(__dirname, '../../../drizzle');

async function main() {
  try {
    console.log('开始数据库迁移...');
    console.log(`使用迁移文件夹: ${migrationsFolder}`);
    await migrate(db, { migrationsFolder });
    console.log('数据库迁移完成！');
  } catch (error) {
    console.error('数据库迁移失败:', error);
    console.error(error);
    process.exit(1);
  }
}

main(); 