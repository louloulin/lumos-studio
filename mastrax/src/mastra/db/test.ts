import { db } from './index';
import { agents, agentLogs } from './schema';
import { eq } from 'drizzle-orm';

async function main() {
  try {
    // 创建一个测试智能体
    const now = Math.floor(Date.now() / 1000);
    const testAgent = {
      id: `test-agent-${now}`,
      name: '测试智能体',
      description: '用于测试数据库的智能体',
      instructions: '这是一个测试指令',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 2000,
      tools: JSON.stringify(['tool1', 'tool2']),
      systemAgent: 0,
      createdAt: now,
      updatedAt: now,
    };

    console.log('创建测试智能体...');
    await db.insert(agents).values(testAgent);

    // 创建一个测试日志
    const testLog = {
      id: `test-log-${now}`,
      agentId: testAgent.id,
      operation: 'create',
      timestamp: now,
      details: JSON.stringify({ action: 'test' }),
      status: 'success',
      error: null,
    };

    console.log('创建测试日志...');
    await db.insert(agentLogs).values(testLog);

    // 查询智能体
    console.log('查询智能体...');
    const agent = await db.select().from(agents).where(eq(agents.id, testAgent.id));
    console.log('找到智能体:', agent);

    // 查询日志
    console.log('查询日志...');
    const logs = await db.select().from(agentLogs).where(eq(agentLogs.agentId, testAgent.id));
    console.log('找到日志:', logs);

    console.log('测试完成！');
  } catch (error) {
    console.error('测试失败:', error);
    process.exit(1);
  }
}

main(); 