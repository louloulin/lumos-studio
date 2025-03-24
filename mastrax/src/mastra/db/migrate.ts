import { migrate } from 'drizzle-orm/libsql/migrator';
import { db } from './index';

async function main() {
  try {
    console.log('开始数据库迁移...');
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('数据库迁移完成！');
  } catch (error) {
    console.error('数据库迁移失败:', error);
    process.exit(1);
  }
}

main(); 