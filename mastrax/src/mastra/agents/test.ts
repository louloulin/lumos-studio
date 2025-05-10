import { getInstalledAgents, getInstalledAgent } from './index';
import { agentStorageTool } from '../tools';

async function testAgents() {
  try {
    console.log('测试获取已安装的智能体...');
    const agents = await getInstalledAgents();
    console.log('已安装的智能体:', agents);

    if (agents.length > 0) {
      const firstAgentId = agents[0].id;
      console.log(`测试获取智能体详情 (ID: ${firstAgentId})...`);
      const agent = await getInstalledAgent(firstAgentId);
      console.log('智能体详情:', agent);
    } else {
      console.log('没有安装的智能体，跳过测试获取智能体详情');
    }

    // 分析用户请求数据结构
    console.log('\n分析用户请求数据结构:');
    const userRequest = {
      data: {
        operation: "create",
        agent: {
          name: "新建智能体12321",
          description: "这是一个新建的智能体，您可以根据需要自定义它的行为和功能。",
          instructions: "你是一个有用的AI助手，专注于提供准确和有帮助的回答。请始终保持友好和专业的态度。",
          model: "gpt-4-turbo",
          temperature: 0.7,
          maxTokens: 4000,
          tools: [
            {
              id: "web-search",
              name: "网络搜索",
              description: "从互联网搜索最新信息",
              icon: "🔍",
              parameters: [{
                name: "query",
                type: "string",
                description: "搜索查询",
                required: true
              }]
            }
          ],
          systemAgent: false
        }
      }
    };
    console.log('用户请求数据:', JSON.stringify(userRequest, null, 2));
    
    // 测试使用用户请求中的数据结构，但使用正确的格式
    if (agentStorageTool && agentStorageTool.execute) {
      console.log('\n测试使用用户数据结构但用正确的参数格式:');
      
      // 提取agent数据并确保tools字段是字符串
      const agentData = {
        ...userRequest.data.agent,
        tools: JSON.stringify(userRequest.data.agent.tools)
      };
      
      // 直接传递参数，不包装在data对象中
      const createResult = await (agentStorageTool.execute as any)({
        operation: userRequest.data.operation,
        agent: agentData
      });
      
      console.log('创建结果:', createResult);
    } else {
      console.log('agentStorageTool 未定义或execute方法不存在');
    }

    console.log('测试完成!');
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testAgents(); 