import { getInstalledAgents, getInstalledAgent } from './agents';

async function testAgentFunctions() {
  console.log('正在获取所有已安装的智能体...');
  const agents = await getInstalledAgents();
  console.log('已安装的智能体列表:', agents);

  if (agents.length > 0) {
    console.log('\n正在获取第一个智能体的详细信息...');
    const firstAgent = await getInstalledAgent(agents[0].id);
    console.log('智能体详细信息:', firstAgent);
  }
}

testAgentFunctions().catch(console.error); 