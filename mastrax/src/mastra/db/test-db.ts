import { db, initDatabase } from './index';
import { agents } from './schema';
import { eq } from 'drizzle-orm';

/**
 * 数据库诊断程序 - 用来测试数据库连接和验证表是否正常
 */
async function testDatabase() {
  console.log('========== 数据库诊断开始 ==========');
  
  try {
    // 1. 尝试初始化数据库
    console.log('1. 测试数据库初始化...');
    const initResult = await initDatabase();
    console.log('   初始化结果:', initResult ? '成功' : '失败');
    
    // 2. 获取SQLite版本
    console.log('\n2. 检查SQLite版本...');
    try {
      const versionResult = await db.$client.execute('SELECT sqlite_version()');
      console.log('   SQLite版本:', versionResult.rows[0]['sqlite_version()']);
    } catch (error) {
      console.error('   获取SQLite版本失败:', error);
    }
    
    // 3. 列出所有表
    console.log('\n3. 列出数据库中的所有表...');
    try {
      const tablesResult = await db.$client.execute("SELECT name FROM sqlite_master WHERE type='table'");
      console.log('   表清单:');
      for (const row of tablesResult.rows) {
        console.log(`   - ${row.name}`);
      }
    } catch (error) {
      console.error('   获取表列表失败:', error);
    }
    
    // 4. 检查agents表结构
    console.log('\n4. 检查agents表结构...');
    try {
      const tableInfoResult = await db.$client.execute('PRAGMA table_info(agents)');
      console.log('   agents表字段:');
      for (const row of tableInfoResult.rows) {
        console.log(`   - ${row.name} (${row.type})`);
      }
    } catch (error) {
      console.error('   获取agents表结构失败:', error);
    }
    
    // 5. 尝试查询agents表
    console.log('\n5. 尝试查询agents表...');
    try {
      const agentsResult = await db.select().from(agents).limit(5);
      console.log(`   成功查询到 ${agentsResult.length} 个智能体`);
    } catch (error) {
      console.error('   查询agents表失败:', error);
    }
    
    // 6. 尝试插入和删除测试数据
    console.log('\n6. 尝试测试数据操作...');
    const testAgentId = `test-agent-${Date.now()}`;
    try {
      // 插入测试数据
      console.log('   尝试插入测试数据...');
      await db.insert(agents).values({
        id: testAgentId,
        name: '测试智能体',
        createdAt: Math.floor(Date.now() / 1000),
        updatedAt: Math.floor(Date.now() / 1000)
      });
      console.log('   插入测试数据成功');
      
      // 查询刚插入的数据
      console.log('   尝试查询刚插入的数据...');
      const testAgent = await db.select().from(agents).where(eq(agents.id, testAgentId));
      console.log('   查询结果:', testAgent.length > 0 ? '成功' : '失败');
      
      // 删除测试数据
      console.log('   尝试删除测试数据...');
      await db.delete(agents).where(eq(agents.id, testAgentId));
      console.log('   删除测试数据成功');
    } catch (error) {
      console.error('   测试数据操作失败:', error);
    }
    
  } catch (error) {
    console.error('诊断过程中出错:', error);
  }
  
  console.log('========== 数据库诊断结束 ==========');
}

// 立即执行测试
testDatabase().catch(console.error);
