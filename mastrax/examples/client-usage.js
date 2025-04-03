// 示例：如何正确调用Mastrax工具API
import { Mastra } from '@mastra/client-js';

// 初始化Mastra客户端
const mastra = new Mastra({
  baseUrl: 'http://localhost:3000', // 指向你的Mastrax服务
});

// 示例1：创建一个新智能体
async function createAgent() {
  try {
    const response = await mastra.runTool('agent-storage', {
      data: {
        operation: 'create',
        agent: {
          name: '测试智能体',
          description: '这是一个测试智能体',
          instructions: '你是一个有用的助手',
          model: 'gpt-4-turbo',
          type: 'general',
          categories: ['测试', '演示']
        }
      }
    });
    
    console.log('创建智能体成功:', response);
    return response.id; // 返回新创建的智能体ID
  } catch (error) {
    console.error('创建智能体失败:', error);
    throw error;
  }
}

// 示例2：获取一个智能体
async function getAgent(agentId) {
  try {
    const response = await mastra.runTool('agent-storage', {
      data: {
        operation: 'get',
        agentId: agentId
      }
    });
    
    console.log('获取智能体成功:', response);
    return response;
  } catch (error) {
    console.error('获取智能体失败:', error);
    throw error;
  }
}

// 示例3：更新一个智能体
async function updateAgent(agentId) {
  try {
    const response = await mastra.runTool('agent-storage', {
      data: {
        operation: 'update',
        agent: {
          id: agentId,
          name: '更新后的智能体名称',
          description: '这是更新后的描述'
        }
      }
    });
    
    console.log('更新智能体成功:', response);
    return response;
  } catch (error) {
    console.error('更新智能体失败:', error);
    throw error;
  }
}

// 示例4：获取所有智能体
async function getAllAgents() {
  try {
    const response = await mastra.runTool('agent-storage', {
      data: {
        operation: 'getAll'
      }
    });
    
    console.log('获取所有智能体成功:', response);
    return response;
  } catch (error) {
    console.error('获取所有智能体失败:', error);
    throw error;
  }
}

// 示例5：删除一个智能体
async function deleteAgent(agentId) {
  try {
    const response = await mastra.runTool('agent-storage', {
      data: {
        operation: 'delete',
        agentId: agentId
      }
    });
    
    console.log('删除智能体成功:', response);
    return response;
  } catch (error) {
    console.error('删除智能体失败:', error);
    throw error;
  }
}

// 示例6：使用调试工具获取系统信息
async function getSystemInfo() {
  try {
    const response = await mastra.runTool('debug-tool', {
      data: {
        action: 'info'
      }
    });
    
    console.log('系统信息:', response);
    return response;
  } catch (error) {
    console.error('获取系统信息失败:', error);
    throw error;
  }
}

// 示例7：使用调试工具检查API格式
async function inspectApiFormat() {
  try {
    const response = await mastra.runTool('debug-tool', {
      data: {
        action: 'inspect-api-format'
      }
    });
    
    console.log('API格式检查结果:', response);
    return response;
  } catch (error) {
    console.error('API格式检查失败:', error);
    throw error;
  }
}

// 示例8：使用调试工具检查请求
async function inspectRequest() {
  try {
    const response = await mastra.runTool('debug-tool', {
      data: {
        action: 'inspect-request',
        params: {
          customParam: '这是自定义参数',
          timestamp: Date.now()
        }
      }
    });
    
    console.log('请求检查结果:', response);
    return response;
  } catch (error) {
    console.error('请求检查失败:', error);
    throw error;
  }
}

// 常见错误演示：没有提供data对象
async function wrongWayToCallApi() {
  try {
    // 错误示例 - 不要这样做！
    const response = await mastra.runTool('agent-storage', {
      operation: 'getAll' // 缺少data包装
    });
    
    console.log('这行代码不会执行，因为会抛出错误');
  } catch (error) {
    console.error('错误调用API:', error);
    // 正确的修复方法是添加data对象
    const fixedResponse = await mastra.runTool('agent-storage', {
      data: {
        operation: 'getAll'
      }
    });
    console.log('修复后的调用:', fixedResponse);
  }
}

// 完整演示流程
async function runDemo() {
  console.log('=== Mastrax API 使用示例 ===');
  
  // 1. 获取系统信息
  await getSystemInfo();
  
  // 2. 创建一个智能体
  const agentId = await createAgent();
  
  // 3. 获取该智能体
  await getAgent(agentId);
  
  // 4. 更新该智能体
  await updateAgent(agentId);
  
  // 5. 获取所有智能体
  await getAllAgents();
  
  // 6. 删除该智能体
  await deleteAgent(agentId);
  
  // 7. 运行API格式检查
  await inspectApiFormat();
  
  // 8. 检查请求
  await inspectRequest();
  
  // 9. 演示常见错误
  await wrongWayToCallApi();
  
  console.log('=== 演示完成 ===');
}

// 执行演示
runDemo().catch(console.error);

// 导出函数以便单独测试
export {
  createAgent,
  getAgent,
  updateAgent,
  getAllAgents,
  deleteAgent,
  getSystemInfo,
  inspectApiFormat,
  inspectRequest,
  wrongWayToCallApi
};